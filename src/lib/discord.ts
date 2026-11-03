// Discord timestamp styles, as listed in Discord's official reference:
// https://docs.discord.com/developers/reference (Message Formatting > Timestamp Styles).

export const DEFAULT_STYLE = 'f';

export const STYLES = [
  { code: 't', label: 'Short Time' },
  { code: 'T', label: 'Medium Time' },
  { code: 'd', label: 'Short Date' },
  { code: 'D', label: 'Long Date' },
  { code: 'f', label: 'Long Date, Short Time' },
  { code: 'F', label: 'Full Date, Short Time' },
  { code: 's', label: 'Short Date, Short Time' },
  { code: 'S', label: 'Short Date, Medium Time' },
  { code: 'R', label: 'Relative Time' },
];

const NUMERIC_DATE: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
const OPTS: Record<string, Intl.DateTimeFormatOptions> = {
  t: { timeStyle: 'short' },
  T: { timeStyle: 'medium' },
  d: NUMERIC_DATE,
  D: { dateStyle: 'long' },
  f: { dateStyle: 'long', timeStyle: 'short' },
  F: { dateStyle: 'full', timeStyle: 'short' },
  s: { ...NUMERIC_DATE, hour: '2-digit', minute: '2-digit' },
  S: { ...NUMERIC_DATE, hour: '2-digit', minute: '2-digit', second: '2-digit' },
};

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1],
];

// Approximates how Discord renders a style. The real text follows each reader's Discord language.
export function preview(date: Date, code: string, locale?: string, timeZone?: string, now = new Date()): string {
  if (code !== 'R') return new Intl.DateTimeFormat(locale, { timeZone, ...OPTS[code] }).format(date);
  const diff = Math.round((date.getTime() - now.getTime()) / 1000);
  const [unit, size] = UNITS.find(([, s]) => Math.abs(diff) >= s) ?? UNITS[UNITS.length - 1];
  return new Intl.RelativeTimeFormat(locale, { numeric: 'always' }).format(Math.trunc(diff / size), unit);
}

// Reads a pasted "<t:1751600000:F>", "<t:1751600000>" or bare Unix time. Null if it is neither.
export function parseTimestamp(input: string): { date: Date; style: string } | null {
  const s = input.trim();
  const m = s.match(/^<t:(-?\d{1,16})(?::([tTdDfFsSR]))?>$/) ?? s.match(/^(-?\d{1,16})$/);
  if (!m) return null;
  const n = Number(m[1]);
  // 12+ digits cannot be seconds in practice (year 5138), so a bare value that long is milliseconds.
  const date = new Date(Math.abs(n) >= 1e11 ? n : n * 1000);
  return Number.isNaN(date.getTime()) ? null : { date, style: m[2] ?? DEFAULT_STYLE };
}
