import React, { useEffect, useMemo, useState } from 'react';
import citiesData from '../cities.json';
import { t, isES } from './i18n';

// Shared embeddable-clock widget: the live Clock and the snippet builder (with a
// live preview). Used by the raw /embed endpoint and the /clock-widget landing.
// Self-contained inline styles so the Clock can be framed transparently anywhere.

type City = { slug: string; name: string; country: string; tz: string };
export const CITIES = citiesData as City[];
export const SITE = 'https://www.chronomap.top';
export const tzLabel = (tz: string) => tz.split('/').pop()!.replace(/_/g, ' ');
export const cityForTz = (tz: string) => CITIES.find((c) => c.tz === tz);

export const Clock: React.FC<{ tz: string; city: string; theme: 'dark' | 'light' }> = ({ tz, city, theme }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
  const date = new Intl.DateTimeFormat(isES ? 'es-ES' : 'en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(now);
  const dark = theme === 'dark';
  const slug = cityForTz(tz)?.slug;
  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        background: dark ? 'rgba(9,9,11,0.92)' : 'rgba(255,255,255,0.95)',
        color: dark ? '#fafafa' : '#18181b',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        borderRadius: 16,
        padding: '18px 22px',
        maxWidth: 320,
        boxShadow: dark ? '0 10px 40px rgba(0,0,0,0.4)' : '0 10px 40px rgba(0,0,0,0.12)',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3b82f6', marginBottom: 6 }}>{city}</div>
      <div style={{ fontSize: 40, fontWeight: 300, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>{time}</div>
      <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
        <span>{date}</span>
        <a href={`${SITE}${slug ? `/time/${slug}` : '/'}`} target="_blank" rel="noopener" style={{ color: '#3b82f6', textDecoration: 'none' }}>ChronoMap</a>
      </div>
    </div>
  );
};

export const SnippetBuilder: React.FC<{ tz: string; city: string; theme: 'dark' | 'light' }> = ({ tz: tz0, city: city0, theme: theme0 }) => {
  const [tz, setTz] = useState(tz0);
  const [theme, setTheme] = useState<'dark' | 'light'>(theme0);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const city = cityForTz(tz)?.name ?? city0;
  const results = useMemo(
    () => CITIES.filter((c) => query.trim() && c.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6),
    [query]
  );
  const src = `${SITE}/embed?tz=${encodeURIComponent(tz)}&city=${encodeURIComponent(city)}&theme=${theme}`;
  const code = `<iframe src="${src}" width="340" height="150" style="border:0;overflow:hidden" title="${city} time — ChronoMap" loading="lazy"></iframe>\n<a href="${SITE}">Live clock by ChronoMap</a>`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); } catch { window.prompt(t('Copy the embed code:'), code); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const input: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fafafa', padding: '8px 12px', fontSize: 14, width: '100%' };
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', fontFamily: "'Inter', system-ui, sans-serif", color: '#a1a1aa' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <Clock tz={tz} city={city} theme={theme} />
      </div>
      <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{t('Embed this clock on your site')}</h2>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Change city…')} aria-label={t('Change city')} style={input} />
        {results.length > 0 && (
          <div style={{ position: 'absolute', zIndex: 10, marginTop: 4, width: '100%', background: 'rgba(24,24,27,0.98)', border: '1px solid #27272a', borderRadius: 8, overflow: 'hidden' }}>
            {results.map((c) => (
              <button key={c.slug} onClick={() => { setTz(c.tz); setQuery(''); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 14, color: '#d4d4d8', background: 'none', border: 0, cursor: 'pointer' }}>
                {c.name} <span style={{ color: '#52525b' }}>· {c.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['dark', 'light'] as const).map((th) => (
          <button key={th} onClick={() => setTheme(th)} style={{ padding: '6px 14px', fontSize: 13, borderRadius: 8, cursor: 'pointer', textTransform: 'capitalize', border: `1px solid ${theme === th ? '#3b82f6' : 'rgba(255,255,255,0.12)'}`, background: theme === th ? 'rgba(59,130,246,0.15)' : 'transparent', color: theme === th ? '#fff' : '#a1a1aa' }}>{t(th)}</button>
        ))}
      </div>
      <textarea readOnly value={code} onFocus={(e) => e.currentTarget.select()} style={{ ...input, height: 90, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, resize: 'none' }} />
      <button onClick={copy} style={{ marginTop: 10, padding: '9px 18px', fontSize: 14, fontWeight: 500, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(59,130,246,0.3)', background: '#2563eb', color: '#fff' }}>
        {copied ? t('Copied!') : t('Copy embed code')}
      </button>
    </div>
  );
};
