
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { addMinutes, differenceInMinutes, startOfHour, getMinutes, getHours } from 'date-fns';

interface TimeScrubberProps {
  time: Date;
  onChange: (newTime: Date) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

export const TimeScrubber: React.FC<TimeScrubberProps> = ({ 
  time, 
  onChange,
  onInteractionStart,
  onInteractionEnd 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastX = useRef<number>(0);

  // Configuration
  const PIXELS_PER_HOUR = 120;
  const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
  
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Handle High DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Clear
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const timeMs = time.getTime();

    // Calculate range to draw (e.g. +/- 12 hours from center)
    // We draw extra to ensure smooth edges
    const hoursToDraw = Math.ceil((width / 2) / PIXELS_PER_HOUR) + 2;
    
    // Align to nearest hour for cleaner loop, but draw based on offset
    const startHourDate = startOfHour(time);
    // Shift backwards
    const baseTime = addMinutes(startHourDate, -hoursToDraw * 60);
    
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let h = 0; h <= hoursToDraw * 2 + 2; h++) {
      const loopDate = addMinutes(baseTime, h * 60);
      
      // Calculate position relative to center
      // If loopDate > time, it should be to the right
      const diffMinutes = differenceInMinutes(loopDate, time);
      const x = centerX + (diffMinutes * PIXELS_PER_MINUTE);

      // Draw Hour Tick (Tall)
      ctx.fillStyle = "#52525b"; // zinc-600
      ctx.fillRect(x - 1, height - 25, 2, 15);

      // Draw Hour Label
      const hourNum = getHours(loopDate);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const hour12 = hourNum % 12 || 12;
      
      ctx.fillStyle = "#a1a1aa"; // zinc-400
      ctx.fillText(`${hour12} ${ampm}`, x, height - 40);

      // Draw intermediate ticks (every 15 mins)
      for (let m = 15; m < 60; m += 15) {
         const mx = x + (m * PIXELS_PER_MINUTE);
         ctx.fillStyle = "#3f3f46"; // zinc-700
         ctx.fillRect(mx - 0.5, height - 15, 1, 5);
      }
    }

    // Draw Center Indicator
    ctx.fillStyle = "#3b82f6"; // Primary Blue
    // Triangle at bottom
    ctx.beginPath();
    ctx.moveTo(centerX, height - 10);
    ctx.lineTo(centerX - 6, height);
    ctx.lineTo(centerX + 6, height);
    ctx.fill();
    
    // Vertical Line
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(centerX - 1, 10, 2, height - 10);

  }, [time]);

  useEffect(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    lastX.current = e.clientX;
    containerRef.current?.setPointerCapture(e.pointerId);
    containerRef.current?.style.setProperty('cursor', 'grabbing');
    onInteractionStart?.();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const deltaX = lastX.current - e.clientX; // Dragging left moves time forward? No, typical timeline: Dragging map left moves view right (future). 
    // Actually for a ruler:
    // If I drag the ruler to the LEFT, the numbers on the right come into view. 
    // The center is fixed. So numbers appearing from right are "Future".
    // So dragging LEFT means we are looking at Future.
    // Dragging LEFT means deltaX is POSITIVE (Start - Current > 0).
    // So Positive Delta -> Add Time.
    
    const deltaMinutes = deltaX / PIXELS_PER_MINUTE;
    const newTime = addMinutes(time, deltaMinutes);
    
    onChange(newTime);
    lastX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    containerRef.current?.releasePointerCapture(e.pointerId);
    containerRef.current?.style.removeProperty('cursor');
    onInteractionEnd?.();
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-16 bg-black/20 border-t border-zinc-800 select-none overflow-hidden cursor-grab touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
       <canvas ref={canvasRef} className="absolute inset-0 block" />
       
       {/* Gradient Masks for fade effect */}
       <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black to-transparent pointer-events-none" />
       <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black to-transparent pointer-events-none" />
    </div>
  );
};
