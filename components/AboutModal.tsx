
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
              href="https://agenciarse.com/stripe"
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
                      <span className="text-sm font-mono text-primary">v2.7.0</span>
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
