import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ArrowLeftRight, Check, Link2 } from 'lucide-react';
import { CityPicker, cityByTz, type Endpoint } from './lib/city-picker';
import { PLACES } from './lib/places';
import { dayDelta, hm24, offsetMin, utcLabel, wallToUtc, ymdInTz } from './lib/tz';
import { isES, t } from './lib/i18n';
import './lib/analytics';
import './page.css';

// Time zone converter for /time-zone-converter. State lives in the URL
// (?from=&to=&t=&d=) so a result can be shared and old comparator pages can
// redirect here with their two places already selected.

const bySlug = (slug: string | null) => PLACES.find((o) => o.slug === slug);

const LOCALE = isES ? 'es-ES' : 'en-US';
const timeIn = (d: Date, tz: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(d);
const dateIn = (d: Date, tz: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric' }).format(d);
const dayMark = (delta: number) => (delta > 0 ? t(' (next day)') : delta < 0 ? t(' (prev. day)') : '');

const params = new URLSearchParams(location.search);
const browserCity = cityByTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
const initialFrom = bySlug(params.get('from')) ?? browserCity ?? bySlug('utc')!;
const initialTo = bySlug(params.get('to')) ?? bySlug(initialFrom.slug === 'utc' ? 'est' : 'utc')!;

const Converter: React.FC = () => {
  const [from, setFrom] = useState<Endpoint>(initialFrom);
  const [to, setTo] = useState<Endpoint>(initialTo);
  const [time, setTime] = useState(() => {
    const v = params.get('t') ?? '';
    return /^\d{2}:\d{2}$/.test(v) ? v : hm24(new Date(), initialFrom.tz);
  });
  const [date, setDate] = useState(() => {
    const v = params.get('d') ?? '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const { y, mo, d } = ymdInTz(new Date(), initialFrom.tz);
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  });
  const [copied, setCopied] = useState(false);

  // An emptied native input must not break the result: read it as the start of the day / today.
  const [y, mo, d] = (date || new Date().toISOString().slice(0, 10)).split('-').map(Number);
  const [hh, mm] = (time || '00:00').split(':').map(Number);
  const instant = wallToUtc(y, mo, d, hh, mm, from.tz);
  const delta = dayDelta(instant, from.tz, to.tz);

  const gapMin = offsetMin(instant, to.tz) - offsetMin(instant, from.tz);
  const gapH = Math.abs(gapMin) / 60;
  const gap = gapMin === 0
    ? `${from.name} ${t('and')} ${to.name} ${t('are in the same time')}`
    : `${to.name} ${t('is')} ${gapH} ${gapH === 1 ? t('hour') : t('hours')} ${gapMin > 0 ? t('ahead of') : t('behind')} ${from.name}`;

  const rows = useMemo(
    () => [0, 3, 6, 9, 12, 15, 18, 21].map((h) => wallToUtc(y, mo, d, h, 0, from.tz)),
    [y, mo, d, from.tz]
  );

  useEffect(() => {
    const q = new URLSearchParams();
    if (from.slug) q.set('from', from.slug);
    if (to.slug) q.set('to', to.slug);
    q.set('t', time);
    q.set('d', date);
    history.replaceState(null, '', `${location.pathname}?${q}`);
  }, [from, to, time, date]);

  const swap = () => { setFrom(to); setTo(from); };
  const copy = async () => {
    await navigator.clipboard.writeText(location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const field = 'w-full bg-zinc-800/60 text-zinc-100 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all';
  const label = 'block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5';

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 glow-line">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 sm:items-end">
        <CityPicker value={from} onChange={setFrom} label={t('From')} options={PLACES} />
        <button
          onClick={swap}
          aria-label={t('Swap time zones')}
          title={t('Swap time zones')}
          className="justify-self-center flex items-center justify-center w-11 h-11 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 transition-all"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>
        <CityPicker value={to} onChange={setTo} label={t('To')} options={PLACES} />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <label>
          <span className={label}>{t('Time')}</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} style={{ colorScheme: 'dark' }} />
        </label>
        <label>
          <span className={label}>{t('Date')}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} style={{ colorScheme: 'dark' }} />
        </label>
      </div>

      <div className="mt-5 rounded-xl bg-blue-500/10 border border-blue-500/20 p-5 text-center" aria-live="polite">
        <p className="text-sm text-zinc-400">
          {timeIn(instant, from.tz)} {from.name} <span className="text-zinc-500">({utcLabel(offsetMin(instant, from.tz))})</span> =
        </p>
        <p className="text-4xl sm:text-5xl font-mono font-semibold text-white my-2 tabular-nums">{timeIn(instant, to.tz)}</p>
        <p className="text-sm text-zinc-300">
          {to.name} <span className="text-zinc-500">({utcLabel(offsetMin(instant, to.tz))})</span>, {dateIn(instant, to.tz)}{dayMark(delta)}
        </p>
        <p className="text-xs text-zinc-500 mt-2">{gap}</p>
      </div>

      <div className="flex justify-center mt-3">
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-200 rounded-lg border border-white/10 transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Link2 className="w-3.5 h-3.5" />}
          {copied ? t('Link copied') : t('Copy link to this conversion')}
        </button>
      </div>

      <table className="w-full mt-5 text-sm">
        <caption className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">{t('Through the day')}</caption>
        <thead>
          <tr className="text-left text-zinc-500 border-b border-white/10">
            <th scope="col" className="py-2 font-medium">{from.name}</th>
            <th scope="col" className="py-2 font-medium">{to.name}</th>
          </tr>
        </thead>
        <tbody className="font-mono text-zinc-300">
          {rows.map((r) => (
            <tr key={r.getTime()} className="border-b border-white/5">
              <td className="py-1.5">{timeIn(r, from.tz)}</td>
              <td className="py-1.5">{timeIn(r, to.tz)}<span className="text-zinc-500 font-sans text-xs">{dayMark(dayDelta(r, from.tz, to.tz))}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const el = document.getElementById('converter-app');
if (el) {
  el.innerHTML = '';
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <Converter />
    </React.StrictMode>
  );
}
