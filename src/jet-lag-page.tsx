import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Sunrise, Sunset, ArrowRight } from 'lucide-react';
import { offsetMin } from './lib/tz';
import { CityPicker, CITIES, cityLabel, type Endpoint } from './lib/city-picker';
import { t } from './lib/i18n';
import './lib/analytics';
import './page.css';

// Jet-lag estimator for /jet-lag-calculator. Estimates time zones crossed,
// direction, rough recovery days and tips. Heuristic, clearly labelled.

const myTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

const JetLag: React.FC = () => {
  const [from, setFrom] = useState<Endpoint>({ name: cityLabel(myTz), tz: myTz });
  const [to, setTo] = useState<Endpoint>(() => {
    const other = CITIES.find((c) => c.tz !== myTz) ?? CITIES[0];
    return { name: other.name, tz: other.tz };
  });

  const now = new Date();
  const diffH = (offsetMin(now, to.tz) - offsetMin(now, from.tz)) / 60;
  const crossed = Math.round(Math.abs(diffH));
  const east = diffH > 0;
  // ponytail: rough heuristic — ~1 zone/day eastward (harder), ~1.5 zones/day west.
  const days = crossed === 0 ? 0 : east ? crossed : Math.max(1, Math.round(crossed * 0.67));
  const severity = crossed === 0 ? 'none' : crossed <= 2 ? 'mild' : crossed <= 5 ? 'moderate' : 'severe';

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
    : east
    ? [
        t('A few days before you fly, go to bed and wake up earlier.'),
        t('At your destination, get bright morning light and avoid it late in the evening.'),
        t('Consider melatonin in the early evening, local time.'),
      ]
    : [
        t('A few days before you fly, go to bed and wake up later.'),
        t('At your destination, get light in the late afternoon and evening.'),
        t('Stay awake until a normal local bedtime and avoid early-morning light.'),
      ];

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
              <span className="text-sm text-zinc-400">{east ? t('Traveling east') : t('Traveling west')}</span>
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

      <div className="px-5 py-5 border-t border-white/5 relative">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3">{t('Tips to adjust faster')}</h2>
        <ul className="space-y-2">
          {tips.map((tip, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-zinc-400 leading-relaxed">
              <span className="text-blue-400 shrink-0">•</span><span>{tip}</span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-zinc-600 mt-4">{t('This is a rough estimate; recovery varies from person to person.')}</p>
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
