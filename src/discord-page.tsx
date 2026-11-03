import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Copy, Check } from 'lucide-react';
import { CityPicker, cityLabel, type Endpoint } from './lib/city-picker';
import { PLACES } from './lib/places';
import { STYLES, parseTimestamp, preview } from './lib/discord';
import { hm24, wallToUtc, ymdInTz } from './lib/tz';
import { isES, t } from './lib/i18n';
import './lib/analytics';
import './page.css';

// Interactive generator for /discord-timestamp-generator (glass panel look).
// The page's SEO content (formats table, how-it-works, FAQ) is static HTML.

const LOCALE = isES ? 'es-ES' : undefined;
const myTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const pad = (n: number) => String(n).padStart(2, '0');
const wallNow = (tz: string) => {
  const n = new Date();
  const { y, mo, d } = ymdInTz(n, tz);
  return `${y}-${pad(mo)}-${pad(d)}T${hm24(n, tz)}`;
};

const TEMPLATES = [
  { label: 'Event with countdown', build: (u: number) => `${t('Starts')} <t:${u}:F> (<t:${u}:R>)` },
  { label: 'Deadline', build: (u: number) => `${t('Closes')} <t:${u}:R>, <t:${u}:f>` },
];

const CopyMark: React.FC<{ done: boolean }> = ({ done }) => (
  <span className={`flex items-center gap-1 text-xs font-semibold whitespace-nowrap transition-colors ${done ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
    {done ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    {done ? t('Copied') : t('Copy')}
  </span>
);

const heading = 'block text-xs font-semibold text-zinc-400 mb-1.5';

const Decoder: React.FC = () => {
  const [code, setCode] = useState('');
  const parsed = code.trim() ? parseTimestamp(code) : null;
  return (
    <div className="p-4 sm:p-6 border-t border-white/5 relative">
      <label className={heading} htmlFor="ts-decode">{t('Read a timestamp')}</label>
      <input
        id="ts-decode"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="<t:1618935630:F>"
        spellCheck={false}
        className="w-full bg-zinc-800/60 text-zinc-100 border border-white/10 rounded-lg px-3 py-2.5 font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
      />
      <div aria-live="polite" className="text-sm mt-2 min-h-5">
        {parsed && (
          <p className="text-zinc-300">
            {preview(parsed.date, 'F', LOCALE)} <span className="text-zinc-500">· {preview(parsed.date, 'R', LOCALE)} · {t('style')} <code className="font-mono text-blue-300">{parsed.style}</code></span>
          </p>
        )}
        {code.trim() && !parsed && <p className="text-amber-400">{t('Paste a code like <t:1618935630:F> or a Unix time in seconds.')}</p>}
      </div>
    </div>
  );
};

const DiscordTool: React.FC = () => {
  const [zone, setZone] = useState<Endpoint>({ name: cityLabel(myTz), tz: myTz });
  const [wall, setWall] = useState(() => wallNow(myTz));
  const [copied, setCopied] = useState<string | null>(null);

  // An emptied native input keeps the last valid moment instead of breaking the codes.
  const [lastValid, setLastValid] = useState(wall);
  const onWall = (v: string) => { setWall(v); if (v) setLastValid(v); };
  const [datePart, timePart] = (wall || lastValid).split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);
  const date = wallToUtc(y, mo, d, hh, mm, zone.tz);
  const unix = Math.floor(date.getTime() / 1000);

  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden relative glow-line isolate">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5 relative">
        <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase">{t('Generate')}</span>
        <span className="text-xs text-zinc-500 hidden sm:inline">{t('Click any row to copy')}</span>
      </div>

      <div className="p-4 sm:p-6 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label>
            <span className={heading}>{t('Date & time')}</span>
            <input
              type="datetime-local"
              value={wall}
              onChange={(e) => onWall(e.target.value)}
              className="w-full bg-zinc-800/60 text-zinc-100 border border-white/10 rounded-lg px-3 py-2.5 font-mono text-sm [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </label>
          <CityPicker value={zone} onChange={setZone} label={t('Time zone of that time')} options={PLACES} />
        </div>
        <button onClick={() => onWall(wallNow(zone.tz))} className="text-sm text-blue-400 hover:text-blue-300 transition-colors py-1 mb-4">
          {t('Reset to now')}
        </button>

        <p className="text-xs text-zinc-500 mb-2">{t('Previews use your own time zone, as Discord will for you.')}</p>
        <div className="grid gap-2">
          {STYLES.map((f) => {
            const code = `<t:${unix}:${f.code}>`;
            return (
              <button
                key={f.code}
                onClick={() => copy(f.code, code)}
                title={t('Copy code')}
                className="glass-card group flex items-center justify-between gap-3 text-left w-full rounded-xl px-3 py-2.5"
              >
                <span className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium text-zinc-100">{t(f.label)}</span>
                  <span className="text-[13px] text-zinc-400 truncate">{preview(date, f.code, LOCALE)}</span>
                </span>
                <span className="flex items-center gap-2.5 shrink-0">
                  <code className="font-mono text-xs text-blue-300 bg-zinc-800/80 border border-white/10 rounded px-1.5 py-0.5 whitespace-nowrap hidden sm:inline">{code}</code>
                  <CopyMark done={copied === f.code} />
                </span>
              </button>
            );
          })}
        </div>

        <p className={`${heading} mt-5`}>{t('Ready-made messages')}</p>
        <div className="grid gap-2">
          {TEMPLATES.map((tpl) => {
            const text = tpl.build(unix);
            return (
              <button
                key={tpl.label}
                onClick={() => copy(tpl.label, text)}
                title={t('Copy code')}
                className="glass-card group flex items-center justify-between gap-3 text-left w-full rounded-xl px-3 py-2.5"
              >
                <span className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium text-zinc-100">{t(tpl.label)}</span>
                  <code className="font-mono text-[11px] text-blue-300 break-all">{text}</code>
                </span>
                <CopyMark done={copied === tpl.label} />
              </button>
            );
          })}
        </div>
      </div>

      <Decoder />
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
