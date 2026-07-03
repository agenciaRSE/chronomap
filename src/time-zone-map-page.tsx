import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './page.css';

// Standalone interactive island for /time-zone-map: live current time in major
// zones, updating every second. The page's SEO content (full UTC offset table)
// is static HTML; this only enhances it. App Tailwind design system.

interface Zone {
  city: string;
  tz: string;
}

const ZONES: Zone[] = [
  { city: 'Los Angeles', tz: 'America/Los_Angeles' },
  { city: 'New York', tz: 'America/New_York' },
  { city: 'São Paulo', tz: 'America/Sao_Paulo' },
  { city: 'London', tz: 'Europe/London' },
  { city: 'Paris', tz: 'Europe/Paris' },
  { city: 'Johannesburg', tz: 'Africa/Johannesburg' },
  { city: 'Dubai', tz: 'Asia/Dubai' },
  { city: 'New Delhi', tz: 'Asia/Kolkata' },
  { city: 'Singapore', tz: 'Asia/Singapore' },
  { city: 'Tokyo', tz: 'Asia/Tokyo' },
  { city: 'Sydney', tz: 'Australia/Sydney' },
  { city: 'Auckland', tz: 'Pacific/Auckland' },
];

function partsFor(now: Date, tz: string) {
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(now);
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'short', month: 'short', day: 'numeric',
  }).format(now);
  // Offset label (e.g. GMT+9) via the formatted time-zone name.
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
    .formatToParts(now)
    .find((p) => p.type === 'timeZoneName')?.value ?? '';
  return { time, day, offset };
}

const ZoneClocks: React.FC = () => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Current time by zone</span>
        <span className="text-xs text-zinc-500">live · your local time zone applies elsewhere</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {ZONES.map((z) => {
          const p = partsFor(now, z.tz);
          return (
            <div
              key={z.tz}
              className="flex items-center justify-between gap-3 bg-black/20 border border-zinc-800 rounded-xl px-3 py-2.5"
            >
              <span className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium text-zinc-100 truncate">{z.city}</span>
                <span className="text-[11px] text-zinc-500">{p.day} · {p.offset}</span>
              </span>
              <span className="font-mono text-lg font-bold text-white tabular-nums whitespace-nowrap">{p.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const el = document.getElementById('tzmap-app');
if (el) {
  el.innerHTML = '';
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <ZoneClocks />
    </React.StrictMode>
  );
}
