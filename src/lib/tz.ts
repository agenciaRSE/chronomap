// Shared IANA-timezone helpers (Intl only, no tz lib). Used by the comparator
// and meeting-planner islands; covered by test/tz.test.ts.

export function part(d: Date, tz: string, opts: Intl.DateTimeFormatOptions, type: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts }).formatToParts(d).find((p) => p.type === type)?.value ?? '';
}

export function fmt(d: Date, tz: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts }).format(d);
}

// Minutes east of UTC for `tz` at instant `d` (handles DST + half-hour offsets).
export function offsetMin(d: Date, tz: string): number {
  const s = part(d, tz, { timeZoneName: 'shortOffset' }, 'timeZoneName'); // GMT+9, GMT, GMT-3:30
  const m = s.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] || 0)) : 0;
}

// HH:mm (24h) of an instant in a zone — the value shape an <input type="time"> wants.
export const hm24 = (d: Date, tz: string): string =>
  new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);

// Calendar Y/M/D (mo is 1-based) of an instant as seen in a zone.
export function ymdInTz(d: Date, tz: string): { y: number; mo: number; d: number } {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return { y: g('year'), mo: g('month'), d: g('day') };
}

// Local hour 0-23 of an instant in a zone.
export const hourInTz = (d: Date, tz: string): number =>
  Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }).format(d)) % 24;

// "3:05 PM" style local time in a zone.
export const timeLabel = (d: Date, tz: string): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(d);

// "Mon, Jul 6" style local date in a zone.
export const dayLabel = (d: Date, tz: string): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(d);

// Resolve a wall-clock time in `tz` (mo is 1-based) to a real UTC instant.
// Single-pass; the once-a-year ambiguous DST-transition hour (~02:00) may be off
// by 1h — acceptable without a full tz database on the client.
export function wallToUtc(y: number, mo: number, d: number, hh: number, mm: number, tz: string): Date {
  const asUTC = Date.UTC(y, mo - 1, d, hh, mm);
  return new Date(asUTC - offsetMin(new Date(asUTC), tz) * 60000);
}
