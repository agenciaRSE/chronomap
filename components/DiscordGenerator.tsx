
import React, { useState } from 'react';
import { Copy, Check, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface DiscordGeneratorProps {
  targetDate: Date;
  timezone: string;
  onClose: () => void;
}

export const DiscordGenerator: React.FC<DiscordGeneratorProps> = ({ targetDate, timezone, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const unixTimestamp = Math.floor(targetDate.getTime() / 1000);

  const formats = [
    { code: 't', label: 'Hora Corta', preview: format(targetDate, 'p', { locale: es }) },
    { code: 'T', label: 'Hora Larga', preview: format(targetDate, 'pp', { locale: es }) },
    { code: 'd', label: 'Fecha Corta', preview: format(targetDate, 'P', { locale: es }) },
    { code: 'D', label: 'Fecha Larga', preview: format(targetDate, 'PP', { locale: es }) },
    { code: 'f', label: 'Fecha/Hora Corta', preview: format(targetDate, 'Pp', { locale: es }) },
    { code: 'F', label: 'Fecha/Hora Larga', preview: format(targetDate, 'PPpp', { locale: es }) },
    { code: 'R', label: 'Relativo', preview: formatDistanceToNow(targetDate, { addSuffix: true, locale: es }) },
  ];

  const handleCopy = (code: string) => {
    const str = `<t:${unixTimestamp}:${code}>`;
    navigator.clipboard.writeText(str);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/30">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Generador de Timestamp de Discord
          </h2>
          <button 
            onClick={onClose}
            aria-label="Cerrar"
            className="text-muted-foreground hover:text-foreground transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
             Genera una marca de tiempo dinámica para <span className="text-primary font-mono">{format(targetDate, 'yyyy-MM-dd HH:mm:ss')}</span>. 
             Las previsualizaciones muestran cómo se verá en Discord.
          </div>

          <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-2">
            {formats.map((fmt) => (
              <div 
                key={fmt.code} 
                className="group flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/50 transition-all cursor-pointer"
                onClick={() => handleCopy(fmt.code)}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{fmt.label}</span>
                  <span className="text-xs text-muted-foreground mt-1 bg-black/20 px-1.5 py-0.5 rounded inline-block">{fmt.preview}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <code className="hidden sm:block px-2 py-1 rounded bg-black/30 text-xs font-mono text-primary/80">
                    {`<t:${unixTimestamp}:${fmt.code}>`}
                  </code>
                  <button className="p-2 rounded-md hover:bg-primary/20 text-primary transition-colors">
                    {copied === fmt.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
