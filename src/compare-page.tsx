import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Sun, Moon, Calendar, Download } from 'lucide-react';
import { googleCalUrl, icsDataUrl } from './lib/calendar';
import './page.css';

// Two-city comparator for /time/{a}-to-{b} pages. Reads both cities + IANA zones
// from the ct-a-* / ct-b-* meta tags. SEO text is static HTML.

const meta = (n: string) => document.querySelector(`meta[name="${n}"]`)?.getAttribute('content') ?? '';
const A = { city: meta('ct-a-city'), tz: meta('ct-a-tz') };
const B = { city: meta('ct-b-city'), tz: meta('ct-b-tz') };

const HM: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
function part(now: Date, tz: string, opts: Intl.DateTimeFormatOptions, type: string) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts })
    .formatToParts(now).find((p) => p.type === type)?.value ?? '';
}
function fmt(now: Date, tz: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts }).format(now);
}
function offsetMin(now: Date, tz: string) {
  const s = part(now, tz, { timeZoneName: 'shortOffset' }, 'timeZoneName'); // GMT+9, GMT, GMT-3:30
  const m = s.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] || 0));
}
// HH:mm (24h) of an instant in a zone — the value shape an <input type="time"> wants.
const hm24 = (d: Date, tz: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
// Calendar Y/M/D of an instant as seen in a zone.
function ymdInTz(d: Date, tz: string) {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return { y: g('year'), mo: g('month'), d: g('day') };
}

// Converter: pick a wall-clock time in city A, see the equivalent in city B.
const Converter: React.FC<{ now: Date }> = ({ now }) => {
  const [custom, setCustom] = useState<string | null>(null);
  const hm = custom ?? hm24(now, A.tz);
  const [hh, mm] = hm.split(':').map(Number);

  // Anchor to A's current calendar day, then resolve the wall time to a real UTC
  // instant. ponytail: single-pass wall→UTC; the ambiguous DST-transition hour
  // (once a year, ~2am) can be off by 1h. Good enough — no tz lib on this island.
  const { y, mo, d } = ymdInTz(now, A.tz);
  const asUTC = Date.UTC(y, mo - 1, d, hh || 0, mm || 0);
  const instant = new Date(asUTC - offsetMin(new Date(asUTC), A.tz) * 60000);

  const bTime = fmt(instant, B.tz, HM);
  const aDay = ymdInTz(instant, A.tz);
  const bDay = ymdInTz(instant, B.tz);
  const delta = Math.round(
    (Date.UTC(bDay.y, bDay.mo - 1, bDay.d) - Date.UTC(aDay.y, aDay.mo - 1, aDay.d)) / 86400000
  );
  const dayLabel = delta === 0 ? '' : delta > 0 ? ' (next day)' : ' (prev. day)';

  return (
    <div className="px-5 py-4 border-t border-white/5 relative">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm text-zinc-300">
        <span className="text-zinc-500">When it's</span>
        <input
          type="time"
          value={hm}
          onChange={(e) => setCustom(e.target.value)}
          aria-label={`Time in ${A.city}`}
          className="bg-white/5 border border-white/10 rounded px-2 py-1 font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={{ colorScheme: 'dark' }}
        />
        <span>in <span className="text-white font-medium">{A.city}</span>,</span>
        <span className="text-zinc-500">it's</span>
        <span className="font-mono text-white font-medium">{bTime}</span>
        <span>in <span className="text-white font-medium">{B.city}</span>{dayLabel}</span>
        {custom && (
          <button
            onClick={() => setCustom(null)}
            className="ml-1 text-[11px] text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            reset to now
          </button>
        )}
      </div>
      {(() => {
        const title = `Call — ${A.city} / ${B.city}`;
        const details = `${A.city}: ${hm}, ${B.city}: ${bTime}${dayLabel} · via ChronoMap`;
        return (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            <a
              href={googleCalUrl(title, instant, 30, details)}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg border border-blue-400/30 transition-all"
            >
              <Calendar className="w-3.5 h-3.5" /> Google Calendar
            </a>
            <a
              href={icsDataUrl(title, instant, 30, details)}
              download="chronomap-time.ics"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-200 rounded-lg border border-white/10 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> .ics
            </a>
          </div>
        );
      })()}
    </div>
  );
};

const Clock: React.FC<{ c: { city: string; tz: string }; now: Date }> = ({ c, now }) => {
  const time = `${part(now, c.tz, HM, 'hour')}:${part(now, c.tz, HM, 'minute')}`;
  const ampm = part(now, c.tz, HM, 'dayPeriod');
  const day = fmt(now, c.tz, { weekday: 'short', month: 'short', day: 'numeric' });
  const offset = part(now, c.tz, { timeZoneName: 'shortOffset' }, 'timeZoneName');
  const hour24 = Number(fmt(now, c.tz, { hour: 'numeric', hour12: false }));
  const isDay = hour24 >= 6 && hour24 < 18;
  return (
    <div className="glass-card rounded-xl p-5 text-center relative">
      <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-zinc-200 mb-2">
        {isDay ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
        {c.city}
      </div>
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-4xl font-mono font-light text-white tabular-nums">{time}</span>
        <span className="text-sm font-mono text-zinc-500">{ampm}</span>
      </div>
      <div className="text-xs text-zinc-500 mt-2">{day}</div>
      <div className="mt-2"><span className="inline-block bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] font-mono text-zinc-400">{offset}</span></div>
    </div>
  );
};

const Comparator: React.FC = () => {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = (offsetMin(now, B.tz) - offsetMin(now, A.tz)) / 60;
  const abs = Math.abs(diff);
  const hrs = Number.isInteger(abs) ? `${abs}` : abs.toFixed(1).replace('.0', '');
  const label =
    diff === 0 ? `${A.city} and ${B.city} are in the same time`
    : `${B.city} is ${hrs} hour${abs === 1 ? '' : 's'} ${diff > 0 ? 'ahead of' : 'behind'} ${A.city}`;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden relative glow-line isolate">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-6 relative">
        <Clock c={A} now={now} />
        <Clock c={B} now={now} />
      </div>
      <div className="px-5 py-4 border-t border-white/5 text-center text-sm text-zinc-300 relative">
        {label}
      </div>
      <Converter now={now} />
    </div>
  );
};

const el = document.getElementById('compare-app');
if (el && A.tz && B.tz) {
  el.innerHTML = '';
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <Comparator />
    </React.StrictMode>
  );
}
