// Calendar links for a moment in time. No dependency, no new CSP host:
// Google Calendar is a plain https navigation; the .ics is a data: URI download.

const pad = (n: number) => String(n).padStart(2, '0');

// UTC basic ISO stamp required by both Google (dates=) and iCalendar: YYYYMMDDTHHMMSSZ
export function icsStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

export function googleCalUrl(title: string, startUTC: Date, minutes: number, details = ''): string {
  const end = new Date(startUTC.getTime() + minutes * 60000);
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${icsStamp(startUTC)}/${icsStamp(end)}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

// A data: URI holding a VEVENT — used with <a download> so no Blob/CSP concerns.
export function icsDataUrl(title: string, startUTC: Date, minutes: number, details = ''): string {
  const end = new Date(startUTC.getTime() + minutes * 60000);
  const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ChronoMap//Meeting//EN',
    'BEGIN:VEVENT',
    `UID:${icsStamp(startUTC)}-chronomap@chronomap.top`,
    `DTSTAMP:${icsStamp(startUTC)}`,
    `DTSTART:${icsStamp(startUTC)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${esc(title)}`,
    details ? `DESCRIPTION:${esc(details)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join('\r\n'))}`;
}
