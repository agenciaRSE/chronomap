import React, { useEffect, useRef, useState } from 'react';
import { Bell, BellRing, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { t } from '../src/lib/i18n';
import { Reminder, loadReminders, saveReminders, nextOccurrence } from '../src/lib/reminders';

const PRESETS = [5, 10, 15, 30, 60];

// Three short beeps. The AudioContext is created on a click, so browsers allow it to play later.
function beep(ctx: AudioContext | null) {
  if (!ctx) return;
  ctx.resume().catch(() => {});
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + i * 0.35;
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.26);
  }
}

function notify(r: Reminder) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const title = r.label || t('ChronoMap reminder');
  const options: NotificationOptions = {
    body: `${format(r.at, 'HH:mm')} · ChronoMap`,
    icon: '/icons/icon-192.png',
    tag: r.id,
    requireInteraction: true,
  };
  // The service worker route also works in the Android app, where `new Notification` throws.
  const viaSW = navigator.serviceWorker?.getRegistration().then((reg) => reg?.showNotification(title, options) ?? Promise.reject());
  (viaSW ?? Promise.reject()).catch(() => {
    try { new Notification(title, options); } catch { /* in-app banner still shows */ }
  });
}

export const Reminders: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Reminder[]>(loadReminders);
  const [ringing, setRinging] = useState<Reminder[]>([]);
  const [label, setLabel] = useState('');
  const [time, setTime] = useState('');
  const [perm, setPerm] = useState(() => ('Notification' in window ? Notification.permission : 'denied'));
  const audio = useRef<AudioContext | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const listRef = useRef(list);
  // Every change goes through the ref first, so the 1 s tick never works on a stale list.
  const commit = (next: Reminder[]) => { listRef.current = next; setList(next); saveReminders(next); };

  // Fire due reminders. Ones that came due while the app was closed fire on the next load.
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const due = listRef.current.filter((r) => r.at <= now);
      if (!due.length) return;
      commit(listRef.current.filter((r) => r.at > now));
      due.forEach(notify);
      beep(audio.current);
      setRinging((rg) => [...rg, ...due]);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Keep other tabs in sync.
  useEffect(() => {
    const onStorage = () => commit(loadReminders());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const add = (at: Date) => {
    if (!audio.current && 'AudioContext' in window) audio.current = new AudioContext();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(setPerm).catch(() => {});
    }
    const r = { id: crypto.randomUUID(), at: at.getTime(), label: label.trim().slice(0, 80) };
    commit([...listRef.current, r].sort((a, b) => a.at - b.at));
    setLabel('');
    setTime('');
  };

  const btn = 'px-2.5 py-2 text-xs font-medium rounded-md border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title={t('Reminders')}
        aria-label={t('Reminders')}
        aria-expanded={open}
        className="relative flex items-center justify-center p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-md transition-all"
      >
        <Bell className="w-3 h-3" />
        {list.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-[9px] font-bold text-white flex items-center justify-center">
            {list.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl p-3 z-50 text-left">
          <div className="text-sm font-bold text-white mb-2">{t('Reminders')}</div>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={80}
            placeholder={t('What to remind you (optional)')}
            aria-label={t('Reminder text')}
            className="w-full mb-3 px-2.5 py-2 text-sm rounded-md bg-black border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
          />
          <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1.5">{t('In')}</div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESETS.map((m) => (
              <button key={m} onClick={() => add(new Date(Date.now() + m * 60000))} className={btn}>
                {m < 60 ? `${m} min` : '1 h'}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (time) add(nextOccurrence(time, new Date())); }}
            className="flex items-end gap-2 mb-3"
          >
            <label className="flex-1">
              <span className="block text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1.5">{t('At (your local time)')}</span>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm rounded-md bg-black border border-zinc-700 text-white [color-scheme:dark] focus:outline-none focus:border-blue-500"
              />
            </label>
            <button type="submit" className="px-3 py-2 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors">
              {t('Set alarm')}
            </button>
          </form>

          {perm === 'denied' && (
            <p className="text-[11px] text-amber-400 mb-2">{t('Notifications are blocked: the alarm will only sound and show here.')}</p>
          )}
          <p className="text-[11px] text-zinc-500 mb-2">{t('Keep ChronoMap open (a background tab is fine) for alarms to go off.')}</p>

          {list.length > 0 && (
            <ul className="border-t border-zinc-800 pt-2 space-y-1 max-h-48 overflow-y-auto">
              {list.map((r) => (
                <li key={r.id} className="flex items-center gap-2 text-sm">
                  <span className="font-mono tabular-nums text-white">{format(r.at, 'HH:mm')}</span>
                  {new Date(r.at).toDateString() !== new Date().toDateString() && (
                    <span className="text-[10px] text-zinc-500">{t('tomorrow')}</span>
                  )}
                  <span className="flex-1 truncate text-zinc-400">{r.label}</span>
                  <button
                    onClick={() => commit(listRef.current.filter((x) => x.id !== r.id))}
                    aria-label={t('Delete reminder')}
                    className="p-1.5 text-zinc-500 hover:text-red-400 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {ringing.length > 0 && (
        <div role="alert" className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[min(22rem,calc(100vw-2rem))] space-y-2">
          {ringing.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 text-white shadow-2xl">
              <BellRing className="w-5 h-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{r.label || t('ChronoMap reminder')}</div>
                <div className="text-xs opacity-80 font-mono">{format(r.at, 'HH:mm')}</div>
              </div>
              <button
                onClick={() => setRinging((rg) => rg.filter((x) => x.id !== r.id))}
                aria-label={t('Dismiss')}
                className="p-2 rounded-md hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
