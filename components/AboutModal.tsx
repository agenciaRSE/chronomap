
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
            Acerca de ChronoMap
          </h2>
          <button 
            onClick={onClose}
            aria-label="Cerrar"
            className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-white/10 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8">
          
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Comunidad y Soporte</h3>
            
            <a 
              href="mailto:dev@agenciarse.com"
              className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 text-red-400 rounded-md">
                  <Bug className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">Reportar Errores</div>
                  <div className="text-xs text-muted-foreground">¿Encontraste un problema? Infórmanos.</div>
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
                  <div className="text-sm font-medium text-foreground">Soporte y Donaciones</div>
                  <div className="text-xs text-muted-foreground">Ayuda a mantener los servidores.</div>
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
                  <div className="text-sm font-medium text-foreground">Desarrollo Web</div>
                  <div className="text-xs text-muted-foreground">Damos vida a tus ideas.</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-foreground transition-colors" />
            </a>
          </div>

          <div>
             <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
               <GitCommit className="w-3 h-3" />
               Registro de Cambios
             </h3>
             
             <div className="relative pl-4 space-y-6 border-l border-zinc-800">

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-primary">v2.3.2</span>
                      <span className="text-xs text-zinc-500 mb-1">Experiencia Móvil</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Barra lateral móvil:</strong> Ahora puedes ocultar la lista de ubicaciones en móvil para interactuar con el mapa completo.</li>
                        <li><strong>Nuevo Logo:</strong> Actualización de la imagen de la aplicación.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.3.1</span>
                      <span className="text-xs text-zinc-500 mb-1">Corrección Visual 3D</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Contornos:</strong> Corregido un error que ocultaba las costas en el modo Globo 3D.</li>
                      </ul>
                   </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-background"></div>
                   <div className="flex flex-col">
                      <span className="text-sm font-mono text-zinc-400">v2.3.0</span>
                      <span className="text-xs text-zinc-500 mb-1">Actualización Globo 3D</span>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li><strong>Zoom 3D:</strong> Ahora puedes acercar y alejar la vista en el modo Globo 3D.</li>
                        <li><strong>Detalles Visuales:</strong> Añadidas fronteras y costas a la vista 3D.</li>
                        <li><strong>Estilo Refinado:</strong> Se restauró la estética oscura clásica para el mapa 2D.</li>
                      </ul>
                   </div>
                </div>
             </div>
          </div>

        </div>
        
        <div className="p-4 border-t border-border bg-secondary/10 text-center text-[10px] text-zinc-500">
          &copy; {new Date().getFullYear()} Agenciarse. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
};
