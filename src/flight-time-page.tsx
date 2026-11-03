import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Plane } from 'lucide-react';
import { wallToUtc, timeLabel, dayLabel, ymdInTz, offsetMin } from './lib/tz';
import { CityPicker, CITIES, cityLabel, type Endpoint } from './lib/city-picker';
import { t } from './lib/i18n';
import './lib/analytics';
import './page.css';

// Flight arrival-time / duration calculator for /flight-time-calculator.
// Pure Intl timezone math (wallToUtc) — no flight data, no API.

const myTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const label = cityLabel;

// Local datetime-local default (departure ~ now, rounded), formatted for the input.
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

const Flight: React.FC = () => {
  const [mode, setMode] = useState<'arrival' | 'duration'>('arrival');
  const [dep, setDep] = useState<Endpoint>({ name: label(myTz), tz: myTz });
  const [arr, setArr] = useState<Endpoint>(() => {
    const other = CITIES.find((c) => c.tz !== myTz) ?? CITIES[0];
    return { name: other.name, tz: other.tz };
  });
  const [depDT, setDepDT] = useState(nowLocalInput());
  const [durH, setDurH] = useState('3');
  const [durM, setDurM] = useState('30');
  const [arrDT, setArrDT] = useState(nowLocalInput());

  const p = parseDT(depDT);
  const depUTC = wallToUtc(p.y, p.mo, p.d, p.hh, p.mm, dep.tz);

  // ponytail: arrival is a wall time on the arrival day the user typed; we only
  // need the delta between two real UTC instants, which is DST-correct.
  const result = useMemo(() => {
    if (mode === 'arrival') {
      const mins = (Number(durH) || 0) * 60 + (Number(durM) || 0);
      const arrUTC = new Date(depUTC.getTime() + mins * 60000);
      const depDay = ymdInTz(depUTC, dep.tz);
      const arrDay = ymdInTz(arrUTC, arr.tz);
      const delta = Math.round((Date.UTC(arrDay.y, arrDay.mo - 1, arrDay.d) - Date.UTC(depDay.y, depDay.mo - 1, depDay.d)) / 86400000);
      return { arrUTC, delta, mins };
    } else {
      const a = parseDT(arrDT);
      const arrUTC = wallToUtc(a.y, a.mo, a.d, a.hh, a.mm, arr.tz);
      const mins = Math.round((arrUTC.getTime() - depUTC.getTime()) / 60000);
      return { arrUTC, delta: 0, mins };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, depDT, durH, durM, arrDT, dep.tz, arr.tz]);

  const inputCls = 'bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500';
  const durMins = result.mins;
  const durText = durMins >= 0 ? `${Math.floor(durMins / 60)}h ${durMins % 60}m` : t('arrival before departure');
  const dayTag = result.delta > 0 ? t('(next day)') : result.delta < 0 ? t('(prev. day)') : '';
  const gapMin = offsetMin(result.arrUTC, arr.tz) - offsetMin(result.arrUTC, dep.tz);
  const gapH = Math.abs(gapMin) / 60;
  const gap = gapMin === 0
    ? `${dep.name} ${t('and')} ${arr.name} ${t('are in the same time')}`
    : `${arr.name} ${t('is')} ${gapH} ${gapH === 1 ? t('hour') : t('hours')} ${gapMin > 0 ? t('ahead of') : t('behind')} ${dep.name}`;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden relative glow-line isolate">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="flex p-1.5 gap-1 border-b border-white/5 relative">
        {(['arrival', 'duration'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${mode === m ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30' : 'text-zinc-400 hover:text-white'}`}
          >
            {m === 'arrival' ? t('Arrival time') : t('Flight duration')}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6 space-y-4 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CityPicker value={dep} onChange={setDep} label={t('From')} />
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">{t('Departure')}</span>
            <input type="datetime-local" value={depDT} onChange={(e) => setDepDT(e.target.value)} className={`${inputCls} w-full`} style={{ colorScheme: 'dark' }} aria-label={t('Departure')} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CityPicker value={arr} onChange={setArr} label={t('To')} />
          {mode === 'arrival' ? (
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">{t('Flight duration')}</span>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="30" value={durH} onChange={(e) => setDurH(e.target.value)} className={`${inputCls} w-16 text-center`} aria-label={t('Hours')} />
                <span className="text-zinc-500 text-sm">h</span>
                <input type="number" min="0" max="59" value={durM} onChange={(e) => setDurM(e.target.value)} className={`${inputCls} w-16 text-center`} aria-label={t('Minutes')} />
                <span className="text-zinc-500 text-sm">m</span>
              </div>
            </div>
          ) : (
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">{t('Arrival (local)')}</span>
              <input type="datetime-local" value={arrDT} onChange={(e) => setArrDT(e.target.value)} className={`${inputCls} w-full`} style={{ colorScheme: 'dark' }} aria-label={t('Arrival (local)')} />
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-5 border-t border-white/5 relative text-center">
        <div className="flex items-center justify-center gap-3 text-zinc-400 text-sm mb-2">
          <span>{dep.name}</span>
          <Plane className="w-4 h-4 text-blue-400 rotate-90" />
          <span>{arr.name}</span>
        </div>
        {mode === 'arrival' ? (
          <>
            <div className="text-sm text-zinc-500 mb-1">{t('You arrive at')}</div>
            <div className="text-3xl sm:text-4xl font-mono font-light text-white tabular-nums">{timeLabel(result.arrUTC, arr.tz)}</div>
            <div className="text-sm text-zinc-400 mt-1">{dayLabel(result.arrUTC, arr.tz)} {dayTag && <span className="text-blue-300">{dayTag}</span>}</div>
            <div className="text-xs text-zinc-500 mt-3">{t('local time in')} {arr.name} · {t('flight')} {durText}</div>
            <div className="text-xs text-zinc-500 mt-1">{t('When you land, it is')} {timeLabel(result.arrUTC, dep.tz)} {t('in')} {dep.name} · {gap}</div>
          </>
        ) : (
          <>
            <div className="text-sm text-zinc-500 mb-1">{t('Flight duration')}</div>
            <div className={`text-3xl sm:text-4xl font-mono font-light tabular-nums ${durMins >= 0 ? 'text-white' : 'text-amber-400'}`}>{durText}</div>
            <div className="text-xs text-zinc-500 mt-3">{t('based on local departure and arrival times, adjusted for the time-zone difference')} · {gap}</div>
          </>
        )}
      </div>
    </div>
  );
};

const el = document.getElementById('flight-app');
if (el) {
  el.innerHTML = '';
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <Flight />
    </React.StrictMode>
  );
}
