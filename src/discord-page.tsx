import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';

// Standalone interactive island for /discord-timestamp-generator.
// The page's SEO content is static HTML; this only enhances the tool box.
// Inline styles keep it self-contained (no Tailwind) and CSP-safe.

interface FmtRow {
  code: string;
  label: string;
  preview: string;
}

function buildFormats(date: Date): FmtRow[] {
  return [
    { code: 't', label: 'Short Time', preview: format(date, 'p', { locale: enUS }) },
    { code: 'T', label: 'Long Time', preview: format(date, 'pp', { locale: enUS }) },
    { code: 'd', label: 'Short Date', preview: format(date, 'P', { locale: enUS }) },
    { code: 'D', label: 'Long Date', preview: format(date, 'PP', { locale: enUS }) },
    { code: 'f', label: 'Short Date/Time', preview: format(date, 'Pp', { locale: enUS }) },
    { code: 'F', label: 'Long Date/Time', preview: format(date, 'PPpp', { locale: enUS }) },
    { code: 'R', label: 'Relative', preview: formatDistanceToNow(date, { addSuffix: true, locale: enUS }) },
  ];
}

const DiscordTool: React.FC = () => {
  const [date, setDate] = useState<Date>(() => new Date());
  const [copied, setCopied] = useState<string | null>(null);

  const unix = Math.floor(date.getTime() / 1000);
  const formats = useMemo(() => buildFormats(date), [date]);
  const inputValue = format(date, "yyyy-MM-dd'T'HH:mm");

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = new Date(e.target.value);
    if (!Number.isNaN(next.getTime())) setDate(next);
  };

  const copy = (code: string) => {
    const str = `<t:${unix}:${code}>`;
    navigator.clipboard?.writeText(str);
    setCopied(code);
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 1800);
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, color: '#a1a1aa', marginBottom: 6, fontWeight: 600 }}>
        Date &amp; time
      </label>
      <input
        type="datetime-local"
        value={inputValue}
        onChange={onPick}
        style={{
          width: '100%', background: '#18181b', color: '#fafafa',
          border: '1px solid #3f3f46', borderRadius: 8, padding: '10px 12px',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 14, marginBottom: 4,
          colorScheme: 'dark',
        }}
      />
      <button
        onClick={() => setDate(new Date())}
        style={{
          background: 'transparent', color: '#60a5fa', border: 'none',
          cursor: 'pointer', fontSize: 13, padding: '4px 0', marginBottom: 12,
        }}
      >
        Reset to now
      </button>

      <div style={{ display: 'grid', gap: 8 }}>
        {formats.map((f) => (
          <button
            key={f.code}
            onClick={() => copy(f.code)}
            title="Copy code"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, textAlign: 'left', width: '100%', cursor: 'pointer',
              background: '#0f0f12', border: '1px solid #27272a', borderRadius: 10,
              padding: '10px 12px', color: '#e4e4e7',
            }}
          >
            <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</span>
              <span style={{ fontSize: 13, color: '#a1a1aa' }}>{f.preview}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <code
                style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                  color: '#93c5fd', background: '#18181b', border: '1px solid #27272a',
                  borderRadius: 5, padding: '2px 6px', whiteSpace: 'nowrap',
                }}
              >
                {`<t:${unix}:${f.code}>`}
              </code>
              <span
                style={{
                  fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                  color: copied === f.code ? '#34d399' : '#a1a1aa',
                }}
              >
                {copied === f.code ? 'Copied' : 'Copy'}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const el = document.getElementById('discord-app');
if (el) {
  el.innerHTML = '';
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <DiscordTool />
    </React.StrictMode>
  );
}
