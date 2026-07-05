import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import citiesData from './cities.json';

// Embeddable live-clock widget for /embed?tz=…&city=…&theme=…
// Self-contained inline styles (no page.css → no Tailwind, no full-page backdrop,
// transparent so it blends into the host site). When opened directly (not framed)
// it also shows an embed-code generator.

type City = { slug: string; name: string; country: string; tz: string };
const CITIES = citiesData as City[];
const SITE = 'https://www.chronomap.top';

const params = new URLSearchParams(location.search);
const framed = window.self !== window.top;
const myTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

const tzLabel = (tz: string) => tz.split('/').pop()!.replace(/_/g, ' ');
const cityForTz = (tz: string) => CITIES.find((c) => c.tz === tz);

const Clock: React.FC<{ tz: string; city: string; theme: 'dark' | 'light' }> = ({ tz, city, theme }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
  const date = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(now);
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

const SnippetBuilder: React.FC<{ tz: string; city: string; theme: 'dark' | 'light' }> = ({ tz: tz0, city: city0, theme: theme0 }) => {
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
    try { await navigator.clipboard.writeText(code); } catch { window.prompt('Copy the embed code:', code); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const input: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fafafa', padding: '8px 12px', fontSize: 14, width: '100%' };
  return (
    <div style={{ maxWidth: 520, margin: '32px auto 0', fontFamily: "'Inter', system-ui, sans-serif", color: '#a1a1aa' }}>
      <h2 style={{ color: '#fafafa', fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Embed this clock on your site</h2>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Change city…" aria-label="Change city" style={input} />
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
        {(['dark', 'light'] as const).map((t) => (
          <button key={t} onClick={() => setTheme(t)} style={{ padding: '6px 14px', fontSize: 13, borderRadius: 8, cursor: 'pointer', textTransform: 'capitalize', border: `1px solid ${theme === t ? '#3b82f6' : 'rgba(255,255,255,0.12)'}`, background: theme === t ? 'rgba(59,130,246,0.15)' : 'transparent', color: theme === t ? '#fff' : '#a1a1aa' }}>{t}</button>
        ))}
      </div>
      <textarea readOnly value={code} onFocus={(e) => e.currentTarget.select()} style={{ ...input, height: 90, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, resize: 'none' }} />
      <button onClick={copy} style={{ marginTop: 10, padding: '9px 18px', fontSize: 14, fontWeight: 500, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(59,130,246,0.3)', background: '#2563eb', color: '#fff' }}>
        {copied ? 'Copied!' : 'Copy embed code'}
      </button>
    </div>
  );
};

const tz0 = params.get('tz') || myTz;
const city0 = params.get('city') || cityForTz(tz0)?.name || tzLabel(tz0);
const theme0: 'dark' | 'light' = params.get('theme') === 'light' ? 'light' : 'dark';

const el = document.getElementById('embed-app');
if (el) {
  // Standalone view (not framed) needs the app's dark background so the snippet
  // builder is readable; framed stays transparent to blend into the host site.
  if (!framed) {
    document.documentElement.style.backgroundColor = '#09090b';
    document.body.style.backgroundColor = '#09090b';
    document.body.style.minHeight = '100vh';
    el.style.paddingTop = '48px';
  }
  el.innerHTML = '';
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Clock tz={tz0} city={city0} theme={theme0} />
      </div>
      {!framed && <SnippetBuilder tz={tz0} city={city0} theme={theme0} />}
    </React.StrictMode>
  );
}
