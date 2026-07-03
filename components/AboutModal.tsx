
import React from 'react';
import { X, Bug, Heart, Code, GitCommit, ExternalLink } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
        
        <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/30 flex-none">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Code className="w-4 h-4 text-primary" />
            About ChronoMap
          </h2>
          <button 
            onClick={onClose}
            aria-label="Close"
            className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8">
          
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Community & Support</h3>
            
            <a 
              href="mailto:dev@agenciarse.com"
              className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 text-red-400 rounded-md">
                  <Bug className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">Report a Bug</div>
                  <div className="text-xs text-muted-foreground">Found an issue? Let us know.</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-foreground transition-colors" />
            </a>

            <a 
              href="https://www.paypal.com/paypalme/dmeijide"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/10 text-pink-400 rounded-md">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">Support & Donations</div>
                  <div className="text-xs text-muted-foreground">Help keep the servers running.</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-foreground transition-colors" />
            </a>

            <a 
              href="https://agenciarse.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-md">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">Web Development</div>
                  <div className="text-xs text-muted-foreground">We bring your ideas to life.</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-foreground transition-colors" />
            </a>
          </div>

          <div>
             <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
               <GitCommit className="w-3 h-3" />
               Changelog
             </h3>
                          <div className="relative pl-4 space-y-6 border-l border-zinc-800">

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-primary">v3.0.1</span>
                      <span className="text-xs text-zinc-500 mb-1">Globe Centering Fix</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>City Centering:</strong> Selecting or searching a city in 3D Globe mode now rotates the globe until the location is perfectly centered. Previously the animation stopped halfway and never finished. The 2D map centering benefits from the same fix.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v3.0.0</span>
                      <span className="text-xs text-zinc-500 mb-1">Geopolitical Update</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Naming Update:</strong> Renamed 'Israel' to "Occupied territories" across the map and tooltips to reflect the requested geopolitical terminology.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.9.9</span>
                      <span className="text-xs text-zinc-500 mb-1">Marker Deduplication</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Double Tooltip Fix:</strong> Implemented a deduplication check to prevent multiple markers from being added to the same location.</li>
                        <li><strong>Event Handling:</strong> Refined the map interaction logic to prevent overlapping click events from triggering multiple location additions.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.9.8</span>
                      <span className="text-xs text-zinc-500 mb-1">Globe Visibility Fix</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Occlusion Culling:</strong> Implemented a visibility check for cities and markers on the 3D globe. Points on the back hemisphere are now correctly hidden and non-interactive.</li>
                        <li><strong>Improved Interaction:</strong> Fixed an issue where cities on the far side of the globe could still be hovered and selected.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.9.7</span>
                      <span className="text-xs text-zinc-500 mb-1">Enhanced Controls Visibility</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Arrow Visibility:</strong> Significantly increased the visibility of the time-shift arrows by adding a persistent background and a stronger border.</li>
                        <li><strong>Improved Contrast:</strong> Refined the color palette for these controls to ensure they are easily identifiable against the map.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.9.6</span>
                      <span className="text-xs text-zinc-500 mb-1">Visibility & Theme Fix</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Button Visibility:</strong> Fixed an issue where the "Live" button text was too dark to read. It now uses a high-contrast blue with a subtle glow.</li>
                        <li><strong>Theme Definition:</strong> Properly defined the primary color in the global CSS to ensure consistent rendering across all components.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.9.5</span>
                      <span className="text-xs text-zinc-500 mb-1">UI Polish</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Arrow Styling:</strong> Added a subtle persistent border to the time-shift arrows for better definition.</li>
                        <li><strong>Hover Feedback:</strong> Refined the hover state to be more distinct against the new persistent border.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.9.4</span>
                      <span className="text-xs text-zinc-500 mb-1">Control Bar Consolidation</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Unified Controls:</strong> Integrated the "Back to Present" (Live) button directly into the central control bar.</li>
                        <li><strong>Improved Accessibility:</strong> All temporal controls (Play/Pause, Calendar, and Return to Live) are now grouped together in a single, centered floating bar.</li>
                        <li><strong>Visual Balance:</strong> Restored the clean, centered look of the footer by consolidating the right-side action into the main control group.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.9.3</span>
                      <span className="text-xs text-zinc-500 mb-1">Header Centering Fix</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Clock Centering:</strong> Removed the secondary "Present" button from the header that was causing the main clock to shift off-center.</li>
                        <li><strong>Visual Symmetry:</strong> Restored perfect horizontal centering for the central time display.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.9.2</span>
                      <span className="text-xs text-zinc-500 mb-1">Layout Restoration</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Footer Layout Fix:</strong> Restored the balanced 3-column layout in the footer.</li>
                        <li><strong>Back to Present:</strong> Returned the "Back to Present" button to the right side of the footer for better accessibility and visual balance.</li>
                        <li><strong>Always Visible:</strong> The button is now always visible in the footer (disabled when already in live mode) to maintain UI consistency.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.9.1</span>
                      <span className="text-xs text-zinc-500 mb-1">UI Accessibility Fix</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Present Button Relocation:</strong> Moved the "Back to Present" button from the footer to the central header for better visibility.</li>
                        <li><strong>Dynamic Visibility:</strong> The button now only appears when you are viewing past or future time, providing a clear way to return to live mode.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.9.0</span>
                      <span className="text-xs text-zinc-500 mb-1">Time Sync & Accuracy Fix</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Real-time Hover Sync:</strong> Fixed an issue where the hover tooltip time would become stale. It now updates every second to stay perfectly synchronized with the global clock.</li>
                        <li><strong>Closure Fix:</strong> Resolved a technical debt where map event handlers were using outdated time data due to stale closures.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.8.9</span>
                      <span className="text-xs text-zinc-500 mb-1">Globe Visual Refinement</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Monochrome Hover:</strong> Updated the 3D Globe hover effect to use a transparent white highlight, matching the aesthetic of the 2D map mode.</li>
                        <li><strong>Subtle Interaction:</strong> Refined the highlight intensity for a more professional and integrated look.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.8.8</span>
                      <span className="text-xs text-zinc-500 mb-1">3D Globe Enhancements</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Interactive Globe:</strong> Added a hover effect to the 3D Globe view, highlighting countries as you move your cursor over them.</li>
                        <li><strong>Refined Transparency:</strong> Adjusted the globe's country colors to be more transparent, creating a more sophisticated and layered visual effect.</li>
                        <li><strong>Visual Feedback:</strong> Hovered countries now feature a subtle blue highlight and border for better geographic context.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.8.7</span>
                      <span className="text-xs text-zinc-500 mb-1">Button Visibility Fix</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>High-Visibility Buttons:</strong> Fixed an issue where copy buttons were too dark. They now use a clear zinc-based theme for maximum legibility.</li>
                        <li><strong>Enhanced Contrast:</strong> Improved the contrast of all interactive elements in the Discord Generator modal.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.8.6</span>
                      <span className="text-xs text-zinc-500 mb-1">Discord Generator UX</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Improved Copy Flow:</strong> Replaced raw code display with a dedicated "Copy" button in the Discord Timestamp Generator.</li>
                        <li><strong>Visual Feedback:</strong> Added a clear "Copied" state with color changes to confirm successful clipboard actions.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.8.5</span>
                      <span className="text-xs text-zinc-500 mb-1">Tooltip Border Refinement</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Enhanced Borders:</strong> Restored and refined borders for all map tooltips and pinned labels to ensure they stand out clearly against the dark background.</li>
                        <li><strong>Improved Legibility:</strong> Increased the contrast of tooltip borders for better definition in both 2D and 3D views.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.8.4</span>
                      <span className="text-xs text-zinc-500 mb-1">Sidebar UI Refinement</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Finer Card Borders:</strong> Reduced the thickness and intensity of pinned location card borders in the sidebar for a cleaner look.</li>
                        <li><strong>Persistent Blue Pin:</strong> Pinned locations now always display their blue pin icon, ensuring you can immediately identify them without hovering.</li>
                        <li><strong>Optimized Visual Hierarchy:</strong> Adjusted colors and opacity to ensure the most important information stands out without overwhelming the interface.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.8.3</span>
                      <span className="text-xs text-zinc-500 mb-1">UI Refinement & Abbreviations</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Smart Abbreviations:</strong> Tooltips now use abbreviations for long names (e.g., "USA" instead of "United States of America") to ensure clean layout.</li>
                        <li><strong>Subtle Pinned Markers:</strong> Refined the visual style of pinned locations with thinner borders and softer colors to reduce visual noise.</li>
                        <li><strong>Blue Pin Head:</strong> Restored the classic blue pin head for pinned locations for better consistency.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.8.2</span>
                      <span className="text-xs text-zinc-500 mb-1">Interactive Hover Tooltips</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Dynamic Tooltips:</strong> Added real-time hover tooltips that show the location name and local time as you move your cursor across the map or globe.</li>
                        <li><strong>Globe Interaction:</strong> Enhanced the 3D globe with coordinate-aware hovering, allowing you to preview times before pinning a location.</li>
                        <li><strong>City Previews:</strong> Hovering over major city markers now displays their specific local time and name.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.8.1</span>
                       <span className="text-xs text-zinc-500 mb-1">Timezone Accuracy Improvement</span>
                       <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                         <li><strong>Accurate Timezones:</strong> Integrated <code>tz-lookup</code> to ensure correct local time based on precise coordinates, respecting political boundaries.</li>
                         <li><strong>Fixed Spain Time:</strong> Resolved the issue where different times were shown across the Spanish peninsula; now correctly reflects a single timezone for the region.</li>
                         <li><strong>Robust Lookup:</strong> Improved city and map-click handling to prioritize official timezone data over longitude-based estimations.</li>
                       </ul>
                    </div>
                 </div>

                 <div className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                    <div className="flex flex-col">
                       <span className="text-sm font-mono text-zinc-400">v2.8.0</span>
                      <span className="text-xs text-zinc-500 mb-1">Layer Visibility Fix</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Fixed Ghosting:</strong> Resolved an issue where the 2D map remained visible on top of the 3D globe when switching modes.</li>
                        <li><strong>Improved Cleanup:</strong> Enhanced the rendering pipeline to properly clear SVG layers when transitioning to high-performance Canvas rendering.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.7.9</span>
                      <span className="text-xs text-zinc-500 mb-1">Pinch-to-Zoom Refinement</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Improved Touch Detection:</strong> Refined the interaction filters to ensure two-finger gestures are always prioritized for zooming on the 3D globe.</li>
                        <li><strong>Fluid Zooming:</strong> Optimized the zoom behavior for smoother transitions when pinching in and out on mobile devices.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.7.8</span>
                      <span className="text-xs text-zinc-500 mb-1">High-Performance Globe</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Canvas Rendering:</strong> Switched 3D globe rendering to HTML5 Canvas for ultra-smooth rotation and zoom on mobile devices.</li>
                        <li><strong>Tooltip Fix:</strong> Corrected an issue where tooltips showed the capital city instead of the searched/selected city.</li>
                        <li><strong>Optimized Transitions:</strong> Improved the centering animation for better responsiveness.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.7.7</span>
                      <span className="text-xs text-zinc-500 mb-1">3D Globe Smoothness</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Spherical Centering:</strong> Implemented <code>geoInterpolate</code> for the 3D globe, ensuring the camera follows the shortest path on the sphere when centering on a city.</li>
                        <li><strong>Optimized Rendering:</strong> Adjusted projection precision to improve frame rates during zoom and rotation gestures.</li>
                        <li><strong>Snappier Transitions:</strong> Reduced animation duration for a more responsive feel when switching locations.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.7.6</span>
                      <span className="text-xs text-zinc-500 mb-1">Mobile Zoom Optimization</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Real-time Zoom:</strong> Fixed an issue where pinch-to-zoom on mobile only updated after releasing. Now it scales smoothly in real-time.</li>
                        <li><strong>Performance:</strong> Optimized map rendering pipeline for better responsiveness during gestures.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.7.5</span>
                      <span className="text-xs text-zinc-500 mb-1">Marker Label Improvements</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Country Labels:</strong> Replaced the generic "Local" label with the actual country name in map markers when no specific city is selected.</li>
                        <li><strong>Data Consistency:</strong> Improved location metadata to better track country information across the app.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.7.4</span>
                      <span className="text-xs text-zinc-500 mb-1">Map Label Refinement</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Smart Labels:</strong> Removed automatic "nearest city" labeling.</li>
                        <li><strong>Country Detection:</strong> Now displays the country name when clicking on a point without a registered city.</li>
                        <li><strong>City Selection:</strong> City names are now only shown when explicitly selecting a city marker or searching for one.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.7.3</span>
                      <span className="text-xs text-zinc-500 mb-1">Layering & Z-Index Fixes</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Layering:</strong> Fixed an issue where the news ticker appeared on top of modals.</li>
                        <li><strong>Z-Index:</strong> Adjusted stacking order to ensure popups and search results always stay on top.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.7.2</span>
                      <span className="text-xs text-zinc-500 mb-1">Mobile UI Optimization</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>News Feed:</strong> Hidden "Geopolitical Feed" text on mobile to maximize space for news headlines.</li>
                        <li><strong>Responsive Design:</strong> Improved ticker layout for small screens.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.7.1</span>
                      <span className="text-xs text-zinc-500 mb-1">Vercel Deployment Fixes</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Serverless Functions:</strong> Added Vercel-native API support to ensure backend routes work in production.</li>
                        <li><strong>Routing:</strong> Implemented vercel.json for correct SPA and API routing.</li>
                        <li><strong>Error Handling:</strong> Improved detection of non-JSON responses to provide better debugging info.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.7.0</span>
                      <span className="text-xs text-zinc-500 mb-1">Security & Backend Architecture</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Full-Stack Transition:</strong> Migrated to an Express.js backend to secure API keys.</li>
                        <li><strong>Server-Side News Fetching:</strong> The Gemini API is now called from the server, preventing API key exposure in the browser.</li>
                        <li><strong>Enhanced Security:</strong> Removed all client-side references to sensitive environment variables.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.6.4</span>
                      <span className="text-xs text-zinc-500 mb-1">Deployment Compatibility</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Vercel Support:</strong> Updated API key handling to support standard Vite environment variables (VITE_ prefix).</li>
                        <li><strong>Error Messaging:</strong> Improved guidance when API keys are missing in production environments.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.6.3</span>
                      <span className="text-xs text-zinc-500 mb-1">Stability & Style Fixes</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>News Feed Reliability:</strong> Improved API error handling and added fallback mechanisms for the geopolitical feed.</li>
                        <li><strong>Scrollbar Styling:</strong> Implemented custom, subtle scrollbars for the location sidebar to match the app aesthetic.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.6.2</span>
                      <span className="text-xs text-zinc-500 mb-1">Visual Identity & Map Precision</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>New Animated Logo:</strong> Replaced the static logo with a custom-designed, animated SVG representing time and space.</li>
                        <li><strong>Fixed Zoom Scaling:</strong> Map tooltips and markers now maintain a constant visual size during zoom operations for better clarity.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.6.1</span>
                      <span className="text-xs text-zinc-500 mb-1">News Feed & UI Polish</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>News Feed Optimization:</strong> Adjusted scrolling speed and added pause on hover for better readability.</li>
                        <li><strong>UI Layout Fixes:</strong> Resolved header overlap issues with the news ticker.</li>
                        <li><strong>Visual Improvements:</strong> Restored original branding colors to the Share Timestamp button and improved modal close button visibility.</li>
                        <li><strong>Security Audit:</strong> Verified API key safety and removed legacy caching mechanisms.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.5.1</span>
                      <span className="text-xs text-zinc-500 mb-1">Globe Interaction & Animation Fixes</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Globe Centering Fix:</strong> Resolved a critical bug causing the 3D globe animation to get stuck midway.</li>
                        <li><strong>Smooth 3D Zoom:</strong> Eliminated the visual "jump" when using the zoom buttons in 3D globe mode.</li>
                        <li><strong>Reliable Mobile Centering:</strong> Fixed map centering on mobile devices and implemented shortest-path rotation for the globe.</li>
                      </ul>
                   </div>
                </div>
                
                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.5.0</span>
                      <span className="text-xs text-zinc-500 mb-1">Interaction & Animation</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Auto-Centering:</strong> The map now automatically animates to center on newly added locations.</li>
                        <li><strong>Mobile Zoom Fix:</strong> Resolved a bug that prevented pinch-to-zoom on touch devices.</li>
                        <li><strong>Smoother Transitions:</strong> Improved animation handling to prevent errors during user interaction.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.4.0</span>
                      <span className="text-xs text-zinc-500 mb-1">Full English Localization</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>App-wide Translation:</strong> The entire application UI, including all text, labels, and metadata, has been translated to English.</li>
                        <li><strong>Locale Formatting:</strong> Date and time formats now consistently use the `en-US` locale.</li>
                      </ul>
                   </div>
                </div>
             
                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.3.3</span>
                      <span className="text-xs text-zinc-500 mb-1">Visual & Render Fixes</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Dynamic Stroke Width:</strong> Fixed bug where 2D map borders became too thick on zoom.</li>
                        <li><strong>Tooltip Z-Index:</strong> Corrected render order to ensure location tooltips always appear above the map.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.3.2</span>
                      <span className="text-xs text-zinc-500 mb-1">Mobile Experience</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Mobile Sidebar:</strong> You can now hide the location list on mobile to interact with the full map.</li>
                        <li><strong>New Logo:</strong> Updated the application's branding image.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.3.1</span>
                      <span className="text-xs text-zinc-500 mb-1">3D Visual Fix</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Coastlines:</strong> Fixed a bug that hid coastlines in 3D Globe mode.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.3.0</span>
                      <span className="text-xs text-zinc-500 mb-1">3D Globe Update</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>3D Zoom:</strong> You can now zoom in and out in 3D Globe view.</li>
                        <li><strong>Visual Details:</strong> Added borders and coastlines to the 3D view.</li>
                        <li><strong>Style Refinement:</strong> Restored the classic dark aesthetic for the 2D map.</li>
                      </ul>
                   </div>
                </div>
             </div>
          </div>

        </div>
        
        <div className="p-4 border-t border-border bg-secondary/10 text-center text-[10px] text-zinc-500">
          &copy; {new Date().getFullYear()} Agenciarse. All rights reserved.
        </div>
      </div>
    </div>
  );
};
