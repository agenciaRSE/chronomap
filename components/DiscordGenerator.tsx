
import React, { useState } from 'react';
import { Copy, Check, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface DiscordGeneratorProps {
  targetDate: Date;
  timezone: string;
  onClose: () => void;
}

export const DiscordGenerator: React.FC<DiscordGeneratorProps> = ({ targetDate, timezone, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const unixTimestamp = Math.floor(targetDate.getTime() / 1000);

  const formats = [
    { code: 't', label: 'Short Time', preview: format(targetDate, 'h:mm a') },
    { code: 'T', label: 'Long Time', preview: format(targetDate, 'h:mm:ss a') },
    { code: 'd', label: 'Short Date', preview: format(targetDate, 'MM/dd/yyyy') },
    { code: 'D', label: 'Long Date', preview: format(targetDate, 'MMMM d, yyyy') },
    { code: 'f', label: 'Short Date/Time', preview: format(targetDate, 'MMMM d, yyyy h:mm a') },
    { code: 'F', label: 'Long Date/Time', preview: format(targetDate, 'eeee, MMMM d, yyyy h:mm a') },
    { code: 'R', label: 'Relative', preview: formatDistanceToNow(targetDate, { addSuffix: true }) },
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
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Discord Timestamp Generator
          </h3>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
             Generate a dynamic timestamp for <span className="text-primary font-mono">{format(targetDate, 'yyyy-MM-dd HH:mm:ss')}</span> (Local equivalent). 
             When pasted into Discord, this will show the correct local time for everyone who sees it.
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
                  <span className="text-xs text-muted-foreground mt-1">{fmt.preview}</span>
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
