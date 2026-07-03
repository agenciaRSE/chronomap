import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Copy, Check } from 'lucide-react';
import './page.css';

// Standalone interactive island for /discord-timestamp-generator.
// The page's SEO content is static HTML; this only enhances the tool box.
// Styled with the app's Tailwind design system (zinc/blue) for consistency.

interface FmtRow {
  code: string;
  label: string;
  preview: string;
}

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
    const str = `<t:${unix}:${code}>`;
    navigator.clipboard?.writeText(str);
    setCopied(code);
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 1800);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Date &amp; time</label>
      <input
        type="datetime-local"
        value={inputValue}
        onChange={onPick}
        className="w-full bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-lg px-3 py-2.5 font-mono text-sm [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
      />
      <button
        onClick={() => setDate(new Date())}
        className="text-sm text-blue-400 hover:text-blue-300 transition-colors py-1 mb-3"
      >
        Reset to now
      </button>

      <div className="grid gap-2">
        {formats.map((f) => (
          <button
            key={f.code}
            onClick={() => copy(f.code)}
            title="Copy code"
            className="card-hover group flex items-center justify-between gap-3 text-left w-full bg-black/20 hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 rounded-xl px-3 py-2.5"
          >
            <span className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium text-zinc-100">{f.label}</span>
              <span className="text-[13px] text-zinc-400 truncate">{f.preview}</span>
            </span>
            <span className="flex items-center gap-2.5 shrink-0">
              <code className="font-mono text-xs text-blue-300 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 whitespace-nowrap">
                {`<t:${unix}:${f.code}>`}
              </code>
              <span
                className={`flex items-center gap-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                  copied === f.code ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-200'
                }`}
              >
                {copied === f.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === f.code ? 'Copied' : 'Copy'}
              </span>
            </span>
          </button>
        ))}
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
