import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Sunrise, Sunset, ArrowRight } from 'lucide-react';
import { offsetMin } from './lib/tz';
import { CityPicker, CITIES, cityLabel, type Endpoint } from './lib/city-picker';
import { dailyPlan, estimate, preFlightBedtimes } from './lib/jetlag';
import { isES, t } from './lib/i18n';
import './lib/analytics';
import './page.css';

// Jet-lag estimator for /jet-lag-calculator: time zones crossed, direction, recovery
// days and a day-by-day plan. Rates and advice follow the CDC Yellow Book (see lib/jetlag.ts).

const myTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const clock = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  if (isES) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

const JetLag: React.FC = () => {
  const [from, setFrom] = useState<Endpoint>({ name: cityLabel(myTz), tz: myTz });
  const [to, setTo] = useState<Endpoint>(() => {
    const other = CITIES.find((c) => c.tz !== myTz) ?? CITIES[0];
    return { name: other.name, tz: other.tz };
  });
  const [bedtime, setBedtime] = useState('23:00');

  const now = new Date();
  const { crossed, east, days, severity } = estimate(offsetMin(now, from.tz), offsetMin(now, to.tz));
  const [bh, bm] = (bedtime || '23:00').split(':').map(Number);
  const bedMin = bh * 60 + bm;
  const before = preFlightBedtimes(crossed, east, bedMin);
  const plan = dailyPlan(crossed, east, bedMin);

  const sevColor: Record<string, string> = {
    none: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    mild: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    moderate: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
    severe: 'text-red-300 bg-red-500/10 border-red-500/20',
  };
  const sevLabel: Record<string, string> = {
    none: t('None'), mild: t('Mild'), moderate: t('Moderate'), severe: t('Severe'),
  };

  const tips = crossed === 0
    ? [t('No time-zone change, so you should not get jet lag.')]
    : [
        east
          ? t('At your destination, get bright morning light. It moves your body clock earlier.')
          : t('At your destination, get light in the evening. It moves your body clock later.'),
        t('During the day, keep any nap to 20-30 minutes. Longer naps make it harder to sleep at night.'),
        t('On the plane, drink water and limit alcohol and caffeine.'),
        t('Melatonin only helps at the right time, and the wrong time can make things worse. Ask a doctor before using it.'),
      ];

  const panelHeading = 'text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3';

  return (
    <div className="glass-panel rounded-2xl overflow-hidden relative glow-line isolate">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-4 relative">
        <CityPicker value={from} onChange={setFrom} label={t('From')} />
        <ArrowRight className="w-5 h-5 text-zinc-600 hidden sm:block mb-2.5 mx-auto" />
        <CityPicker value={to} onChange={setTo} label={t('To')} />
      </div>

      <div className="px-5 py-6 border-t border-white/5 relative text-center">
        {crossed === 0 ? (
          <div className="text-2xl font-medium text-emerald-300">{t('No time-zone change')}</div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 mb-1">
              {east ? <Sunrise className="w-5 h-5 text-amber-400" /> : <Sunset className="w-5 h-5 text-blue-400" />}
              <span className="text-sm text-zinc-400">{east ? t('Body clock moves east') : t('Body clock moves west')}</span>
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-light text-white tabular-nums">
              {crossed} {crossed === 1 ? t('time zone') : t('time zones')}
            </div>
            <div className="flex items-center justify-center gap-3 mt-3 text-sm">
              <span className="text-zinc-400">≈ <strong className="text-white">{days}</strong> {days === 1 ? t('day to adjust') : t('days to adjust')}</span>
              <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${sevColor[severity]}`}>{sevLabel[severity]}</span>
            </div>
          </>
        )}
      </div>

      {crossed > 0 && (
        <div className="px-5 py-5 border-t border-white/5 relative">
          <h2 className={panelHeading}>{t('Your plan')}</h2>
          <label className="flex items-center gap-3 text-sm text-zinc-400 mb-4">
            {t('Your usual bedtime')}
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="bg-zinc-800/60 text-zinc-100 border border-white/10 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ colorScheme: 'dark' }}
            />
          </label>

          <p className="text-sm text-zinc-300 mb-1">{t('Before you fly')}</p>
          <ol className="text-sm text-zinc-400 mb-4 space-y-1">
            {before.map((min, i) => (
              <li key={i} className="flex justify-between border-b border-white/5 py-1">
                <span>{before.length - i === 1 ? t('The night before') : `${before.length - i} ${t('nights before')}`}</span>
                <span className="font-mono text-zinc-200">{clock(min)}</span>
              </li>
            ))}
          </ol>

          <table className="w-full text-sm">
            <caption className="text-left text-sm text-zinc-300 mb-1">{t('After you land, with no change before the flight')}</caption>
            <thead>
              <tr className="text-left text-xs text-zinc-500 border-b border-white/10">
                <th scope="col" className="py-1.5 font-medium">{t('Day')}</th>
                <th scope="col" className="py-1.5 font-medium">{t('Body clock off by')}</th>
                <th scope="col" className="py-1.5 font-medium">{t('Sleepy around')}</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              {plan.map((row) => (
                <tr key={row.day} className="border-b border-white/5">
                  <td className="py-1.5">{row.day}</td>
                  <td className="py-1.5 font-mono">{row.gap === 0 ? t('Adjusted') : `${row.gap} h`}</td>
                  <td className="py-1.5 font-mono text-zinc-200">{clock(row.sleepy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-5 py-5 border-t border-white/5 relative">
        <h2 className={panelHeading}>{t('Tips to adjust faster')}</h2>
        <ul className="space-y-2">
          {tips.map((tip, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-zinc-400 leading-relaxed">
              <span className="text-blue-400 shrink-0">•</span><span>{tip}</span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-zinc-500 mt-4">{t('Averages, not a prediction. Recovery varies from person to person, and this is not medical advice.')}</p>
      </div>
    </div>
  );
};

const el = document.getElementById('jetlag-app');
if (el) {
  el.innerHTML = '';
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <JetLag />
    </React.StrictMode>
  );
}
