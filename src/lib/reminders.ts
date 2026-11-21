// Quick reminders, stored in localStorage and fired by the open app.
export type Reminder = { id: string; at: number; label: string };

export const STORAGE_KEY = 'chronomap-reminders';

// Next time the clock shows "HH:MM" in local time: today, or tomorrow if that minute has passed.
export function nextOccurrence(hhmm: string, now: Date): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

export function loadReminders(): Reminder[] {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(list) ? list.filter((r) => typeof r?.at === 'number' && typeof r?.id === 'string') : [];
  } catch {
    return [];
  }
}

export function saveReminders(list: Reminder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
