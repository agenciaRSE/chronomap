import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { X, Search, Users, Calendar, Download } from 'lucide-react';
import citiesData from './cities.json';
import { googleCalUrl, icsDataUrl } from './lib/calendar';
import './page.css';

// Meeting planner for /meeting-planner. Pick cities, see a 24-hour band per city
// with working hours highlighted and the overlap where a call suits everyone.
// All time math is Intl-only (no tz lib on this island).

type City = { slug: string; name: string; country: string; tz: string };
type Row = { key: string; label: string; tz: string };
const CITIES = citiesData as City[];

const WORK_START = 9; // 09:00 inclusive
const WORK_END = 18; // 18:00 exclusive
const isWork = (h: number) => h >= WORK_START && h < WORK_END;
const isNight = (h: number) => h < 7 || h >= 22;

function offsetMin(d: Date, tz: string) {
  const s = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
    .formatToParts(d).find((p) => p.type === 'timeZoneName')?.value ?? '';
  const m = s.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] || 0)) : 0;
}
function ymdInTz(d: Date, tz: string) {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return { y: g('year'), mo: g('month'), d: g('day') };
}
const hourInTz = (d: Date, tz: string) =>
  Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }).format(d)) % 24;
const timeLabel = (d: Date, tz: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
const dayLabel = (d: Date, tz: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(d);
const refHourLabel = (h: number) => (h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`);

// A city whose IANA zone matches the visitor's, for a friendly first row.
const myTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const myMatch = CITIES.find((c) => c.tz === myTz);
const DEFAULT_ROWS: Row[] = [
  { key: 'you', label: myMatch ? `${myMatch.name} (You)` : 'Your location', tz: myTz },
  { key: 'london', label: 'London', tz: 'Europe/London' },
  { key: 'new-york', label: 'New York', tz: 'America/New_York' },
].filter((r, i, a) => a.findIndex((x) => x.tz === r.tz) === i); // dedupe by tz

const Planner: React.FC = () => {
  const [now, setNow] = useState(() => new Date());
  const [rows, setRows] = useState<Row[]>(() => {
    try {
      const saved = localStorage.getItem('chronomap-planner-rows');
      if (saved) {
        const parsed = JSON.parse(saved) as Row[];
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch { /* ignore */ }
    return DEFAULT_ROWS;
  });
  const [query, setQuery] = useState('');
  const ref = rows[0];

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    localStorage.setItem('chronomap-planner-rows', JSON.stringify(rows));
  }, [rows]);

  const dayKey = ymdInTz(now, ref.tz);
  // 24 UTC instants, one per hour of the reference city's local day.
  const instants = useMemo(() => {
    const { y, mo, d } = dayKey;
    return Array.from({ length: 24 }, (_, h) => {
      const asUTC = Date.UTC(y, mo - 1, d, h, 0);
      return new Date(asUTC - offsetMin(new Date(asUTC), ref.tz) * 60000);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.tz, dayKey.y, dayKey.mo, dayKey.d]);

  // Columns where every city is inside working hours = a good meeting slot.
  const overlap = useMemo(
    () => instants.map((inst) => rows.every((r) => isWork(hourInTz(inst, r.tz)))),
    [instants, rows]
  );

  const nowRefHour = hourInTz(now, ref.tz);
  const [selCol, setSelCol] = useState<number>(nowRefHour);
  const initedSel = useRef(false);
  useEffect(() => {
    if (!initedSel.current) { setSelCol(nowRefHour); initedSel.current = true; }
  }, [nowRefHour]);

  const results = useMemo(
    () => CITIES.filter((c) => query.trim() && c.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6),
    [query]
  );
  const addCity = (c: City) => {
    setRows((prev) => (prev.some((r) => r.tz === c.tz) ? prev : [...prev, { key: c.slug, label: c.name, tz: c.tz }]));
    setQuery('');
  };
  const removeRow = (key: string) => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));

  return (
    <div className="w-full">
      {/* Add city */}
      <div className="relative max-w-sm mx-auto mb-6">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Add a city…"
          aria-label="Add a city to the planner"
          className="w-full bg-zinc-800/60 text-zinc-100 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
        {results.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-lg shadow-2xl overflow-hidden">
            {results.map((c) => (
              <button
                key={c.slug}
                onClick={() => addCity(c)}
                className="block w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                {c.name}<span className="text-zinc-600"> · {c.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="glass-panel rounded-2xl p-3 sm:p-4 overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Header: reference-city hours */}
          <div className="flex items-center mb-1">
            <div className="w-32 shrink-0" />
            <div className="flex-1 grid grid-cols-24" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
              {instants.map((_, h) => (
                <button
                  key={h}
                  onClick={() => setSelCol(h)}
                  className={`text-[9px] font-mono py-0.5 rounded-t ${
                    h === selCol ? 'text-white bg-blue-500/20' : h === nowRefHour ? 'text-blue-300' : 'text-zinc-600'
                  }`}
                >
                  {refHourLabel(h)}
                </button>
              ))}
            </div>
          </div>

          {rows.map((r) => (
            <div key={r.key} className="flex items-center group py-0.5">
              <div className="w-32 shrink-0 pr-2 flex items-center gap-1">
                <span className="text-xs font-medium text-zinc-300 truncate" title={r.label}>{r.label}</span>
                {rows.length > 1 && (
                  <button
                    onClick={() => removeRow(r.key)}
                    aria-label={`Remove ${r.label}`}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex-1 grid" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                {instants.map((inst, h) => {
                  const hr = hourInTz(inst, r.tz);
                  const work = isWork(hr);
                  const night = isNight(hr);
                  const sel = h === selCol;
                  const good = overlap[h];
                  const bg = work
                    ? good ? 'bg-emerald-500/30' : 'bg-blue-500/15'
                    : night ? 'bg-zinc-800/40' : 'bg-zinc-700/25';
                  return (
                    <button
                      key={h}
                      onClick={() => setSelCol(h)}
                      title={`${timeLabel(inst, r.tz)} — ${r.label}`}
                      className={`h-8 flex items-center justify-center text-[10px] font-mono border-r border-black/20 ${bg} ${
                        sel ? 'ring-2 ring-inset ring-blue-400 text-white' : work ? 'text-zinc-200' : 'text-zinc-500'
                      } ${h === 0 ? 'rounded-l' : ''} ${h === 23 ? 'rounded-r' : ''}`}
                    >
                      {hr}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500/30 inline-block" /> Everyone available</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500/15 inline-block" /> Working hours (9–18)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-zinc-800/40 inline-block" /> Night</span>
      </div>

      {/* Selected slot summary */}
      <div className="glass-card rounded-xl p-4 sm:p-5 mt-6">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-white">
          <Users className="w-4 h-4 text-blue-400" />
          At {refHourLabel(selCol)} in {ref.label.replace(' (You)', '')}, everyone is at:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rows.map((r) => {
            const inst = instants[selCol];
            const work = isWork(hourInTz(inst, r.tz));
            return (
              <div key={r.key} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                <span className="text-sm text-zinc-300 truncate">{r.label}</span>
                <span className="text-right shrink-0 ml-2">
                  <span className={`font-mono text-sm ${work ? 'text-emerald-300' : 'text-zinc-400'}`}>{timeLabel(inst, r.tz)}</span>
                  <span className="block text-[10px] text-zinc-600">{dayLabel(inst, r.tz)}</span>
                </span>
              </div>
            );
          })}
        </div>
        {(() => {
          const slot = instants[selCol];
          const title = `Call — ${refHourLabel(selCol)} ${ref.label.replace(' (You)', '')}`;
          const details = rows.map((r) => `${r.label}: ${timeLabel(slot, r.tz)}`).join(', ') + ' · via ChronoMap';
          return (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <a
                href={googleCalUrl(title, slot, 30, details)}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg border border-blue-400/30 transition-all"
              >
                <Calendar className="w-3.5 h-3.5" /> Add to Google Calendar
              </a>
              <a
                href={icsDataUrl(title, slot, 30, details)}
                download="chronomap-meeting.ics"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-200 rounded-lg border border-white/10 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Download .ics
              </a>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

const el = document.getElementById('planner-app');
if (el) {
  el.innerHTML = '';
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <Planner />
    </React.StrictMode>
  );
}
