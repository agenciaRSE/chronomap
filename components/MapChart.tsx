
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { MAJOR_CITIES } from '../constants';
import { SavedLocation, MapClickEvent } from '../types';
import { format, toZonedTime } from 'date-fns-tz';
import { Plus, Minus, Maximize } from 'lucide-react';

interface MapChartProps {
  currentTime: Date;
  onMapClick: (data: MapClickEvent) => void;
  locations: SavedLocation[];
}

export const MapChart: React.FC<MapChartProps> = ({ currentTime, onMapClick, locations }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const mapGroupRef = useRef<SVGGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>(null);
  
  const [worldData, setWorldData] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 960, height: 500 });
  const [zoomLevel, setZoomLevel] = useState(1);

  // Fetch map data once
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(response => response.json())
      .then(data => {
        setWorldData(topojson.feature(data, data.objects.countries));
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

  // Memoize projection so we can use it for React rendering outside D3 effects
  const projection = useMemo(() => {
    const { width, height } = dimensions;
    // Adjust scale based on width to keep map roughly covered
    const scale = Math.min(width, height) / 1.5; 
    
    return d3.geoEquirectangular()
      .fitSize([width, height], worldData || { type: "Sphere" })
      .translate([width / 2, height / 2 + (height * 0.05)]); // Slight vertical offset
  }, [dimensions, worldData]);

  const pathGenerator = useMemo(() => d3.geoPath().projection(projection), [projection]);

  // Initialize Zoom Behavior
  useEffect(() => {
    if (!svgRef.current || !mapGroupRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(mapGroupRef.current);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12]) // Min 1x, Max 12x
      .translateExtent([[-100, -100], [dimensions.width + 100, dimensions.height + 100]])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom)
       .on("dblclick.zoom", null); // Disable double click zoom to allow rapid clicking

    // Initial state
    if (zoomLevel === 1) {
       svg.call(zoom.transform, d3.zoomIdentity);
    }

  }, [dimensions]); // Re-initialize if dimensions change

  // Render Static Map (Countries, etc)
  useEffect(() => {
    if (!worldData || !mapGroupRef.current) return;

    const group = d3.select(mapGroupRef.current);
    
    let staticGroup = group.select<SVGGElement>(".static-map-layer");
    
    // Update paths
    staticGroup.selectAll("path.country")
      .data(worldData.features)
      .join("path")
      .attr("class", "country")
      .attr("d", pathGenerator as any)
      .attr("fill", "#09090b")
      .attr("stroke", "#3f3f46")
      .attr("stroke-width", 0.5)
      .style("cursor", "crosshair")
      .on("click", (event) => {
         // We need to get coordinates relative to the GROUP (original map space), not the SVG (screen space)
         // d3.pointer(event, mapGroupRef.current) does exactly this!
         const [x, y] = d3.pointer(event, mapGroupRef.current);
         const coords = projection.invert?.([x, y]);
         if (coords) {
           const [lng, lat] = coords;
           onMapClick({ x: event.clientX, y: event.clientY, lat, lng });
         }
      })
      .on("mouseenter", function() {
         d3.select(this).attr("fill", "#18181b");
      })
      .on("mouseleave", function() {
         d3.select(this).attr("fill", "#09090b");
      });

    // Draw Decor lines
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

  }, [worldData, pathGenerator, projection, onMapClick]);


  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition().duration(300)
        .call(zoomBehaviorRef.current.scaleBy, 1.5);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition().duration(300)
        .call(zoomBehaviorRef.current.scaleBy, 0.66);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition().duration(500)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  // Helper to get time string for a location
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

  // Scale factors for semantic zoom
  const markerScale = Math.max(0.2, 1 / Math.sqrt(zoomLevel)); 
  const textScale = Math.max(0.3, 1 / zoomLevel);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] relative overflow-hidden bg-black shadow-inner">
      <div className="absolute inset-0 pointer-events-none dot-pattern opacity-20" />
      
      <svg ref={svgRef} width="100%" height="100%" className="relative z-10 touch-none cursor-move">
         <defs>
            <pattern id="dot-pattern" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#27272a" />
            </pattern>
         </defs>
         
         <g ref={mapGroupRef}>
            {/* Static Map Layer */}
            <g className="static-map-layer" />

            {/* React Controlled Layer for Dynamic Markers */}
            <g className="markers-layer">
                {/* Major Cities (Static dots) */}
                {MAJOR_CITIES.map(city => {
                  const pos = projection([city.lng, city.lat]);
                  if (!pos) return null;
                  return (
                    <circle 
                        key={city.name}
                        cx={pos[0]}
                        cy={pos[1]}
                        r={2 * markerScale}
                        className="fill-zinc-700 hover:fill-blue-500 cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMapClick({
                            x: e.clientX,
                            y: e.clientY,
                            lat: city.lat,
                            lng: city.lng,
                            city: city
                          })
                        }}
                    />
                  )
                })}

                {/* Selected Locations (Active Pins + Tooltips) */}
                {locations.map(loc => {
                  const pos = projection([loc.lng, loc.lat]);
                  if (!pos) return null;
                  const timeStr = getTimeString(loc);
                  
                  return (
                    <g key={loc.id} transform={`translate(${pos[0]}, ${pos[1]})`}>
                        {/* Ripple Effect */}
                        <circle r={8 * markerScale} className="fill-blue-500/20 animate-ping" />
                        
                        {/* Pin Center */}
                        <circle r={3 * markerScale} className="fill-blue-500 stroke-black" strokeWidth={1 * markerScale} />
                        
                        {/* Tooltip Connector */}
                        <line 
                          x1="0" y1={-3 * markerScale} 
                          x2="0" y2={-25 * markerScale} 
                          className="stroke-blue-500/50" 
                          strokeWidth={1 * markerScale}
                        />
                        
                        {/* Tooltip Box */}
                        <g transform={`translate(0, ${-45 * markerScale}) scale(${Math.max(0.5, textScale)})`}>
                          {/* Background Rect */}
                          <rect 
                            x="-35" 
                            y="0" 
                            width="70" 
                            height="32" 
                            rx="4" 
                            className="fill-black/80 stroke-zinc-700 stroke-1"
                          />
                          
                          {/* Time Text */}
                          <text 
                            x="0" 
                            y="14" 
                            className="text-[12px] font-mono font-bold fill-white pointer-events-none" 
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            {timeStr}
                          </text>

                          {/* Location Name (Small) */}
                          <text 
                            x="0" 
                            y="26" 
                            className="text-[8px] fill-zinc-400 pointer-events-none uppercase" 
                            textAnchor="middle"
                            dominantBaseline="middle"
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
      
      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
        <button 
          onClick={handleZoomIn}
          className="p-2 bg-zinc-900/80 backdrop-blur text-zinc-200 rounded-lg border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all shadow-lg"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 bg-zinc-900/80 backdrop-blur text-zinc-200 rounded-lg border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all shadow-lg"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button 
          onClick={handleResetZoom}
          className="p-2 bg-zinc-900/80 backdrop-blur text-zinc-200 rounded-lg border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all shadow-lg"
          title="Reset View"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Overlay Instructions */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <h2 className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Multi-Point View</h2>
        <p className="text-zinc-700 text-[10px]">Scroll to zoom • Drag to pan</p>
      </div>
    </div>
  );
};
