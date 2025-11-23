
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { MAJOR_CITIES } from '../constants';
import { SavedLocation, MapClickEvent } from '../types';
import { format, toZonedTime } from 'date-fns-tz';
import { Plus, Minus, Maximize, Globe, Map as MapIcon } from 'lucide-react';

interface MapChartProps {
  currentTime: Date;
  onMapClick: (data: MapClickEvent) => void;
  locations: SavedLocation[];
}

export const MapChart: React.FC<MapChartProps> = ({ currentTime, onMapClick, locations }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const mapGroupRef = useRef<SVGGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  
  const [mapData, setMapData] = useState<{ features: any[], borders: any } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 960, height: 500 });
  
  const [isGlobe, setIsGlobe] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); 
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [globeZoom, setGlobeZoom] = useState(1);

  // Refs to keep D3 listeners stable and avoid re-binding
  const rotationRef = useRef(rotation);
  const globeZoomRef = useRef(globeZoom);
  const isGlobeRef = useRef(isGlobe);

  useEffect(() => {
    rotationRef.current = rotation;
    globeZoomRef.current = globeZoom;
    isGlobeRef.current = isGlobe;
  }, [rotation, globeZoom, isGlobe]);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(response => response.json())
      .then(data => {
        const features = (topojson.feature(data, data.objects.countries) as any).features;
        // No filter: include both internal borders and coastlines
        const borders = topojson.mesh(data, data.objects.countries);
        setMapData({ features, borders });
      });

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
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
        .precision(0.1)
        .clipAngle(90);
    } else {
      return d3.geoEquirectangular()
        .fitSize([width, height], mapData ? { type: "FeatureCollection", features: mapData.features } : { type: "Sphere" })
        .translate([width / 2, height / 2 + (height * 0.05)]);
    }
  }, [dimensions, mapData, isGlobe, rotation, globeZoom]);

  const pathGenerator = useMemo(() => d3.geoPath().projection(projection), [projection]);
  const graticule = useMemo(() => d3.geoGraticule10(), []);

  // --- Interaction Handling ---
  useEffect(() => {
    if (!svgRef.current || !mapGroupRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(mapGroupRef.current);

    // Remove previous listeners to prevent stacking/stuttering
    svg.on(".zoom", null);
    svg.on(".drag", null);

    if (isGlobe) {
      // --- 3D MODE ---
      g.attr("transform", null);

      let totalMovement = 0;

      // DRAG (ROTATION) CONFIGURATION
      const drag = d3.drag<SVGSVGElement, unknown>()
        .filter((event) => {
           // Allow: Mouse main button OR Touch with exactly 1 finger
           if (event.type === 'touchstart') return event.touches.length === 1;
           return !event.button; 
        })
        .on("start", () => {
          totalMovement = 0;
          svg.style("cursor", "grabbing");
        })
        .on("drag", (event) => {
          totalMovement += Math.hypot(event.dx, event.dy);
          
          const currentZoom = globeZoomRef.current;
          const baseScale = Math.min(dimensions.width, dimensions.height) / 2.2;
          const scale = baseScale * currentZoom;
          
          // Sensitivity: 250 provides a good balance for touch rotation
          const sensitivity = 250 / scale;
          
          const currRotation = rotationRef.current;
          const newRotation: [number, number, number] = [
            currRotation[0] + event.dx * sensitivity,
            currRotation[1] - event.dy * sensitivity,
            currRotation[2]
          ];
          
          setRotation(newRotation);
        })
        .on("end", (event) => {
          svg.style("cursor", "crosshair");
          
          // SMART CLICK DETECTION
          // If movement is minimal (< 10px to account for finger wobble), treat as click
          if (totalMovement < 10) {
             let clientX, clientY;
             
             // Handle coordinates for both Mouse and Touch events
             if (event.sourceEvent.type === 'touchend') {
                // touchend has no 'touches', use 'changedTouches'
                const touch = event.sourceEvent.changedTouches[0];
                if (touch) {
                    clientX = touch.clientX;
                    clientY = touch.clientY;
                }
             } else {
                clientX = event.sourceEvent.clientX;
                clientY = event.sourceEvent.clientY;
             }

             if (clientX === undefined || clientY === undefined) return;

             // Get relative coordinates within the container
             const rect = containerRef.current?.getBoundingClientRect();
             if (!rect) return;
             
             const relX = clientX - rect.left;
             const relY = clientY - rect.top;

             // Reconstruct temp projection for accurate inversion
             const { width, height } = dimensions;
             const baseScale = Math.min(width, height) / 2.2;
             const tempProjection = d3.geoOrthographic()
                .scale(baseScale * globeZoomRef.current)
                .translate([width / 2, height / 2])
                .rotate(rotationRef.current)
                .clipAngle(90);

             const coords = tempProjection.invert?.([relX, relY]);
             
             if (coords) {
               const [lng, lat] = coords;
               if (isFinite(lng) && isFinite(lat)) {
                 onMapClick({ x: clientX, y: clientY, lat, lng });
               }
             }
          }
        });
      
      // ZOOM (PINCH/WHEEL) CONFIGURATION
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 8])
        .filter((event) => {
           // Allow: Mouse Wheel OR Touch with 2+ fingers (Pinch)
           if (event.type === 'wheel') return true;
           if (event.type === 'touchstart' && event.touches.length >= 2) return true;
           return false;
        })
        .on("zoom", (event) => {
           setGlobeZoom(event.transform.k);
        });

      svg.call(drag).style("cursor", "crosshair");
      svg.call(zoom).on("dblclick.zoom", null);

      // Initialize Zoom Transform
      svg.call(zoom.transform, d3.zoomIdentity.scale(globeZoomRef.current));
      zoomBehaviorRef.current = zoom;

    } else {
      // --- 2D MODE ---
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 12])
        .translateExtent([[-100, -100], [dimensions.width + 100, dimensions.height + 100]])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
          setZoomLevel(event.transform.k);
        });

      zoomBehaviorRef.current = zoom;
      svg.call(zoom).on("dblclick.zoom", null);
      svg.style("cursor", "move");
      
      if (zoomLevel === 1) {
         svg.call(zoom.transform, d3.zoomIdentity);
      }
    }

  }, [isGlobe, dimensions]); 


  // --- Render Static Layers ---
  useEffect(() => {
    if (!mapData || !mapGroupRef.current) return;

    const group = d3.select(mapGroupRef.current);
    let staticGroup = group.select<SVGGElement>(".static-map-layer");
    
    // 1. Sphere Background
    const sphereData = isGlobe ? [{ type: "Sphere" }] : [];
    staticGroup.selectAll("path.sphere")
      .data(sphereData)
      .join("path")
      .attr("class", "sphere")
      .attr("d", pathGenerator as any)
      .attr("fill", "#050505")
      .attr("stroke", "#27272a")
      .attr("stroke-width", 1.5);

    // 2. Graticule
    const graticuleData = isGlobe ? [graticule] : [];
    staticGroup.selectAll("path.graticule")
      .data(graticuleData)
      .join("path")
      .attr("class", "graticule")
      .attr("d", pathGenerator as any)
      .attr("fill", "none")
      .attr("stroke", "#27272a")
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.3);

    // 3. Land
    const fill = isGlobe ? "#27272a" : "#09090b"; 
    const hoverFill = isGlobe ? "#3f3f46" : "#18181b";
    const stroke = isGlobe ? "none" : "#3f3f46"; 

    staticGroup.selectAll("path.country")
      .data(mapData.features)
      .join("path")
      .attr("class", "country")
      .attr("d", pathGenerator as any)
      .attr("fill", fill)
      .attr("stroke", stroke) 
      .attr("stroke-width", 0.5)
      // In 3D, disable pointer events so drag handler gets the input
      .style("pointer-events", isGlobe ? "none" : "auto")
      .style("cursor", isGlobe ? "grab" : "crosshair")
      .on("click", (event) => {
         if (!isGlobe) {
           const [x, y] = d3.pointer(event, mapGroupRef.current);
           const coords = projection.invert?.([x, y]);
           if (coords) {
             const [lng, lat] = coords;
             onMapClick({ x: event.clientX, y: event.clientY, lat, lng });
           }
         }
      })
      .on("mouseenter", function() {
         if (!isGlobe) d3.select(this).attr("fill", hoverFill);
      })
      .on("mouseleave", function() {
         if (!isGlobe) d3.select(this).attr("fill", fill);
      });

    // 4. Borders (Mesh)
    const borderData = isGlobe ? [mapData.borders] : [];
    staticGroup.selectAll("path.borders")
      .data(borderData)
      .join("path")
      .attr("class", "borders")
      .attr("d", pathGenerator as any)
      .attr("fill", "none")
      .attr("stroke", "#a1a1aa")
      .attr("stroke-width", 0.8)
      .style("pointer-events", "none");

    // 5. Links
    const links = [];
    for(let i=0; i < MAJOR_CITIES.length - 1; i+=2) {
       links.push({
         type: "LineString",
         coordinates: [
           [MAJOR_CITIES[i].lng, MAJOR_CITIES[i].lat],
           [MAJOR_CITIES[i+1].lng, MAJOR_CITIES[i+1].lat]
         ]
       });
    }
    staticGroup.selectAll("path.link")
       .data(links)
       .join("path")
       .attr("class", "link")
       .attr("d", (d: any) => pathGenerator(d))
       .attr("fill", "none")
       .attr("stroke", "#3b82f6")
       .attr("stroke-width", 0.5)
       .attr("stroke-opacity", 0.2)
       .attr("stroke-dasharray", "4 4");

  }, [mapData, pathGenerator, projection, onMapClick, isGlobe, graticule]);


  // --- Control Handlers ---
  const handleZoomIn = () => {
    if (isGlobe) {
      setGlobeZoom(z => {
        const newZ = Math.min(8, z * 1.5);
        if (svgRef.current && zoomBehaviorRef.current) {
           d3.select(svgRef.current).call(zoomBehaviorRef.current.transform, d3.zoomIdentity.scale(newZ));
        }
        return newZ;
      });
    } else {
      if (svgRef.current && zoomBehaviorRef.current) {
        d3.select(svgRef.current)
          .transition().duration(300)
          .call(zoomBehaviorRef.current.scaleBy, 1.5);
      }
    }
  };

  const handleZoomOut = () => {
    if (isGlobe) {
      setGlobeZoom(z => {
        const newZ = Math.max(0.5, z * 0.66);
        if (svgRef.current && zoomBehaviorRef.current) {
           d3.select(svgRef.current).call(zoomBehaviorRef.current.transform, d3.zoomIdentity.scale(newZ));
        }
        return newZ;
      });
    } else {
      if (svgRef.current && zoomBehaviorRef.current) {
        d3.select(svgRef.current)
          .transition().duration(300)
          .call(zoomBehaviorRef.current.scaleBy, 0.66);
      }
    }
  };

  const handleResetView = () => {
    if (isGlobe) {
      setRotation([0,0,0]);
      setGlobeZoom(1);
      if (svgRef.current && zoomBehaviorRef.current) {
         d3.select(svgRef.current).call(zoomBehaviorRef.current.transform, d3.zoomIdentity.scale(1));
      }
    } else {
      if (svgRef.current && zoomBehaviorRef.current) {
        d3.select(svgRef.current)
          .transition().duration(500)
          .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
      }
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

  const markerScale = isGlobe 
    ? Math.max(1, Math.sqrt(globeZoom)) 
    : Math.max(0.2, 1 / Math.sqrt(zoomLevel)); 
    
  const textScale = isGlobe 
    ? Math.max(1, Math.sqrt(globeZoom)) 
    : Math.max(0.3, 1 / zoomLevel);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] relative overflow-hidden bg-black shadow-inner">
      <div className="absolute inset-0 pointer-events-none dot-pattern opacity-20" />
      
      <svg ref={svgRef} width="100%" height="100%" className={`relative z-10 touch-none ${isGlobe ? 'cursor-crosshair' : 'cursor-move'}`}>
         <defs>
            <pattern id="dot-pattern" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#27272a" />
            </pattern>
         </defs>

         <g ref={mapGroupRef}>
            <g className="static-map-layer" />

            <g className="markers-layer">
                {MAJOR_CITIES.map(city => {
                  const pos = projection([city.lng, city.lat]);
                  if (!pos) return null; 
                  
                  return (
                    <circle 
                        key={city.name}
                        cx={pos[0]}
                        cy={pos[1]}
                        r={(isGlobe ? 2.5 : 2) * markerScale}
                        className={`fill-zinc-700 hover:fill-blue-500 transition-colors ${isGlobe ? 'pointer-events-none' : 'cursor-pointer'}`}
                        onClick={(e) => {
                          if(!isGlobe) {
                            e.stopPropagation(); 
                            onMapClick({
                              x: e.clientX,
                              y: e.clientY,
                              lat: city.lat,
                              lng: city.lng,
                              city: city
                            });
                          }
                        }}
                    />
                  )
                })}

                {locations.map(loc => {
                  const pos = projection([loc.lng, loc.lat]);
                  if (!pos) return null;
                  const timeStr = getTimeString(loc);
                  
                  return (
                    <g key={loc.id} transform={`translate(${pos[0]}, ${pos[1]})`} className={isGlobe ? 'pointer-events-none' : ''}>
                        <circle r={8 * markerScale} className="fill-blue-500/20 animate-ping" />
                        <circle r={3 * markerScale} className="fill-blue-500 stroke-black" strokeWidth={1 * markerScale} />
                        
                        <line 
                          x1="0" y1={-3 * markerScale} 
                          x2="0" y2={-25 * markerScale} 
                          className="stroke-blue-500/50" 
                          strokeWidth={1 * markerScale}
                        />
                        
                        <g transform={`translate(0, ${-45 * markerScale}) scale(${Math.max(0.5, textScale)})`}>
                          <rect 
                            x="-35" y="0" width="70" height="32" rx="4" 
                            className="fill-black/80 stroke-zinc-700 stroke-1"
                          />
                          <text 
                            x="0" y="14" 
                            className="text-[12px] font-mono font-bold fill-white pointer-events-none" 
                            textAnchor="middle" dominantBaseline="middle"
                          >
                            {timeStr}
                          </text>
                          <text 
                            x="0" y="26" 
                            className="text-[8px] fill-zinc-400 pointer-events-none uppercase" 
                            textAnchor="middle" dominantBaseline="middle"
                          >
                            {loc.timezone ? loc.timezone.split('/')[1] : 'Local'}
                          </text>
                        </g>
                    </g>
                  )
                })}
            </g>
         </g>
      </svg>
      
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
        <button 
          onClick={() => {
            setIsGlobe(!isGlobe);
            setRotation([0,0,0]);
            setGlobeZoom(1);
          }}
          className={`p-2 rounded-lg border transition-all shadow-lg ${isGlobe ? 'bg-blue-500 text-white border-blue-400' : 'bg-zinc-900/80 text-zinc-200 border-zinc-800 hover:bg-zinc-800'}`}
          title={isGlobe ? "Switch to 2D Map" : "Switch to 3D Globe"}
        >
          {isGlobe ? <MapIcon className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
        </button>

        <div className="h-[1px] w-full bg-zinc-800 my-1" />

        <button 
          onClick={handleZoomIn}
          className="p-2 rounded-lg border border-zinc-800 shadow-lg transition-all bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-white"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 rounded-lg border border-zinc-800 shadow-lg transition-all bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-white"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button 
          onClick={handleResetView}
          className="p-2 bg-zinc-900/80 backdrop-blur text-zinc-200 rounded-lg border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all shadow-lg"
          title="Reset View"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 pointer-events-none">
        <h2 className="text-zinc-500 text-xs uppercase tracking-widest font-bold">
          {isGlobe ? '3D Globe View' : 'Multi-Point View'}
        </h2>
        <p className="text-zinc-700 text-[10px]">
          {isGlobe ? 'Scroll to zoom • Drag to rotate' : 'Scroll to zoom • Drag to pan'}
        </p>
      </div>
    </div>
  );
};
