import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Sun, Moon } from 'lucide-react';
import { t } from './lib/i18n';
import './lib/analytics';
import './page.css';

// Live-clocks glass panel for /time-zone-map (aidesigner-inspired look).
// The page's SEO content (UTC table, text, FAQ) is static HTML; this widget is
// the live layer. App Tailwind design system + shared glass classes.

interface Zone { city: string; tz: string; slug: string; }

const ZONES: Zone[] = [
  { city: 'Los Angeles', tz: 'America/Los_Angeles', slug: 'los-angeles' },
  { city: 'New York', tz: 'America/New_York', slug: 'new-york' },
  { city: 'São Paulo', tz: 'America/Sao_Paulo', slug: 'sao-paulo' },
  { city: 'London', tz: 'Europe/London', slug: 'london' },
  { city: 'Paris', tz: 'Europe/Paris', slug: 'paris' },
  { city: 'Johannesburg', tz: 'Africa/Johannesburg', slug: 'johannesburg' },
  { city: 'Dubai', tz: 'Asia/Dubai', slug: 'dubai' },
  { city: 'New Delhi', tz: 'Asia/Kolkata', slug: 'new-delhi' },
  { city: 'Singapore', tz: 'Asia/Singapore', slug: 'singapore' },
  { city: 'Tokyo', tz: 'Asia/Tokyo', slug: 'tokyo' },
  { city: 'Sydney', tz: 'Australia/Sydney', slug: 'sydney' },
  { city: 'Auckland', tz: 'Pacific/Auckland', slug: 'auckland' },
];

function fmt(now: Date, tz: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts }).format(now);
}
function part(now: Date, tz: string, opts: Intl.DateTimeFormatOptions, type: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts })
    .formatToParts(now).find((p) => p.type === type)?.value ?? '';
}

const HM: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };

const ZoneCard: React.FC<{ z: Zone; now: Date }> = ({ z, now }) => {
  const time = `${part(now, z.tz, HM, 'hour')}:${part(now, z.tz, HM, 'minute')}`;
  const ampm = part(now, z.tz, HM, 'dayPeriod');
  const date = fmt(now, z.tz, { month: 'short', day: 'numeric' });
  const day = fmt(now, z.tz, { weekday: 'short' });
  const offset = part(now, z.tz, { timeZoneName: 'shortOffset' }, 'timeZoneName');
  const hour24 = Number(fmt(now, z.tz, { hour: 'numeric', hour12: false }));
  const isDay = hour24 >= 6 && hour24 < 18;

  return (
    <a href={`/time/${z.slug}`} title={`${t('Current time in')} ${z.city}`} className="glass-card rounded-xl p-4 flex flex-col justify-between min-h-[140px] relative group">
      <div>
        <h3 className="text-[15px] font-medium text-white leading-none mb-1 group-hover:text-blue-300 transition-colors">{z.city}</h3>
        <div className="text-[11px] text-zinc-500">{date}</div>
      </div>
      <div className="my-2">
        <span className="inline-block bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] font-mono text-zinc-400">{offset}</span>
      </div>
      <div className="flex items-baseline gap-1 mt-auto">
        <span className="text-[30px] font-mono font-light text-white tracking-wider leading-none tabular-nums">{time}</span>
        <span className="text-xs font-mono text-zinc-500">{ampm}</span>
      </div>
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
        {isDay
          ? <Sun className="w-3.5 h-3.5 text-amber-400/80" />
          : <Moon className="w-3.5 h-3.5 text-blue-400/80" />}
        <span className="text-xs font-medium text-zinc-500">{day}</span>
      </div>
    </a>
  );
};

const LivePanel: React.FC = () => {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const utc = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(now);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden relative glow-line isolate">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5 relative">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 rounded border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase">{t('Live')}</span>
          </span>
          <span className="text-xs text-zinc-500 font-medium hidden sm:inline">{t('All times update in real-time')}</span>
        </div>
        <div className="flex items-center gap-3 text-zinc-400">
          <span className="flex items-end h-4 gap-1 opacity-60" aria-hidden="true">
            <span className="eq-bar" /><span className="eq-bar" /><span className="eq-bar" />
          </span>
          <span className="font-mono text-sm tabular-nums">{utc} UTC</span>
        </div>
      </div>
      <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative">
        {ZONES.map((z) => <ZoneCard key={z.tz} z={z} now={now} />)}
      </div>
      <div className="px-5 py-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-zinc-500 relative">
        <span>{t('Times update automatically every second · daylight saving handled')}</span>
        <span>{t('Powered by')} <a href="/" className="text-blue-400 hover:text-blue-300 transition-colors">ChronoMap</a></span>
      </div>
    </div>
  );
};

const el = document.getElementById('tzmap-app');
if (el) {
  el.innerHTML = '';
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <LivePanel />
    </React.StrictMode>
  );
}
