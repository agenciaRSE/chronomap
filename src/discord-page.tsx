import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Copy, Check } from 'lucide-react';
import './page.css';

// Interactive generator for /discord-timestamp-generator (glass panel look).
// The page's SEO content (formats table, how-it-works, FAQ) is static HTML.

interface FmtRow { code: string; label: string; preview: string; }

function buildFormats(date: Date): FmtRow[] {
  return [
    { code: 't', label: 'Short Time', preview: format(date, 'p', { locale: enUS }) },
    { code: 'T', label: 'Long Time', preview: format(date, 'pp', { locale: enUS }) },
    { code: 'd', label: 'Short Date', preview: format(date, 'P', { locale: enUS }) },
    { code: 'D', label: 'Long Date', preview: format(date, 'PP', { locale: enUS }) },
    { code: 'f', label: 'Short Date/Time', preview: format(date, 'Pp', { locale: enUS }) },
    { code: 'F', label: 'Long Date/Time', preview: format(date, 'PPpp', { locale: enUS }) },
    { code: 'R', label: 'Relative', preview: formatDistanceToNow(date, { addSuffix: true, locale: enUS }) },
  ];
}

const DiscordTool: React.FC = () => {
  const [date, setDate] = useState<Date>(() => new Date());
  const [copied, setCopied] = useState<string | null>(null);

  const unix = Math.floor(date.getTime() / 1000);
  const formats = useMemo(() => buildFormats(date), [date]);
  const inputValue = format(date, "yyyy-MM-dd'T'HH:mm");

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = new Date(e.target.value);
    if (!Number.isNaN(next.getTime())) setDate(next);
  };

  const copy = (code: string) => {
    navigator.clipboard?.writeText(`<t:${unix}:${code}>`);
    setCopied(code);
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 1800);
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden relative glow-line isolate">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5 relative">
        <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase">Generate</span>
        <span className="text-xs text-zinc-500 hidden sm:inline">Click any row to copy</span>
      </div>

      <div className="p-4 sm:p-6 relative">
        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Date &amp; time</label>
        <input
          type="datetime-local"
          value={inputValue}
          onChange={onPick}
          className="w-full bg-zinc-800/60 text-zinc-100 border border-white/10 rounded-lg px-3 py-2.5 font-mono text-sm [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
        <button onClick={() => setDate(new Date())} className="text-sm text-blue-400 hover:text-blue-300 transition-colors py-1 mb-4">
          Reset to now
        </button>

        <div className="grid gap-2">
          {formats.map((f) => (
            <button
              key={f.code}
              onClick={() => copy(f.code)}
              title="Copy code"
              className="glass-card group flex items-center justify-between gap-3 text-left w-full rounded-xl px-3 py-2.5"
            >
              <span className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium text-zinc-100">{f.label}</span>
                <span className="text-[13px] text-zinc-400 truncate">{f.preview}</span>
              </span>
              <span className="flex items-center gap-2.5 shrink-0">
                <code className="font-mono text-xs text-blue-300 bg-zinc-800/80 border border-white/10 rounded px-1.5 py-0.5 whitespace-nowrap">
                  {`<t:${unix}:${f.code}>`}
                </code>
                <span className={`flex items-center gap-1 text-xs font-semibold whitespace-nowrap transition-colors ${copied === f.code ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                  {copied === f.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === f.code ? 'Copied' : 'Copy'}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const el = document.getElementById('discord-app');
if (el) {
  el.innerHTML = '';
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <DiscordTool />
    </React.StrictMode>
  );
}
