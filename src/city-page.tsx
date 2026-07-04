import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Sun, Moon } from 'lucide-react';
import './page.css';

// Live clock for a /time/{city} page. Reads the target city + IANA time zone
// from the ct-* meta tags the generator writes. SEO text is static HTML.

const meta = (n: string) => document.querySelector(`meta[name="${n}"]`)?.getAttribute('content') ?? '';
const CITY = meta('ct-city');
const TZ = meta('ct-tz');

const REF: { city: string; tz: string }[] = [
  { city: 'London', tz: 'Europe/London' },
  { city: 'New York', tz: 'America/New_York' },
  { city: 'Los Angeles', tz: 'America/Los_Angeles' },
  { city: 'Paris', tz: 'Europe/Paris' },
  { city: 'Dubai', tz: 'Asia/Dubai' },
  { city: 'Tokyo', tz: 'Asia/Tokyo' },
  { city: 'Sydney', tz: 'Australia/Sydney' },
];

const HM: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
function part(now: Date, tz: string, opts: Intl.DateTimeFormatOptions, type: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts })
    .formatToParts(now).find((p) => p.type === type)?.value ?? '';
}
function fmt(now: Date, tz: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts }).format(now);
}

const CityClock: React.FC = () => {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeParts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).formatToParts(now);
  const g = (t: string) => timeParts.find((p) => p.type === t)?.value ?? '';
  const time = `${g('hour')}:${g('minute')}:${g('second')}`;
  const ampm = g('dayPeriod');
  const dayDate = fmt(now, TZ, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const offset = part(now, TZ, { timeZoneName: 'shortOffset' }, 'timeZoneName');
  const hour24 = Number(fmt(now, TZ, { hour: 'numeric', hour12: false }));
  const isDay = hour24 >= 6 && hour24 < 18;

  const refs = REF.filter((r) => r.tz !== TZ).slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-2xl p-8 relative overflow-hidden glow-line text-center isolate">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-blue-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wider text-blue-400 mb-3">
            {isDay ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            Current time in {CITY}
          </div>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl sm:text-6xl md:text-7xl font-mono font-light text-white tracking-tight tabular-nums">{time}</span>
            <span className="text-lg font-mono text-zinc-500">{ampm}</span>
          </div>
          <div className="text-zinc-400 mt-3">{dayDate}</div>
          <div className="mt-4">
            <span className="inline-block bg-white/5 border border-white/10 rounded-md px-3 py-1 text-xs font-mono text-zinc-300">{offset}</span>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 relative">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">{CITY} compared with</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {refs.map((r) => (
            <div key={r.tz} className="glass-card rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
              <span className="text-sm text-zinc-300 truncate">{r.city}</span>
              <span className="font-mono text-sm text-white tabular-nums whitespace-nowrap">
                {part(now, r.tz, HM, 'hour')}:{part(now, r.tz, HM, 'minute')}
                <span className="text-zinc-500 text-xs"> {part(now, r.tz, HM, 'dayPeriod')}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const el = document.getElementById('city-app');
if (el && CITY && TZ) {
  el.innerHTML = '';
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <CityClock />
    </React.StrictMode>
  );
}
