
import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { MAJOR_CITIES } from '../constants';
import { SavedLocation, MapClickEvent } from '../types';
import { format, toZonedTime } from 'date-fns-tz';
import tzlookup from 'tz-lookup';
import { Plus, Minus, Maximize, Globe, Map as MapIcon } from 'lucide-react';
import { t } from '../src/lib/i18n';

// Shareable camera state: map type (globe vs 2D), globe rotation + zoom, and the
// 2D pan/zoom transform.
export interface MapView {
  g: boolean;
  r: [number, number, number];
  z: number;
  t: [number, number, number]; // [x, y, k]
}

interface MapChartProps {
  currentTime: Date;
  onMapClick: (data: MapClickEvent) => void;
  locations: SavedLocation[];
  centerTarget: [number, number] | null;
  onCenterComplete: () => void;
  initialView?: MapView | null;
  onViewChange?: (v: MapView) => void;
}

export const MapChart: React.FC<MapChartProps> = ({ currentTime, onMapClick, locations, centerTarget, onCenterComplete, initialView, onViewChange }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapGroupRef = useRef<SVGGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const currentTimeRef = useRef(currentTime);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);
  
  const [mapData, setMapData] = useState<{ features: any[], borders: any } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 960, height: 500 });
  
  const [isGlobe, setIsGlobe] = useState(() => initialView?.g ?? true);
  // Slow idle spin on a fresh visit; a shared link keeps its exact camera. Any user gesture stops it.
  const [autoRotate, setAutoRotate] = useState(
    () => !initialView && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [hoveredInfo, setHoveredInfo] = useState<{
    x: number;
    y: number;
    name: string;
    time: string;
    lat?: number;
    lng?: number;
    timezone?: string;
  } | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState<[number, number, number]>(() => initialView?.r ?? [0, 0, 0]);
  const [globeZoom, setGlobeZoom] = useState(() => initialView?.z ?? 1);
  const [mapTransform, setMapTransform] = useState(() =>
    initialView ? d3.zoomIdentity.translate(initialView.t[0], initialView.t[1]).scale(initialView.t[2]) : d3.zoomIdentity
  );


  const rotationRef = useRef(rotation);
  const globeZoomRef = useRef(globeZoom);
  const inertiaRef = useRef<number | null>(null);
  const behaviorModeRef = useRef(isGlobe);
  const velocityRef = useRef<[number, number]>([0, 0]);


  useEffect(() => {
    rotationRef.current = rotation;
    globeZoomRef.current = globeZoom;
  }, [rotation, globeZoom]);

  // Report the current camera state up so App can put it in a share link.
  useEffect(() => {
    onViewChange?.({ g: isGlobe, r: rotation, z: globeZoom, t: [mapTransform.x, mapTransform.y, mapTransform.k] });
  }, [isGlobe, rotation, globeZoom, mapTransform, onViewChange]);

  useEffect(() => {
    if (!isGlobe || !autoRotate) return;
    const DEG_PER_SEC = 4;
    let last = performance.now();
    let frame = requestAnimationFrame(function spin(now) {
      const dt = Math.min(now - last, 100); // clamp so a backgrounded tab doesn't jump
      last = now;
      setRotation(r => [r[0] + (DEG_PER_SEC * dt) / 1000, r[1], r[2]]);
      frame = requestAnimationFrame(spin);
    });
    return () => cancelAnimationFrame(frame);
  }, [isGlobe, autoRotate]);

  useEffect(() => {
    return () => {
      if (inertiaRef.current) {
        cancelAnimationFrame(inertiaRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Self-hosted (was jsdelivr) to drop the third-party runtime dependency.
    fetch('/countries-110m.json')
      .then(response => {
        if (!response.ok) throw new Error(`Map data responded ${response.status}`);
        return response.json();
      })
      .then(data => {
        const features = (topojson.feature(data, data.objects.countries) as any).features;
        const borders = topojson.mesh(data, data.objects.countries);
        setMapData({ features, borders });
      })
      .catch(err => console.error('Failed to load map data', err));

    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth: width, clientHeight: height } = containerRef.current;
        setDimensions(prev => (prev.width === width && prev.height === height ? prev : { width, height }));
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const projection = useMemo(() => {
    const { width, height } = dimensions;
    
    if (isGlobe) {
      const baseScale = Math.min(width, height) / 2.2;
      return d3.geoOrthographic()
        .scale(baseScale * globeZoom)
        .translate([width / 2, height / 2])
        .rotate(rotation)
        .precision(0.5) // Reduced precision for better performance
        .clipAngle(90);
    } else {
      return d3.geoEquirectangular()
        .fitSize([width, height], mapData ? { type: "FeatureCollection", features: mapData.features } : { type: "Sphere" })
        .translate([width / 2, height / 2 + (height * 0.05)]);
    }
  }, [dimensions, mapData, isGlobe, rotation, globeZoom]);

  const pathGenerator = useMemo(() => d3.geoPath().projection(projection), [projection]);

  // --- Canvas Rendering for Globe ---
  useLayoutEffect(() => {
    if (!isGlobe || !canvasRef.current || !mapData || !dimensions.width) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const { width, height } = dimensions;
    const canvasPath = d3.geoPath(projection, context);

    context.clearRect(0, 0, width, height);

    // Draw Sphere
    context.beginPath();
    canvasPath({ type: "Sphere" });
    context.fillStyle = "#050505";
    context.fill();
    context.strokeStyle = "#27272a";
    context.lineWidth = 1.5;
    context.stroke();

    // Draw Graticule
    context.beginPath();
    canvasPath(d3.geoGraticule10());
    context.strokeStyle = "#27272a";
    context.lineWidth = 0.5;
    context.globalAlpha = 0.3;
    context.stroke();
    context.globalAlpha = 1.0;

    // Draw Countries
    context.beginPath();
    mapData.features.forEach(feature => {
      if (hoveredCountry !== feature.properties?.name) {
        canvasPath(feature);
      }
    });
    context.fillStyle = "#09090b"; // Match 2D land fill (was rgba(39,39,42,0.4) — too opaque)
    context.fill();

    // Draw hovered country with highlight
    if (hoveredCountry) {
      const feature = mapData.features.find(f => f.properties?.name === hoveredCountry);
      if (feature) {
        context.beginPath();
        canvasPath(feature);
        context.fillStyle = "rgba(255, 255, 255, 0.15)"; // Transparent white highlight
        context.fill();
        context.strokeStyle = "rgba(255, 255, 255, 0.4)";
        context.lineWidth = 1;
        context.stroke();
      }
    }
    
    // Draw Borders
    context.beginPath();
    canvasPath(mapData.borders);
    context.strokeStyle = "#3f3f46"; // Match 2D country stroke (was #a1a1aa @0.5)
    context.lineWidth = 0.8;
    context.stroke();

  }, [isGlobe, projection, mapData, dimensions, hoveredCountry]);

  const graticule = useMemo(() => d3.geoGraticule10(), []);

  // --- Centering Animation ---
  useEffect(() => {
    if (!isGlobe || !centerTarget || !svgRef.current || !zoomBehaviorRef.current) return;

    const [lng, lat] = centerTarget;
    const svg = d3.select(svgRef.current);
    const zoom = zoomBehaviorRef.current;

    svg.interrupt("centering");
    setAutoRotate(false);
    if (inertiaRef.current) {
        cancelAnimationFrame(inertiaRef.current);
        inertiaRef.current = null;
    }

    const p1: [number, number] = [-rotationRef.current[0], -rotationRef.current[1]];
    const p2: [number, number] = [lng, lat];
    const interpolator = d3.geoInterpolate(p1, p2);
    
    const currentTransform = d3.zoomTransform(svg.node() as Element);
    zoom.transform(svg, currentTransform);

    svg.transition("centering")
        .duration(1000)
        .ease(d3.easeCubicOut)
        .tween('rotate', () => t => {
            const [l, a] = interpolator(t);
            setRotation([-l, -a, rotationRef.current[2]]);
        })
        .on('end', onCenterComplete)
        .on('interrupt', onCenterComplete);

  }, [centerTarget, onCenterComplete, isGlobe]);

  useEffect(() => {
    if (isGlobe || !centerTarget || !svgRef.current) return;

    const [lng, lat] = centerTarget;
    const svg = d3.select(svgRef.current);

    if (zoomBehaviorRef.current && projection.invert) {
        const [tx, ty] = projection([lng, lat]) as [number, number];
        const zoom = zoomBehaviorRef.current;
        svg.transition("centering")
            .duration(750)
            .ease(d3.easeCubicOut)
            .call(transition => zoom.translateTo(transition, tx, ty))
            .on('end', onCenterComplete)
            .on('interrupt', onCenterComplete);
    } else {
        onCenterComplete();
    }
  }, [centerTarget, onCenterComplete, isGlobe, projection]);


  const findCountryAt = (lng: number, lat: number) => {
    if (!mapData) return undefined;
    const country = mapData.features.find(f => d3.geoContains(f, [lng, lat]));
    return country?.properties?.name;
  };

  const shortenName = (name: string) => {
    const mapping: Record<string, string> = {
      "Israel": "Occupied territories",
      "United States of America": "USA",
      "United Kingdom": "UK",
      "Russian Federation": "Russia",
      "United Arab Emirates": "UAE",
      "Democratic Republic of the Congo": "DR Congo",
      "Central African Republic": "CAR",
      "Dominican Republic": "Dom. Rep.",
      "Equatorial Guinea": "Eq. Guinea",
      "Papua New Guinea": "PNG",
      "Solomon Islands": "Solomon Is.",
      "Marshall Islands": "Marshall Is.",
      "Federated States of Micronesia": "Micronesia",
      "Saint Vincent and the Grenadines": "St. Vincent",
      "Trinidad and Tobago": "Trinidad",
      "Antigua and Barbuda": "Antigua",
      "Saint Kitts and Nevis": "St. Kitts",
      "Bosnia and Herzegovina": "Bosnia",
      "North Macedonia": "N. Macedonia",
      "Czech Republic": "Czechia",
    };
    return mapping[name] || name;
  };

  const getTimeAt = React.useCallback((lat: number, lng: number, timezone?: string) => {
    let tz = timezone;
    const time = currentTimeRef.current;
    if (!tz) {
      try {
        tz = tzlookup(lat, lng);
      } catch (e) {
        const offset = lng / 15;
        const shifted = new Date(time.getTime() + (offset * 3600 * 1000));
        return format(shifted, 'HH:mm', { timeZone: 'UTC' });
      }
    }
    const date = toZonedTime(time, tz);
    return format(date, 'HH:mm');
  }, []);

  // Update hovered info time when currentTime changes
  useEffect(() => {
    if (hoveredInfo && hoveredInfo.lat !== undefined && hoveredInfo.lng !== undefined) {
      setHoveredInfo(prev => prev ? {
        ...prev,
        time: getTimeAt(prev.lat!, prev.lng!, prev.timezone)
      } : null);
    }
  }, [currentTime, getTimeAt]);

  // --- Interaction Handling ---
  useEffect(() => {
    if (!svgRef.current || !mapGroupRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(mapGroupRef.current);
    
    // Only a map type switch cancels centering: this effect also re-runs on resize,
    // which on phones fires mid-animation when the keyboard or URL bar moves.
    if (behaviorModeRef.current !== isGlobe) {
      behaviorModeRef.current = isGlobe;
      svg.interrupt("centering");
    }
    svg.on(".zoom", null);
    svg.on(".drag", null);
    
    if (inertiaRef.current) {
      cancelAnimationFrame(inertiaRef.current);
      inertiaRef.current = null;
    }

    if (isGlobe) {
      g.attr("transform", null);
      let totalMovement = 0;
      const { width, height } = dimensions;
      const baseScale = Math.min(width, height) / 2.2;

      const drag = d3.drag<SVGSVGElement, unknown>()
        .filter((event) => {
           // Only allow single-touch for drag (rotation)
           if (event.touches) return event.touches.length === 1;
           return !event.button; 
        })
        .on("start", (event) => {
          svg.interrupt("centering");
          setAutoRotate(false);
          if (inertiaRef.current) {
            cancelAnimationFrame(inertiaRef.current);
            inertiaRef.current = null;
          }
          velocityRef.current = [0, 0];
          totalMovement = 0;
          svg.style("cursor", "grabbing");
        })
        .on("drag", (event) => {
          totalMovement += Math.hypot(event.dx, event.dy);
          const currentScale = baseScale * globeZoomRef.current;
          const sensitivity = 80 / currentScale;
          const dx = event.dx * sensitivity;
          const dy = event.dy * sensitivity;
          velocityRef.current = [dx, dy];
          setRotation(prevRotation => {
              let newLon = prevRotation[0] + dx;
              let newLat = prevRotation[1] - dy;
              newLat = Math.max(-90, Math.min(90, newLat));
              return [newLon, newLat, prevRotation[2]];
          });
        })
        .on("end", (event) => {
          svg.style("cursor", "crosshair");
          if (Math.hypot(...velocityRef.current) > 0.1) {
            const inertiaLoop = () => {
              const decay = 0.95;
              let [vx, vy] = velocityRef.current;
              if (Math.abs(vx) < 0.01 && Math.abs(vy) < 0.01) {
                inertiaRef.current = null;
                return;
              }
              vx *= decay;
              vy *= decay;
              velocityRef.current = [vx, vy];
              setRotation(prevRotation => {
                let newLon = prevRotation[0] + vx;
                let newLat = prevRotation[1] - vy;
                newLat = Math.max(-90, Math.min(90, newLat));
                return [newLon, newLat, prevRotation[2]];
              });
              inertiaRef.current = requestAnimationFrame(inertiaLoop);
            };
            inertiaRef.current = requestAnimationFrame(inertiaLoop);
          }
          if (totalMovement < 10) {
             let clientX, clientY;
             if (event.sourceEvent.type === 'touchend') {
                const touch = event.sourceEvent.changedTouches[0];
                if (touch) { clientX = touch.clientX; clientY = touch.clientY; }
             } else {
                clientX = event.sourceEvent.clientX;
                clientY = event.sourceEvent.clientY;
             }
             if (clientX === undefined || clientY === undefined) return;

             // Check if the click was on a marker to avoid double trigger
             const target = event.sourceEvent.target as Element;
             if (target && target.tagName === 'circle' && target.classList.contains('cursor-pointer')) {
                return;
             }

             const rect = containerRef.current?.getBoundingClientRect();
             if (!rect) return;
             const relX = clientX - rect.left;
             const relY = clientY - rect.top;
             const tempProjection = d3.geoOrthographic().scale(baseScale * globeZoomRef.current).translate([width / 2, height / 2]).rotate(rotationRef.current).clipAngle(90);
             const coords = tempProjection.invert?.([relX, relY]);
             if (coords) {
               const [lng, lat] = coords;
               if (isFinite(lng) && isFinite(lat)) {
                 const country = findCountryAt(lng, lat);
                 const finalCountry = country === "Israel" ? "Occupied territories" : country;
                 onMapClick({ x: clientX, y: clientY, lat, lng, country: finalCountry });
               }
             }
          }
        });
      
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 8])
        .filter((event) => {
          // Allow wheel and multi-touch zoom
          if (event.type === 'wheel') return true;
          if (event.touches && event.touches.length > 1) return true;
          // Don't allow single-touch zoom (panning) on globe
          return false;
        })
        // sourceEvent is null for programmatic zooms: only a user gesture cancels centering.
        .on("start", (event) => { if (event.sourceEvent) { svg.interrupt("centering"); setAutoRotate(false); } })
        .on("zoom", (event) => {
          setGlobeZoom(event.transform.k);
        });

      svg.call(drag).style("cursor", "crosshair");
      svg.call(zoom).on("dblclick.zoom", null);
      svg.call(zoom.transform, d3.zoomIdentity.scale(globeZoomRef.current));
      zoomBehaviorRef.current = zoom;

      svg.on("mousemove", (event) => {
        const [relX, relY] = d3.pointer(event);
        const tempProjection = d3.geoOrthographic()
          .scale(baseScale * globeZoomRef.current)
          .translate([width / 2, height / 2])
          .rotate(rotationRef.current)
          .clipAngle(90);
        const coords = tempProjection.invert?.([relX, relY]);
        if (coords) {
          const [lng, lat] = coords;
          if (isFinite(lng) && isFinite(lat)) {
             const country = findCountryAt(lng, lat);
             const finalCountry = country === "Israel" ? "Occupied territories" : country;
             if (country) {
               const time = getTimeAt(lat, lng);
               setHoveredInfo({
                 x: event.clientX,
                 y: event.clientY,
                 name: shortenName(finalCountry),
                 time,
                 lat,
                 lng
               });
               setHoveredCountry(country);
               return;
             }
          }
        }
        setHoveredInfo(null);
        setHoveredCountry(null);
      }).on("mouseleave", () => {
        setHoveredInfo(null);
        setHoveredCountry(null);
      });

    } else { // 2D Map Logic
      const handle2DZoom = (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        setMapTransform(event.transform);
        setZoomLevel(event.transform.k);
      };

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 12])
        .translateExtent([[-100, -100], [dimensions.width + 100, dimensions.height + 100]])
        .on("start", (event) => { if (event.sourceEvent) { svg.interrupt("centering"); setAutoRotate(false); } })
        .on("zoom", handle2DZoom);

      zoomBehaviorRef.current = zoom;
      svg.call(zoom).on("dblclick.zoom", null);
      svg.style("cursor", "move");
      svg.call(zoom.transform, mapTransform);
    }

  }, [isGlobe, dimensions, onMapClick, mapData]);
  
  useEffect(() => {
    if (isGlobe || !mapGroupRef.current) return;
    d3.select(mapGroupRef.current)
      .selectAll("path.country")
      .attr("stroke-width", 0.5 / zoomLevel);
  }, [zoomLevel, isGlobe]);

  useLayoutEffect(() => {
    if (!mapData || !mapGroupRef.current) return;

    const group = d3.select(mapGroupRef.current);
    const staticGroup = group.select<SVGGElement>(".static-map-layer");
    if (staticGroup.empty()) return;

    // If globe mode, clear the SVG static layer as we use Canvas
    if (isGlobe) {
      staticGroup.selectAll("*").remove();
      return;
    }
    
    const sphereData: any[] = []; // No sphere in 2D
    staticGroup.selectAll("path.sphere").data(sphereData).join("path").attr("class", "sphere").attr("d", pathGenerator as any).attr("fill", "#050505").attr("stroke", "#27272a").attr("stroke-width", 1.5);

    const graticuleData: any[] = []; // No graticule in 2D
    staticGroup.selectAll("path.graticule").data(graticuleData).join("path").attr("class", "graticule").attr("d", pathGenerator as any).attr("fill", "none").attr("stroke", "#27272a").attr("stroke-width", 0.5).attr("stroke-opacity", 0.3);

    const fill = "#09090b"; 
    const hoverFill = "#18181b";
    const stroke = "#3f3f46"; 

    staticGroup.selectAll("path.country")
      .data(mapData.features)
      .join("path")
      .attr("class", "country")
      .attr("d", pathGenerator as any)
      .attr("fill", fill)
      .attr("stroke", stroke) 
      .style("pointer-events", "auto")
      .style("cursor", "crosshair")
      .on("click", (event, d: any) => {
         const [x, y] = d3.pointer(event, mapGroupRef.current);
         const coords = projection.invert?.([x, y]);
         if (coords) {
           const [lng, lat] = coords;
           onMapClick({ 
             x: event.clientX, 
             y: event.clientY, 
             lat, 
             lng, 
             country: d.properties?.name === "Israel" ? "Occupied territories" : d.properties?.name 
           });
         }
      })
      .on("mouseenter", function() { d3.select(this).attr("fill", hoverFill); })
      .on("mousemove", (event, d: any) => {
          const [x, y] = d3.pointer(event, mapGroupRef.current);
          const coords = projection.invert?.([x, y]);
          if (coords) {
            const [lng, lat] = coords;
            const time = getTimeAt(lat, lng);
            setHoveredInfo({
              x: event.clientX,
              y: event.clientY,
              name: shortenName(d.properties?.name === "Israel" ? "Occupied territories" : (d.properties?.name || "Unknown")),
              time,
              lat,
              lng
            });
          }
      })
      .on("mouseleave", function() { 
        d3.select(this).attr("fill", fill);
        setHoveredInfo(null);
      });
      
    d3.select(mapGroupRef.current).selectAll("path.country").attr("stroke-width", 0.5 / zoomLevel);

    const borderData: any[] = []; // No extra borders in 2D
    staticGroup.selectAll("path.borders").data(borderData).join("path").attr("class", "borders").attr("d", pathGenerator as any).attr("fill", "none").attr("stroke", "#a1a1aa").attr("stroke-width", 0.8).style("pointer-events", "none");

  }, [mapData, pathGenerator, projection, onMapClick, isGlobe, graticule, zoomLevel]);


  // --- Control Handlers ---
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      const zoom = zoomBehaviorRef.current;
      d3.select(svgRef.current!).transition().duration(isGlobe ? 250 : 300).call(transition => zoom.scaleBy(transition, 1.5));
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      const zoom = zoomBehaviorRef.current;
      d3.select(svgRef.current!).transition().duration(isGlobe ? 250 : 300).call(transition => zoom.scaleBy(transition, 0.66));
    }
  };

  const handleResetView = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current!);
    const zoom = zoomBehaviorRef.current;
    svg.interrupt("centering").interrupt("resetting");
  
    if (isGlobe) {
      if (inertiaRef.current) {
        cancelAnimationFrame(inertiaRef.current);
        inertiaRef.current = null;
      }
      const interpolator = d3.interpolate(rotationRef.current, [0, 0, 0]);
      svg.transition("resetting").duration(750).ease(d3.easeCubicOut).tween('rotate', () => t => setRotation(interpolator(t) as [number, number, number]));
      svg.transition("resetting").duration(750).ease(d3.easeCubicOut).call(transition => zoom.transform(transition, d3.zoomIdentity));
    } else {
      setMapTransform(d3.zoomIdentity);
      svg.transition().duration(500).call(transition => zoom.transform(transition, d3.zoomIdentity));
    }
  };

  const getTimeString = (loc: SavedLocation) => {
    let date;
    if (loc.timezone) {
      date = toZonedTime(currentTime, loc.timezone);
    } else {
       const shifted = new Date(currentTime.getTime() + (loc.lngOffset * 3600 * 1000));
       return format(shifted, 'HH:mm', { timeZone: 'UTC' });
    }
    return format(date, 'HH:mm');
  };

  const markerScale = isGlobe ? 1 : 1 / zoomLevel; 
  const textScale = isGlobe ? 1 : 1 / zoomLevel;

  // Helper to check if a coordinate is on the visible hemisphere of the globe
  const isPointVisible = (lng: number, lat: number) => {
    if (!isGlobe) return true;
    // The center of the visible hemisphere in geoOrthographic is [-rotation[0], -rotation[1]]
    const center: [number, number] = [-rotation[0], -rotation[1]];
    const distance = d3.geoDistance([lng, lat], center);
    return distance < Math.PI / 2;
  };

  return (
    <div ref={containerRef} className="w-full h-full md:min-h-[400px] relative overflow-hidden bg-black shadow-inner">
      <div className="absolute inset-0 pointer-events-none dot-pattern opacity-20" />
      
      {isGlobe && (
        <canvas 
          ref={canvasRef} 
          width={dimensions.width} 
          height={dimensions.height} 
          className="absolute inset-0 pointer-events-none"
        />
      )}

      <svg ref={svgRef} width="100%" height="100%" className={`relative z-10 touch-none ${isGlobe ? 'cursor-crosshair' : 'cursor-move'}`}>
         <g ref={mapGroupRef} transform={isGlobe ? undefined : mapTransform.toString()}>
            <g className="static-map-layer" />
            <g className="markers-layer">
                {MAJOR_CITIES.map(city => {
                  if (!isPointVisible(city.lng, city.lat)) return null;
                  const pos = projection([city.lng, city.lat]);
                  if (!pos) return null; 
                  return (
                    <circle 
                        key={`${city.name}-${city.country}`}
                        cx={pos[0]}
                        cy={pos[1]}
                        r={(isGlobe ? 2.5 : 2) * markerScale}
                        className={`fill-zinc-700 hover:fill-blue-500 transition-colors cursor-pointer`}
                        onMouseMove={(e) => {
                          e.stopPropagation();
                          const time = getTimeAt(city.lat, city.lng, city.timezone);
                          setHoveredInfo({
                            x: e.clientX,
                            y: e.clientY,
                            name: `${city.name}, ${shortenName(city.country)}`,
                            time,
                            lat: city.lat,
                            lng: city.lng,
                            timezone: city.timezone
                          });
                        }}
                        onMouseLeave={() => setHoveredInfo(null)}
                        onClick={(e) => {
                          e.stopPropagation(); 
                          onMapClick({ x: e.clientX, y: e.clientY, lat: city.lat, lng: city.lng, city: city });
                        }}
                    />
                  )
                })}
                {locations.map(loc => {
                  if (!isPointVisible(loc.lng, loc.lat)) return null;
                  const pos = projection([loc.lng, loc.lat]);
                  if (!pos) return null;
                  const timeStr = getTimeString(loc);
                  return (
                    <g key={loc.id} transform={`translate(${pos[0]}, ${pos[1]})`} className={isGlobe ? 'pointer-events-none' : ''}>
                        <circle r={8 * markerScale} className="fill-blue-500/10 animate-ping" />
                        <circle r={3 * markerScale} className="fill-blue-500 stroke-blue-400/20" strokeWidth={0.5 * markerScale} />
                        <line x1="0" y1={-3 * markerScale} x2="0" y2={-25 * markerScale} className="stroke-blue-500/30" strokeWidth={1 * markerScale} />
                        <g transform={`translate(0, ${-45 * markerScale}) scale(${textScale})`}>
                          <rect x="-35" y="0" width="70" height="32" rx="4" className="fill-black/80 stroke-zinc-700 stroke-1" />
                          <text x="0" y="14" className="text-[12px] font-mono font-bold fill-white pointer-events-none" textAnchor="middle" dominantBaseline="middle">{timeStr}</text>
                          <text x="0" y="26" className="text-[8px] fill-zinc-400 pointer-events-none uppercase" textAnchor="middle" dominantBaseline="middle">
                            {shortenName(loc.name.split(',')[0])}
                          </text>
                        </g>
                    </g>
                  )
                })}
            </g>
         </g>
      </svg>
      
      <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6 flex flex-col gap-2 z-40">
        <button 
          onClick={() => {
            const nextIsGlobe = !isGlobe;
            setIsGlobe(nextIsGlobe);
            if (nextIsGlobe) {
              handleResetView();
            } else {
              setZoomLevel(1);
              setMapTransform(d3.zoomIdentity);
            }
          }}
          className={`p-2 rounded-lg border transition-all shadow-lg ${isGlobe ? 'bg-blue-500 text-white border-blue-400' : 'bg-zinc-900/80 text-zinc-200 border-zinc-800 hover:bg-zinc-800'}`}
          title={isGlobe ? "Switch to 2D Map" : "Switch to 3D Globe"}
          aria-label={isGlobe ? "Switch to 2D Map" : "Switch to 3D Globe"}
        >
          {isGlobe ? <MapIcon className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
        </button>

        <div className="h-[1px] w-full bg-zinc-800 my-1" />
        <button onClick={handleZoomIn} className="p-2 rounded-lg border border-zinc-800 shadow-lg transition-all bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-white" title={t('Zoom In')} aria-label={t('Zoom In')}><Plus className="w-4 h-4" /></button>
        <button onClick={handleZoomOut} className="p-2 rounded-lg border border-zinc-800 shadow-lg transition-all bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-white" title={t('Zoom Out')} aria-label={t('Zoom Out')}><Minus className="w-4 h-4" /></button>
        <button onClick={handleResetView} className="p-2 bg-zinc-900/80 backdrop-blur text-zinc-200 rounded-lg border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all shadow-lg" title={t('Reset View')} aria-label={t('Reset View')}><Maximize className="w-4 h-4" /></button>
      </div>

      <div className="absolute bottom-4 left-4 pointer-events-none hidden md:block">
        <h2 className="text-zinc-500 text-xs uppercase tracking-widest font-bold">{isGlobe ? t('3D Globe View') : t('Multi-Point View')}</h2>
        <p className="text-zinc-700 text-[10px]">{isGlobe ? t('Scroll to zoom • Drag to rotate') : t('Scroll to zoom • Drag to pan')}</p>
      </div>

      {hoveredInfo && (
        <div 
          className="fixed pointer-events-none z-[100] bg-black/90 border border-zinc-700 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-sm flex flex-col gap-0.5 min-w-[140px]"
          style={{ 
            left: hoveredInfo.x + 15, 
            top: hoveredInfo.y + 15,
            transform: 'translate(0, 0)' 
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Local Time</span>
            <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
              {hoveredInfo.time}
            </span>
          </div>
          <div className="text-sm font-medium text-zinc-200 truncate">
            {hoveredInfo.name}
          </div>
        </div>
      )}
    </div>
  );
};
