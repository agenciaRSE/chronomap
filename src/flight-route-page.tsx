import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Plane, Plus, X, Search } from 'lucide-react';
import airportsData from './airports.json';
import { wallToUtc, timeLabel, dayLabel, ymdInTz } from './lib/tz';
import { t } from './lib/i18n';
import './lib/analytics';
import './page.css';

// Flight route map for /flight-route-map: pick airports (with layovers), see the
// great-circle route on a world map and the local time at each stop. Airport
// coords from airports.json; world geometry reused from /countries-110m.json.

type Airport = { iata: string; city: string; country: string; lat: number; lng: number; tz: string };
const AIRPORTS = airportsData as Airport[];
const find = (iata: string) => AIRPORTS.find((a) => a.iata === iata)!;

const pad = (n: number) => String(n).padStart(2, '0');
const nowLocalInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const parseDT = (s: string) => {
  const [date, tm] = s.split('T');
  const [y, mo, d] = date.split('-').map(Number);
  const [hh, mm] = (tm || '00:00').split(':').map(Number);
  return { y, mo, d, hh, mm };
};
const durText = (mins: number) => (mins < 0 ? '—' : `${Math.floor(mins / 60)}h ${mins % 60}m`);

const AirportPicker: React.FC<{ value: string; onChange: (iata: string) => void }> = ({ value, onChange }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? AIRPORTS.filter((a) => a.city.toLowerCase().includes(q) || a.iata.toLowerCase().includes(q)).slice(0, 6) : [];
  }, [query]);
  const a = find(value);
  return (
    <div className="relative flex-1 min-w-0">
      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="search"
        value={open ? query : `${a.iata} · ${a.city}`}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { setQuery(''); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-label={t('Airport')}
        className="w-full bg-zinc-800/60 text-zinc-100 border border-white/10 rounded-lg pl-8 pr-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {open && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-lg shadow-2xl overflow-hidden">
          {results.map((r) => (
            <button key={r.iata} onMouseDown={() => { onChange(r.iata); setOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
              <span className="font-mono text-blue-300">{r.iata}</span> {r.city}<span className="text-zinc-600"> · {r.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const RouteMap: React.FC = () => {
  const [stops, setStops] = useState<string[]>(['MAD', 'JFK']);
  const [depDT, setDepDT] = useState(nowLocalInput());
  const [legDur, setLegDur] = useState<{ h: string; m: string }[]>([{ h: '8', m: '0' }]);
  const [layover, setLayover] = useState<{ h: string; m: string }[]>([]);
  const [world, setWorld] = useState<{ land: any; borders: any } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(720);

  useEffect(() => {
    fetch('/countries-110m.json').then((r) => r.json()).then((data: any) => {
      setWorld({
        land: topojson.feature(data, data.objects.countries),
        borders: topojson.mesh(data, data.objects.countries, (a: any, b: any) => a !== b),
      });
    }).catch(() => {});
  }, []);
  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el); setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const legs = stops.length - 1;
  // Compute the UTC instant at each stop (arrival / departure).
  const itinerary = useMemo(() => {
    const p = parseDT(depDT);
    let cursor = wallToUtc(p.y, p.mo, p.d, p.hh, p.mm, find(stops[0]).tz);
    const rows: { iata: string; arr?: Date; dep?: Date; layMins?: number }[] = [{ iata: stops[0], dep: cursor }];
    for (let i = 0; i < legs; i++) {
      const mins = (Number(legDur[i]?.h) || 0) * 60 + (Number(legDur[i]?.m) || 0);
      const arr = new Date(cursor.getTime() + mins * 60000);
      const row: { iata: string; arr?: Date; dep?: Date; layMins?: number } = { iata: stops[i + 1], arr };
      if (i + 1 < legs) {
        const lay = (Number(layover[i]?.h) || 0) * 60 + (Number(layover[i]?.m) || 0);
        row.dep = new Date(arr.getTime() + lay * 60000);
        row.layMins = lay;
        cursor = row.dep;
      }
      rows.push(row);
    }
    const first = rows[0].dep!;
    const last = rows[rows.length - 1].arr!;
    return { rows, totalMins: Math.round((last.getTime() - first.getTime()) / 60000) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, depDT, legDur, layover]);

  const h = Math.round(w * 0.52);
  const geo = useMemo(() => {
    const proj = d3.geoNaturalEarth1().fitExtent([[6, 6], [w - 6, h - 6]], { type: 'Sphere' } as any);
    const path = d3.geoPath(proj);
    const arcs = stops.slice(0, -1).map((from, i) => {
      const a = find(from), b = find(stops[i + 1]);
      const interp = d3.geoInterpolate([a.lng, a.lat], [b.lng, b.lat]);
      return { type: 'LineString', coordinates: d3.range(0, 1.0001, 1 / 40).map((tt) => interp(tt)) } as any;
    });
    const pts = stops.map((s) => { const a = find(s); const xy = proj([a.lng, a.lat]); return { a, x: xy?.[0] ?? -99, y: xy?.[1] ?? -99 }; });
    return { path, arcs, pts, sphere: path({ type: 'Sphere' } as any) || '' };
  }, [w, h, stops]);

  const setLeg = (i: number, k: 'h' | 'm', v: string) => setLegDur((p) => p.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const setLay = (i: number, k: 'h' | 'm', v: string) => setLayover((p) => p.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const addStop = () => {
    const next = AIRPORTS.find((a) => !stops.includes(a.iata))?.iata ?? 'LHR';
    setStops((s) => [...s, next]);
    setLegDur((d) => [...d, { h: '2', m: '0' }]);
    setLayover((l) => [...l, { h: '1', m: '30' }]);
  };
  const removeStop = (i: number) => {
    if (stops.length <= 2) return;
    setStops((s) => s.filter((_, j) => j !== i));
    setLegDur((d) => d.filter((_, j) => j !== Math.min(i, d.length - 1)));
    setLayover((l) => l.filter((_, j) => j !== Math.min(Math.max(i - 1, 0), l.length - 1)));
  };

  return (
    <div className="space-y-5">
      <div ref={wrapRef} className="glass-panel rounded-2xl overflow-hidden relative glow-line">
        <svg width={w} height={h} className="block" style={{ background: '#070709' }}>
          <path d={geo.sphere} fill="#0b0b0f" stroke="rgba(255,255,255,0.06)" />
          {world && <path d={geo.path(world.land as any) || ''} fill="#18181b" stroke="none" />}
          {world && <path d={geo.path(world.borders as any) || ''} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />}
          {geo.arcs.map((arc, i) => (
            <path key={i} d={geo.path(arc) || ''} fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.9} />
          ))}
          {geo.pts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={4} fill="#3b82f6" stroke="#fff" strokeWidth={1} />
              <text x={p.x} y={p.y - 8} textAnchor="middle" className="font-mono" fontSize={10} fill="#e4e4e7" style={{ paintOrder: 'stroke', stroke: '#070709', strokeWidth: 3 }}>{p.a.iata}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="glass-panel rounded-2xl p-4 sm:p-5 relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">{t('Itinerary')}</span>
          <span className="text-xs text-zinc-500">{t('Total trip')} <strong className="text-zinc-300">{durText(itinerary.totalMins)}</strong></span>
        </div>

        <div className="mb-4">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">{t('First departure')}</span>
          <input type="datetime-local" value={depDT} onChange={(e) => setDepDT(e.target.value)} style={{ colorScheme: 'dark' }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-auto" aria-label={t('First departure')} />
        </div>

        <div className="space-y-2">
          {stops.map((s, i) => {
            const row = itinerary.rows[i];
            const ap = find(s);
            return (
              <div key={i}>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-300 text-xs font-mono flex items-center justify-center shrink-0">{i + 1}</span>
                  <AirportPicker value={s} onChange={(iata) => setStops((st) => st.map((x, j) => (j === i ? iata : x)))} />
                  <div className="text-right shrink-0 w-28 text-xs">
                    {row.arr && <div className="text-zinc-300">{t('arr')} {timeLabel(row.arr, ap.tz)}</div>}
                    {row.dep && <div className="text-zinc-500">{t('dep')} {timeLabel(row.dep, ap.tz)}</div>}
                    {row.arr && <div className="text-[10px] text-zinc-600">{dayLabel(row.arr, ap.tz)}</div>}
                  </div>
                  {stops.length > 2 && (
                    <button onClick={() => removeStop(i)} aria-label={t('Remove stop')} className="text-zinc-600 hover:text-red-400 transition-colors shrink-0"><X className="w-4 h-4" /></button>
                  )}
                </div>
                {i < legs && (
                  <div className="flex items-center gap-2 pl-8 py-1.5 text-xs text-zinc-500">
                    <Plane className="w-3.5 h-3.5 text-blue-400 rotate-90" />
                    <span>{t('flight')}</span>
                    <input type="number" min="0" max="20" value={legDur[i]?.h ?? '0'} onChange={(e) => setLeg(i, 'h', e.target.value)} className="w-12 bg-white/5 border border-white/10 rounded px-1.5 py-1 text-center text-white font-mono" aria-label={t('Hours')} />h
                    <input type="number" min="0" max="59" value={legDur[i]?.m ?? '0'} onChange={(e) => setLeg(i, 'm', e.target.value)} className="w-12 bg-white/5 border border-white/10 rounded px-1.5 py-1 text-center text-white font-mono" aria-label={t('Minutes')} />m
                    {i < legs - 1 && (
                      <>
                        <span className="text-zinc-700">·</span><span>{t('layover')}</span>
                        <input type="number" min="0" max="48" value={layover[i]?.h ?? '0'} onChange={(e) => setLay(i, 'h', e.target.value)} className="w-12 bg-white/5 border border-white/10 rounded px-1.5 py-1 text-center text-white font-mono" aria-label={t('Hours')} />h
                        <input type="number" min="0" max="59" value={layover[i]?.m ?? '0'} onChange={(e) => setLay(i, 'm', e.target.value)} className="w-12 bg-white/5 border border-white/10 rounded px-1.5 py-1 text-center text-white font-mono" aria-label={t('Minutes')} />m
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={addStop} className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors">
          <Plus className="w-4 h-4" /> {t('Add stop / layover')}
        </button>
        <p className="text-[11px] text-zinc-600 mt-4">{t('Times are each airport\'s local time; in = arrival, out = next departure.')}</p>
      </div>
    </div>
  );
};

const el = document.getElementById('route-app');
if (el) {
  el.innerHTML = '';
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <RouteMap />
    </React.StrictMode>
  );
}
