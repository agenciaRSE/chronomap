
import React, { useState } from 'react';
import { Copy, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { STYLES, preview } from '../src/lib/discord';
import { t, dateLocale, isES } from '../src/lib/i18n';

interface DiscordGeneratorProps {
  targetDate: Date;
  timezone: string;
  onClose: () => void;
}

export const DiscordGenerator: React.FC<DiscordGeneratorProps> = ({ targetDate, timezone, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const unixTimestamp = Math.floor(targetDate.getTime() / 1000);

  const formats = STYLES.map((f) => ({ code: f.code, label: t(f.label), preview: preview(targetDate, f.code, isES ? 'es-ES' : undefined) }));

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
            {t('Discord Timestamp Generator')}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('Close')}
            className="text-white/70 hover:text-white transition-colors text-2xl leading-none p-1 hover:bg-white/10 rounded-md"
          >
            &times;
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
             {t('Generate a dynamic timestamp for')} <span className="text-primary font-mono">{format(targetDate, 'yyyy-MM-dd HH:mm:ss')}</span>.
             {' '}{t('Previews show how it will look in Discord.')}
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
                
                <div className="flex items-center gap-2">
                  <button 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-xs font-medium border ${
                      copied === fmt.code 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                        : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {copied === fmt.code ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('Copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t('Copy')}</span>
                      </>
                    )}
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
