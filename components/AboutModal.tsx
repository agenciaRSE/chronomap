
import React from 'react';
import { X, Bug, Heart, Code, GitCommit, ExternalLink } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/30 flex-none">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Code className="w-4 h-4 text-primary" />
            About ChronoMap
          </h3>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-white/10 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* Links Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Community & Support</h4>
            
            <a 
              href="mailto:dev@agenciarse.com"
              className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 text-red-400 rounded-md">
                  <Bug className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">Report Bugs</div>
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
                  <div className="text-xs text-muted-foreground">Bring your ideas to life.</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-foreground transition-colors" />
            </a>
          </div>

          {/* Changelog Section */}
          <div>
             <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
               <GitCommit className="w-3 h-3" />
               Changelog
             </h4>
             
             <div className="relative pl-4 space-y-6 border-l border-zinc-800">

                {/* Version Item */}
                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-primary">v2.3.2</span>
                      <span className="text-xs text-zinc-500 mb-1">Mobile Experience</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Mobile Sidebar:</strong> You can now toggle the location list on mobile to interact fully with the map.</li>
                        <li><strong>New Logo:</strong> Updated application branding.</li>
                      </ul>
                   </div>
                </div>

                {/* Version Item */}
                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.3.1</span>
                      <span className="text-xs text-zinc-500 mb-1">3D Visuals Fix</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Continent Outlines:</strong> Fixed an issue where coastlines were missing in 3D Globe mode.</li>
                      </ul>
                   </div>
                </div>

                {/* Version Item */}
                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.3.0</span>
                      <span className="text-xs text-zinc-500 mb-1">3D Globe Update</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>3D Zoom:</strong> You can now zoom in/out in 3D Globe mode.</li>
                        <li><strong>Visual Details:</strong> Added country borders and coastline contours to the 3D view.</li>
                        <li><strong>Refined Style:</strong> Restored the classic dark aesthetic for the 2D map while improving contrast for 3D.</li>
                      </ul>
                   </div>
                </div>

                {/* Version Item */}
                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.2.0</span>
                      <span className="text-xs text-zinc-500 mb-1">Productivity Update</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Pin Locations:</strong> You can now pin your favorite cities to save them for your next visit.</li>
                        <li><strong>Advanced Time Travel:</strong> Select different time units (Minute, Hour, Day, Week, Month) to jump through time with precision.</li>
                      </ul>
                   </div>
                </div>

                {/* Version Item */}
                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.1.1</span>
                      <span className="text-xs text-zinc-500 mb-1">Database Mega-Update</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Global Coverage:</strong> Database expanded to 150+ locations.</li>
                        <li><strong>New Regions:</strong> Added missing capitals in Africa, Central Asia, and the Caribbean.</li>
                        <li><strong>Search:</strong> You can now search for almost any country capital.</li>
                      </ul>
                   </div>
                </div>
                
                {/* Version Item */}
                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.1.0</span>
                      <span className="text-xs text-zinc-500 mb-1">Feature Release</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Global Search:</strong> Quickly find and track time for any major city or country.</li>
                        <li><strong>Map Zoom:</strong> Use scroll or buttons to zoom in for detail or out for global view.</li>
                        <li><strong>PWA Support:</strong> Install ChronoMap on your device; works offline.</li>
                        <li><strong>SEO & Social:</strong> Improved previews and search visibility.</li>
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
