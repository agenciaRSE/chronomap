
import React, { memo } from 'react';

export const AnimatedLogo: React.FC<{ className?: string }> = memo(({ className = "w-12 h-12" }) => {
  return (
    <div className={`${className} relative flex items-center justify-center group`}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer rotating ring (Time) */}
        <circle 
          cx="50" 
          cy="50" 
          r="45" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeDasharray="4 8" 
          className="text-blue-500/30 animate-[spin_20s_linear_infinite]"
        />
        
        {/* Second ring (Seconds/Precision) */}
        <circle 
          cx="50" 
          cy="50" 
          r="38" 
          stroke="currentColor" 
          strokeWidth="1" 
          strokeDasharray="1 4" 
          className="text-zinc-500 animate-[spin_10s_linear_infinite_reverse]"
        />

        {/* Globe Grid Lines */}
        <path 
          d="M50 12C29.0132 12 12 29.0132 12 50C12 70.9868 29.0132 88 50 88C70.9868 88 88 70.9868 88 50C88 29.0132 70.9868 12 50 12Z" 
          stroke="currentColor" 
          strokeWidth="1" 
          className="text-blue-500/20"
        />
        <path 
          d="M12 50H88M50 12V88M18 30H82M18 70H82M30 18V82M70 18V82" 
          stroke="currentColor" 
          strokeWidth="0.5" 
          strokeOpacity="0.3"
          className="text-blue-400"
        />

        {/* Pulsing Core (The "Now") */}
        <circle 
          cx="50" 
          cy="50" 
          r="6" 
          className="fill-blue-500 animate-pulse"
        />
        
        {/* Orbiting Point (The "Chrono") */}
        <g className="animate-[spin_4s_linear_infinite]">
          <circle 
            cx="50" 
            cy="20" 
            r="3" 
            className="fill-white shadow-lg"
          />
          <path 
            d="M50 20L50 50" 
            stroke="white" 
            strokeWidth="0.5" 
            strokeDasharray="2 2"
            className="opacity-50"
          />
        </g>

        {/* Static Compass Points */}
        <path d="M50 5L52 10H48L50 5Z" fill="currentColor" className="text-zinc-400" />
        <path d="M50 95L48 90H52L50 95Z" fill="currentColor" className="text-zinc-600" />
        <path d="M95 50L90 48V52L95 50Z" fill="currentColor" className="text-zinc-600" />
        <path d="M5 50L10 52V48L5 50Z" fill="currentColor" className="text-zinc-600" />
      </svg>
      
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors duration-500" />
    </div>
  );
});
