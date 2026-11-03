// Generates static, crawlable pages from src/cities.json and src/zones.json:
//   - one per city:       time/{slug}.html      (/time/{slug})
//   - zone conversions:   time/{a}-to-{b}.html  (/time/{a}-to-{b}), only ZONE_KEEP
// Only INDEXED_CITIES and ZONE_KEEP are offered to search engines. The rest of the
// cities stay available to visitors with noindex; every other {a}-to-{b} URL
// redirects to /time-zone-converter (vercel.json, kept in sync by test/redirects.test.ts).
// Also writes public/sitemap.xml and returns the Vite MPA entry list. Called
// from vite.config (runs at the start of every build) and runnable directly
// (`node scripts/gen-city-pages.mjs`). Live clocks are React islands
// (city-page.tsx / compare-page.tsx) that read the ct-* meta tags.
import { readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';

const root = new URL('..', import.meta.url);
const SITE = 'https://www.chronomap.top';

// Pages worth indexing. Chosen from Search Console history (2026-11 audit) and global
// demand. Only add a page here once its content is worth more than the template.
export const INDEXED_CITIES = ["london", "new-york", "tokyo", "los-angeles", "paris", "dubai", "sydney", "singapore", "hong-kong", "chicago", "shanghai", "mumbai", "new-delhi", "toronto", "berlin", "madrid", "moscow", "istanbul", "sao-paulo", "seoul", "auckland", "san-francisco", "mexico-city", "buenos-aires", "bangkok", "cairo", "johannesburg", "lagos", "jakarta", "manila", "kigali", "luanda", "muscat", "cologne", "nairobi", "addis-ababa", "caracas", "ho-chi-minh-city", "hyderabad", "honolulu"];
export const ZONE_KEEP = ["est-to-sgt", "gmt-to-sgt", "bst-to-sgt", "cet-to-ist", "aest-to-sgt", "cet-to-sgt", "est-to-bst", "gmt-to-pst", "cet-to-est", "ist-to-bst"];

// Sitemap lastmod: the date the page's content really changed. Never use the build
// date: Google stops trusting lastmod if it moves on every deploy. Bump by hand when
// the copy changes, including the template dates below for generated pages.
const CITY_UPDATED = '2026-11-03';
const ZONE_UPDATED = '2026-11-03';
const HUB_UPDATED = '2026-11-03';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tzLabelOf = (tz) => tz.split('/').pop().replace(/_/g, ' ');
const filePath = (rel) => fileURLToPath(new URL(rel, root));

// BreadcrumbList JSON-LD from [{name, path}] crumbs (path relative to SITE).
const breadcrumb = (crumbs) => `<script type="application/ld+json">
      ${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          item: `${SITE}${c.path}`,
        })),
      })}
    </script>`;

const LOGO = `<a href="/" class="inline-flex items-center gap-3 mb-8 group shrink-0">
      <span class="relative w-8 h-8 flex items-center justify-center shrink-0">
        <span class="absolute inset-0 rounded-full border-[1.5px] border-zinc-700/50 animate-[spin_12s_linear_infinite]"></span>
        <span class="absolute inset-1 rounded-full border-[1.5px] border-blue-500/80 border-t-transparent animate-[spin_8s_linear_infinite_reverse]"></span>
        <span class="w-2 h-2 rounded-full bg-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.9)]"></span>
      </span>
      <span class="text-[20px] font-semibold tracking-tight text-white group-hover:text-blue-400 transition-colors">ChronoMap</span>
    </a>`;

const HEAD_FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;700&display=swap" rel="stylesheet">`;

// Sticky top nav for the static interior pages — real crawlable internal links on
// every page (helps SEO + navigation). `alt` is the other-language twin URL (or '').
const HEADER_LOGO = `<span class="relative w-6 h-6 flex items-center justify-center shrink-0">
          <span class="absolute inset-0 rounded-full border-[1.5px] border-zinc-700/50 animate-[spin_12s_linear_infinite]"></span>
          <span class="absolute inset-1 rounded-full border-[1.5px] border-blue-500/80 border-t-transparent animate-[spin_8s_linear_infinite_reverse]"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.9)]"></span>
        </span>`;
function headerEn(alt) {
  return `<header class="sticky top-0 z-40 w-full border-b border-white/5 bg-[#09090b]/85 backdrop-blur-md">
      <nav class="max-w-5xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 h-14">
        <a href="/" class="inline-flex items-center gap-2 group shrink-0" aria-label="ChronoMap home">${HEADER_LOGO}
          <span class="text-[15px] font-semibold tracking-tight text-white group-hover:text-blue-400 transition-colors">ChronoMap</span>
        </a>
        <div class="flex items-center gap-x-4 sm:gap-x-5 text-[13px] text-zinc-400">
          <a href="/time-zone-map" class="hover:text-white transition-colors whitespace-nowrap">Time zones</a>
          <a href="/time-zone-converter" class="hover:text-white transition-colors whitespace-nowrap hidden sm:inline">Converter</a>
          <a href="/meeting-planner" class="hover:text-white transition-colors whitespace-nowrap hidden sm:inline">Planner</a>
          <a href="/flight-time-calculator" class="hover:text-white transition-colors whitespace-nowrap hidden md:inline">Flight time</a>
          <a href="/jet-lag-calculator" class="hover:text-white transition-colors whitespace-nowrap hidden lg:inline">Jet lag</a>
          <a href="/flight-route-map" class="hover:text-white transition-colors whitespace-nowrap hidden lg:inline">Route</a>
          ${alt ? `<a href="${alt}" hreflang="es" class="text-zinc-500 hover:text-white transition-colors border-l border-white/10 pl-4">ES</a>` : ''}
        </div>
      </nav>
    </header>`;
}
function headerEs(alt) {
  return `<header class="sticky top-0 z-40 w-full border-b border-white/5 bg-[#09090b]/85 backdrop-blur-md">
      <nav class="max-w-5xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 h-14">
        <a href="/es" class="inline-flex items-center gap-2 group shrink-0" aria-label="Inicio de ChronoMap">${HEADER_LOGO}
          <span class="text-[15px] font-semibold tracking-tight text-white group-hover:text-blue-400 transition-colors">ChronoMap</span>
        </a>
        <div class="flex items-center gap-x-4 sm:gap-x-5 text-[13px] text-zinc-400">
          <a href="/es/time-zone-map" class="hover:text-white transition-colors whitespace-nowrap">Husos horarios</a>
          <a href="/es/time-zone-converter" class="hover:text-white transition-colors whitespace-nowrap hidden sm:inline">Conversor</a>
          <a href="/es/meeting-planner" class="hover:text-white transition-colors whitespace-nowrap hidden sm:inline">Planificador</a>
          <a href="/es/flight-time-calculator" class="hover:text-white transition-colors whitespace-nowrap hidden md:inline">Vuelos</a>
          <a href="/es/jet-lag-calculator" class="hover:text-white transition-colors whitespace-nowrap hidden lg:inline">Jet lag</a>
          <a href="/es/flight-route-map" class="hover:text-white transition-colors whitespace-nowrap hidden lg:inline">Ruta</a>
          ${alt ? `<a href="${alt}" hreflang="en" class="text-zinc-500 hover:text-white transition-colors border-l border-white/10 pl-4">EN</a>` : ''}
        </div>
      </nav>
    </header>`;
}

const FOOTER = `<footer class="w-full text-center mt-2 reveal">
        <div class="flex flex-col items-center gap-5">
          <a href="/" class="inline-flex items-center gap-2 group">
            <span class="relative w-6 h-6 flex items-center justify-center shrink-0">
              <span class="absolute inset-0 rounded-full border border-zinc-700"></span>
              <span class="absolute inset-0.5 rounded-full border border-blue-500/60 border-t-transparent"></span>
              <span class="w-1 h-1 rounded-full bg-white/50"></span>
            </span>
            <span class="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">ChronoMap</span>
          </a>
          <nav class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-zinc-500">
            <a href="/" class="hover:text-zinc-300 transition-colors">World clock map</a>
            <a href="/time" class="hover:text-zinc-300 transition-colors">Cities</a>
            <a href="/time-zone-map" class="hover:text-zinc-300 transition-colors">Time zone map</a>
            <a href="/meeting-planner" class="hover:text-zinc-300 transition-colors">Meeting planner</a>
            <a href="/flight-time-calculator" class="hover:text-zinc-300 transition-colors">Flight time</a>
            <a href="/flight-route-map" class="hover:text-zinc-300 transition-colors">Flight route</a>
            <a href="/jet-lag-calculator" class="hover:text-zinc-300 transition-colors">Jet lag</a>
            <a href="/discord-timestamp-generator" class="hover:text-zinc-300 transition-colors">Discord timestamps</a>
            <a href="/clock-widget" class="hover:text-zinc-300 transition-colors">Clock widget</a>
            <a href="/windows" class="hover:text-zinc-300 transition-colors">Windows app</a>
            <a href="/time-zone-converter" class="hover:text-zinc-300 transition-colors">Time zone converter</a>
            <a href="/about" class="hover:text-zinc-300 transition-colors">About</a>
            <a href="/privacy" class="hover:text-zinc-300 transition-colors">Privacy</a>
          </nav>
        </div>
      </footer>`;

// DST transition detection, baked at build time (Node has full ICU). We scan each
// day's LOCAL-noon offset (anchoring to local noon, not UTC, keeps the reported
// date correct even in UTC+13/14 zones) and report the next change. Refreshes on
// every deploy since the generator reruns.
const DST_NOW = new Date();
function offsetMinutes(date, tz) {
  const s = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
    .formatToParts(date).find((p) => p.type === 'timeZoneName')?.value ?? '';
  const m = s.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] || 0)) : 0;
}
function nextTransition(tz) {
  const Y = DST_NOW.getUTCFullYear(), Mo = DST_NOW.getUTCMonth(), D = DST_NOW.getUTCDate();
  // Real UTC instant of ~noon local on day D+i (transitions happen ~02:00, so noon
  // is unambiguous and always lands on the correct local calendar day).
  const localNoon = (i) => {
    const wall = Date.UTC(Y, Mo, D + i, 12, 0, 0);
    const off = offsetMinutes(new Date(wall), tz);
    return { instant: new Date(wall - off * 60000), off };
  };
  let prev = localNoon(0).off;
  for (let i = 1; i <= 400; i++) {
    const { instant, off } = localNoon(i);
    if (off !== prev) return { date: instant, forward: off > prev };
    prev = off;
  }
  return null;
}
// Plain-text sentence (no quotes → safe in both JSON-LD and HTML). `name` arrives escaped.
function dstSentence(name, tz) {
  const t = nextTransition(tz);
  if (!t) return `${name} does not currently observe daylight saving time, so its UTC offset stays the same all year round.`;
  const date = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(t.date);
  return t.forward
    ? `${name} observes daylight saving time. The clocks next go forward one hour (DST begins) on ${date}.`
    : `${name} observes daylight saving time. The clocks next go back one hour (DST ends) on ${date}.`;
}

// Spanish name + country for the top cities that get an /es/time/{slug} page.
const ES_CITY = {
  'london': { name: 'Londres', country: 'Reino Unido' },
  'new-york': { name: 'Nueva York', country: 'Estados Unidos' },
  'tokyo': { name: 'Tokio', country: 'Japón' },
  'los-angeles': { name: 'Los Ángeles', country: 'Estados Unidos' },
  'paris': { name: 'París', country: 'Francia' },
  'dubai': { name: 'Dubái', country: 'Emiratos Árabes Unidos' },
  'sydney': { name: 'Sídney', country: 'Australia' },
  'singapore': { name: 'Singapur', country: 'Singapur' },
  'hong-kong': { name: 'Hong Kong', country: 'China' },
  'chicago': { name: 'Chicago', country: 'Estados Unidos' },
  'shanghai': { name: 'Shanghái', country: 'China' },
  'mumbai': { name: 'Bombay', country: 'India' },
  'new-delhi': { name: 'Nueva Delhi', country: 'India' },
  'toronto': { name: 'Toronto', country: 'Canadá' },
  'berlin': { name: 'Berlín', country: 'Alemania' },
  'madrid': { name: 'Madrid', country: 'España' },
  'moscow': { name: 'Moscú', country: 'Rusia' },
  'istanbul': { name: 'Estambul', country: 'Turquía' },
  'sao-paulo': { name: 'São Paulo', country: 'Brasil' },
  'seoul': { name: 'Seúl', country: 'Corea del Sur' },
  'auckland': { name: 'Auckland', country: 'Nueva Zelanda' },
  'san-francisco': { name: 'San Francisco', country: 'Estados Unidos' },
  'seattle': { name: 'Seattle', country: 'Estados Unidos' },
  'boston': { name: 'Boston', country: 'Estados Unidos' },
  'washington': { name: 'Washington D. C.', country: 'Estados Unidos' },
  'miami': { name: 'Miami', country: 'Estados Unidos' },
  'atlanta': { name: 'Atlanta', country: 'Estados Unidos' },
  'houston': { name: 'Houston', country: 'Estados Unidos' },
  'dallas': { name: 'Dallas', country: 'Estados Unidos' },
  'denver': { name: 'Denver', country: 'Estados Unidos' },
};

function dstSentenceEs(name, tz) {
  const t = nextTransition(tz);
  if (!t) return `${name} no observa actualmente el horario de verano, así que su offset respecto a UTC se mantiene igual todo el año.`;
  const date = new Intl.DateTimeFormat('es-ES', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(t.date);
  return t.forward
    ? `${name} observa el horario de verano. Los relojes se adelantan una hora (empieza el horario de verano) el ${date}.`
    : `${name} observa el horario de verano. Los relojes se atrasan una hora (termina el horario de verano) el ${date}.`;
}

const LOGO_ES = LOGO.replace('href="/"', 'href="/es"');

// ---- City enrichment: quick facts, best time to call, nearby cities ----
// src/city-data.json: slug → [lat, lng, metro population in millions]. Cities
// missing there (or countries missing a calling code) just skip that piece.
const CITY_DATA = JSON.parse(readFileSync(filePath('src/city-data.json'), 'utf8'));
// Facts about each indexed city's clock, checked against tzdata in test/content.test.ts.
const CITY_NOTES = JSON.parse(readFileSync(filePath('src/city-notes.json'), 'utf8'));

const CALLING = {
  'United Kingdom': '+44', 'United States': '+1', 'Japan': '+81', 'France': '+33',
  'United Arab Emirates': '+971', 'Australia': '+61', 'Singapore': '+65', 'Hong Kong': '+852',
  'China': '+86', 'India': '+91', 'Canada': '+1', 'Germany': '+49', 'Spain': '+34',
  'Russia': '+7', 'Turkey': '+90', 'Brazil': '+55', 'South Korea': '+82', 'New Zealand': '+64',
  'Mexico': '+52', 'Colombia': '+57', 'Peru': '+51', 'Chile': '+56', 'Argentina': '+54',
  'Venezuela': '+58', 'Panama': '+507', 'Cuba': '+53', 'Uruguay': '+598', 'Italy': '+39',
  'Netherlands': '+31', 'Austria': '+43', 'Switzerland': '+41', 'Belgium': '+32',
  'Portugal': '+351', 'Ireland': '+353', 'Sweden': '+46', 'Norway': '+47', 'Denmark': '+45',
  'Finland': '+358', 'Poland': '+48', 'Czechia': '+420', 'Hungary': '+36', 'Greece': '+30',
  'Romania': '+40', 'Ukraine': '+380', 'Iceland': '+354', 'Egypt': '+20', 'Nigeria': '+234',
  'Kenya': '+254', 'South Africa': '+27', 'Morocco': '+212', 'Ghana': '+233', 'Ethiopia': '+251',
  'Saudi Arabia': '+966', 'Qatar': '+974', 'Kuwait': '+965', 'Iran': '+98', 'Iraq': '+964',
  'Israel': '+972', 'Lebanon': '+961', 'Jordan': '+962', 'Pakistan': '+92', 'Bangladesh': '+880',
  'Thailand': '+66', 'Indonesia': '+62', 'Philippines': '+63', 'Vietnam': '+84', 'Malaysia': '+60',
  'Taiwan': '+886', 'Fiji': '+679', 'Guatemala': '+502', 'Costa Rica': '+506',
  'Dominican Republic': '+1', 'Puerto Rico': '+1', 'Jamaica': '+1', 'Ecuador': '+593',
  'Bolivia': '+591', 'Paraguay': '+595', 'Bulgaria': '+359', 'Serbia': '+381', 'Croatia': '+385',
  'Slovakia': '+421', 'Slovenia': '+386', 'Lithuania': '+370', 'Latvia': '+371', 'Estonia': '+372',
  'Belarus': '+375', 'Luxembourg': '+352', 'Oman': '+968', 'Bahrain': '+973', 'Azerbaijan': '+994',
  'Georgia': '+995', 'Armenia': '+374', 'Tunisia': '+216', 'Algeria': '+213', 'Sudan': '+249',
  'Tanzania': '+255', 'Uganda': '+256', 'Rwanda': '+250', 'Senegal': '+221', 'Ivory Coast': '+225',
  'DR Congo': '+243', 'Angola': '+244', 'Zimbabwe': '+263', 'Mozambique': '+258',
  'Sri Lanka': '+94', 'Nepal': '+977', 'Myanmar': '+95', 'Cambodia': '+855',
};

const offLabel = (min) => {
  const sign = min < 0 ? '−' : '+';
  const a = Math.abs(min);
  return `UTC${sign}${Math.floor(a / 60)}${a % 60 ? ':' + String(a % 60).padStart(2, '0') : ''}`;
};

// January vs July offsets — a season-proof, static way to state the UTC offset.
function seasonalOffsets(tz) {
  const y = DST_NOW.getUTCFullYear();
  return {
    jan: offsetMinutes(new Date(Date.UTC(y, 0, 15)), tz),
    jul: offsetMinutes(new Date(Date.UTC(y, 6, 15)), tz),
  };
}
const offsetFacts = (tz, esLang) => {
  const { jan, jul } = seasonalOffsets(tz);
  if (jan === jul) return esLang ? `${offLabel(jan)} todo el año` : `${offLabel(jan)} all year`;
  return esLang ? `${offLabel(jan)} (enero) / ${offLabel(jul)} (julio)` : `${offLabel(jan)} (January) / ${offLabel(jul)} (July)`;
};

// Direct answers for the city copy, so zones without DST never read as if they had it.
const observesDst = (tz) => nextTransition(tz) !== null;
function dstAnswer(name, tz, esLang) {
  const { jan, jul } = seasonalOffsets(tz);
  if (!observesDst(tz)) return esLang ? `No. ${name} se mantiene en ${offLabel(jan)} todo el año.` : `No. ${name} stays on ${offLabel(jan)} all year.`;
  return esLang ? `Sí. ${name} alterna entre ${offLabel(jan)} y ${offLabel(jul)} a lo largo del año.` : `Yes. ${name} moves between ${offLabel(jan)} and ${offLabel(jul)} during the year.`;
}
function offsetSentence(tz, esLang) {
  const { jan } = seasonalOffsets(tz);
  if (!observesDst(tz)) return esLang ? `Se mantiene en ${offLabel(jan)} todo el año, así que su diferencia con el Tiempo Universal Coordinado (UTC) no cambia.` : `It stays on ${offLabel(jan)} all year, so its difference from Coordinated Universal Time (UTC) never changes.`;
  return esLang ? `Su offset respecto al Tiempo Universal Coordinado (UTC) cambia cuando empieza o termina el horario de verano, así que el reloj en vivo de arriba siempre muestra la hora local real.` : `Its offset from Coordinated Universal Time (UTC) changes when daylight saving time starts or ends, so the live clock above always shows the real local time.`;
}

// Minutes-of-day → "9:30 AM" (handles half-hour zones; wraps past midnight).
const fmtMin = (m) => {
  m = ((m % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60), mm = m % 60;
  const ap = h < 12 ? 'AM' : 'PM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(mm).padStart(2, '0')} ${ap}`;
};

// Largest overlap between the city-local window [s, s+480] (ref 9-17 mapped into
// city time) and local business hours 9:00-17:00. Split when it wraps midnight.
function businessOverlap(s) {
  const a = ((s % 1440) + 1440) % 1440, b = a + 480;
  const segs = b <= 1440 ? [[a, b]] : [[a, 1440], [0, b - 1440]];
  let best = null;
  for (const [x, y] of segs) {
    const lo = Math.max(x, 540), hi = Math.min(y, 1020);
    if (hi - lo >= 60 && (!best || hi - lo > best[1] - best[0])) best = [lo, hi];
  }
  return best;
}

// Static "best time to call" facts vs a reference city. Offsets are taken at
// build time; they drift at most 1h between deploys around DST switches, and
// the live clocks on the page always show the exact current times.
function callInfo(name, tz, refName, refTz, esLang) {
  const d = offsetMinutes(DST_NOW, tz) - offsetMinutes(DST_NOW, refTz);
  const s = 9 * 60 + d;
  const window = `${fmtMin(s)}–${fmtMin(s + 480)}`;
  const ov = businessOverlap(s);
  if (esLang) {
    const sentence = `Cuando en ${refName} son las 9:00 AM–5:00 PM, en ${name} son las ${window}.`;
    const rec = ov
      ? `La mejor franja para llamadas de trabajo es aproximadamente ${fmtMin(ov[0])}–${fmtMin(ov[1])}, hora de ${name}.`
      : `Apenas hay solapamiento en horario laboral: apunta a primera hora de la mañana o última de la tarde.`;
    return { sentence, rec };
  }
  const sentence = `When it's 9:00 AM–5:00 PM in ${refName}, it's ${window} in ${name}.`;
  const rec = ov
    ? `The best window for business calls is roughly ${fmtMin(ov[0])}–${fmtMin(ov[1])} ${name} time.`
    : `There is little or no business-hours overlap — aim for early morning or late evening instead.`;
  return { sentence, rec };
}

const havKm = ([la1, lo1], [la2, lo2]) => {
  const r = Math.PI / 180;
  const x = Math.sin(((la2 - la1) * r) / 2) ** 2 +
    Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(((lo2 - lo1) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
};

// Enrichment HTML for a city page. x = { d: [lat,lng,popM]|undefined, call,
// nearby: [{o, km}] }. Returns static sections + an extra best-time-to-call FAQ
// (HTML + JSON-LD fragment) + lat/lng meta tags for the island's sun times.
function cityEnrichment(c, x, esLang) {
  const name = esc(esLang ? x.esName : c.name);
  const country = esc(esLang ? x.esCountry : c.country);
  const L = esLang
    ? { facts: `Datos rápidos de ${name}`, country: 'País', tz: 'Zona horaria', off: 'Offset UTC', code: 'Prefijo telefónico', pop: 'Población (área metro, aprox.)', coords: 'Coordenadas', call: `Mejor hora para llamar a ${name}`, near: `Ciudades cerca de ${name}`, faqQ: (ref) => `¿Cuál es la mejor hora para llamar a ${name} desde ${ref}?` }
    : { facts: `${name} quick facts`, country: 'Country', tz: 'Time zone', off: 'UTC offset', code: 'Calling code', pop: 'Population (metro area, approx.)', coords: 'Coordinates', call: `Best time to call ${name}`, near: `Cities near ${name}`, faqQ: (ref) => `What is the best time to call ${name} from ${ref}?` };

  const metas = x.d ? `\n    <meta name="ct-lat" content="${x.d[0]}" />\n    <meta name="ct-lng" content="${x.d[1]}" />` : '';

  const row = (dt, dd) => `<div class="flex justify-between gap-4 border-b border-white/5 pb-2"><dt class="text-zinc-500">${dt}</dt><dd class="text-zinc-200 text-right">${dd}</dd></div>`;
  const rows = [
    row(L.country, country),
    row(L.tz, esc(c.tz)),
    row(L.off, offsetFacts(c.tz, esLang)),
    x.call ? row(L.code, x.call) : '',
    x.d ? row(L.pop, `≈ ${x.d[2]} ${esLang ? 'millones' : 'million'}`) : '',
    x.d ? row(L.coords, `${Math.abs(x.d[0])}°${x.d[0] < 0 ? 'S' : 'N'}, ${Math.abs(x.d[1])}°${x.d[1] < 0 ? 'W' : 'E'}`) : '',
  ].filter(Boolean).join('\n          ');
  const factsHtml = `<section class="max-w-2xl w-full mx-auto mb-14 reveal glass-panel rounded-2xl p-6 sm:p-8">
        <h2 class="text-xl font-semibold text-white mb-5">${L.facts}</h2>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          ${rows}
        </dl>
      </section>`;

  // Reference cities: Madrid + New York for ES readers, New York + London for EN.
  const refs = (esLang
    ? [['Madrid', 'Europe/Madrid'], ['Nueva York', 'America/New_York']]
    : [['New York', 'America/New_York'], ['London', 'Europe/London']]
  ).filter(([, tz]) => tz !== c.tz);
  const calls = refs.map(([rn, rtz]) => callInfo(name, c.tz, rn, rtz, esLang));
  // Windows use offsets from build time, and every reference city observes DST.
  const callNote = esLang ? 'El horario de verano puede mover estas franjas una hora en algunas épocas del año.' : 'Daylight saving time can move these windows by an hour at some times of year.';
  const callHtml = refs.length ? `<section class="max-w-2xl w-full mx-auto mb-14 reveal glass-panel rounded-2xl p-6 sm:p-8">
        <h2 class="text-xl font-semibold text-white mb-4">${L.call}</h2>
        <div class="space-y-4 text-sm text-zinc-400 leading-relaxed">
          ${calls.map((ci) => `<p>${esc(ci.sentence)} ${esc(ci.rec)}</p>`).join('\n          ')}
          <p class="text-zinc-500">${callNote}</p>
        </div>
      </section>` : '';

  const nearHtml = x.nearby.length ? `<section class="max-w-2xl w-full mx-auto mb-14 reveal text-center">
        <h2 class="text-xl font-semibold text-white mb-5">${L.near}</h2>
        <div class="flex flex-wrap gap-2 justify-center">
          ${x.nearby.map(({ o, km }) => {
            const href = esLang && ES_CITY[o.slug] ? `/es/time/${o.slug}` : `/time/${o.slug}`;
            const oname = esLang && ES_CITY[o.slug] ? ES_CITY[o.slug].name : o.name;
            return `<a href="${href}" class="glass-card card-hover rounded-lg px-3 py-2 text-sm text-zinc-300 hover:text-blue-300 transition-colors">${esc(oname)} <span class="text-zinc-500">· ${Math.round(km / 10) * 10} km</span></a>`;
          }).join('\n          ')}
        </div>
      </section>` : '';

  // Extra FAQ: best time to call from the first reference city.
  let faqHtml = '', faqLd = '';
  if (refs.length) {
    const q = L.faqQ(refs[0][0]);
    const a = `${calls[0].sentence} ${calls[0].rec} ${callNote}`;
    faqHtml = `<details class="faq group glass-card rounded-lg overflow-hidden">
            <summary class="cursor-pointer list-none marker:hidden [&amp;::-webkit-details-marker]:hidden p-4 flex justify-between items-center gap-3 text-sm font-medium text-zinc-300"><span>${esc(q)}</span><span class="text-lg leading-none text-zinc-500 group-open:rotate-45 transition-transform duration-300 shrink-0">+</span></summary>
            <p class="px-4 pb-4 text-sm text-zinc-500 leading-relaxed">${esc(a)}</p>
          </details>`;
    faqLd = `,\n          { "@type": "Question", "name": "${q}", "acceptedAnswer": { "@type": "Answer", "text": "${a}" } }`;
  }

  return { metas, sectionsHtml: `${factsHtml}\n\n      ${callHtml}\n\n      ${nearHtml}`, faqHtml, faqLd };
}

// Spanish per-city page for /es/time/{slug}. Same React island (city-page.tsx)
// reads the ct-* meta; only the static SEO content is translated.
function cityPageEs(c, es, x) {
  const name = esc(es.name), country = esc(es.country), tz = esc(c.tz);
  const tzLabel = tzLabelOf(tz);
  const dst = dstSentenceEs(name, c.tz);
  const enr = cityEnrichment(c, { ...x, esName: es.name, esCountry: es.country }, true);
  return `<!DOCTYPE html>
<html lang="es" class="dark scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#09090b" />
    <title>Hora actual en ${name} — Hora local en vivo y zona horaria | ChronoMap</title>
    <meta name="description" content="¿Qué hora es en ${name}, ${country}? Consulta la hora local actual en vivo en ${name}, su zona horaria ${tz} y su offset UTC, y compárala con las principales ciudades del mundo." />
    <meta name="keywords" content="hora actual en ${name}, qué hora es en ${name}, hora en ${name} ahora, zona horaria de ${name}, hora local de ${name}" />
    <meta name="robots" content="noindex, follow" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${SITE}/es/time/${c.slug}" />
    <meta name="ct-city" content="${name}" />
    <meta name="ct-country" content="${country}" />
    <meta name="ct-tz" content="${tz}" />${enr.metas}
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE}/es/time/${c.slug}" />
    <meta property="og:title" content="Hora actual en ${name} — Hora local en vivo" />
    <meta property="og:description" content="Hora local en vivo en ${name}, ${country} (${tz}), con comparaciones con las principales ciudades del mundo." />
    <meta property="og:image" content="https://www.chronomap.top/og.png" />
    <meta property="og:locale" content="es_ES" />
    ${HEAD_FONTS}
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "inLanguage": "es",
        "mainEntity": [
          { "@type": "Question", "name": "¿En qué zona horaria está ${name}?", "acceptedAnswer": { "@type": "Answer", "text": "${name} está en la zona horaria ${tz} (${offsetFacts(c.tz, true)})." } },
          { "@type": "Question", "name": "¿${name} observa el horario de verano?", "acceptedAnswer": { "@type": "Answer", "text": "${dstAnswer(name, c.tz, true)}" } },
          { "@type": "Question", "name": "¿Cuándo cambian los relojes en ${name}?", "acceptedAnswer": { "@type": "Answer", "text": "${dst}" } }${enr.faqLd}
        ]
      }
    </script>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "${SITE}/es" },
          { "@type": "ListItem", "position": 2, "name": "Hora en ${name}", "item": "${SITE}/es/time/${c.slug}" }
        ]
      }
    </script>
  </head>
  <body class="min-h-screen antialiased relative overflow-x-hidden selection:bg-blue-500/30 selection:text-white">
    ${headerEs(`/time/${c.slug}`)}
    <main class="relative z-10 flex flex-col items-center px-4 sm:px-6 pt-10 pb-28">
      <header class="max-w-2xl w-full text-center flex flex-col items-center mb-10 reveal">
        <h1 class="text-4xl sm:text-5xl md:text-[54px] leading-[1.08] font-semibold tracking-tight text-shimmer mb-4">Hora actual en ${name}</h1>
        <p class="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl">La hora local en vivo en ${name}, ${country} — ${tzLabel} (${tz}). Compárala con las principales ciudades más abajo, o abre el <a href="/es" class="text-blue-400 hover:text-blue-300 transition-colors">mapa del reloj mundial</a> completo.</p>
      </header>

      <div class="w-full max-w-2xl mx-auto mb-14 reveal" style="animation-delay:.1s" id="city-app">
        <div class="glass-panel rounded-2xl p-8 text-center text-zinc-500">Cargando el reloj en vivo de ${name}…</div>
      </div>

      <section class="max-w-2xl w-full mx-auto mb-14 reveal glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none"></div>
        <h2 class="text-xl font-semibold text-white mb-4 relative z-10">La hora en ${name}</h2>
        <div class="space-y-4 text-sm text-zinc-400 leading-relaxed relative z-10">
          <p>${name} sigue la zona horaria <strong class="text-zinc-200">${tz}</strong>. ${offsetSentence(c.tz, true)}</p>
          <p><strong class="text-zinc-200">Horario de verano:</strong> ${dst}</p>
          <p>Para convertir una hora concreta, usa el <a href="/es/time-zone-converter?from=${c.slug}" class="text-blue-400 hover:text-blue-300 transition-colors">conversor de husos horarios</a>. Para buscar hueco para una llamada, usa el <a href="/es/meeting-planner" class="text-blue-400 hover:text-blue-300 transition-colors">planificador de reuniones</a>.</p>
        </div>
      </section>

      ${enr.sectionsHtml}

      <section class="max-w-2xl w-full mx-auto mb-14 reveal">
        <h2 class="text-xl font-semibold text-white mb-5 text-center">Preguntas frecuentes</h2>
        <div class="space-y-3">
          <details class="faq group glass-card rounded-lg overflow-hidden">
            <summary class="cursor-pointer list-none marker:hidden [&amp;::-webkit-details-marker]:hidden p-4 flex justify-between items-center gap-3 text-sm font-medium text-zinc-300"><span>¿En qué zona horaria está ${name}?</span><span class="text-lg leading-none text-zinc-500 group-open:rotate-45 transition-transform duration-300 shrink-0">+</span></summary>
            <p class="px-4 pb-4 text-sm text-zinc-500 leading-relaxed">${name} está en la zona horaria ${tz} (${offsetFacts(c.tz, true)}).</p>
          </details>
          <details class="faq group glass-card rounded-lg overflow-hidden">
            <summary class="cursor-pointer list-none marker:hidden [&amp;::-webkit-details-marker]:hidden p-4 flex justify-between items-center gap-3 text-sm font-medium text-zinc-300"><span>¿${name} observa el horario de verano?</span><span class="text-lg leading-none text-zinc-500 group-open:rotate-45 transition-transform duration-300 shrink-0">+</span></summary>
            <p class="px-4 pb-4 text-sm text-zinc-500 leading-relaxed">${dstAnswer(name, c.tz, true)}</p>
          </details>
          <details class="faq group glass-card rounded-lg overflow-hidden">
            <summary class="cursor-pointer list-none marker:hidden [&amp;::-webkit-details-marker]:hidden p-4 flex justify-between items-center gap-3 text-sm font-medium text-zinc-300"><span>¿Cuándo cambian los relojes en ${name}?</span><span class="text-lg leading-none text-zinc-500 group-open:rotate-45 transition-transform duration-300 shrink-0">+</span></summary>
            <p class="px-4 pb-4 text-sm text-zinc-500 leading-relaxed">${dst}</p>
          </details>
          ${enr.faqHtml}
        </div>
      </section>

      <footer class="w-full text-center mt-2 reveal">
        <div class="flex flex-col items-center gap-5">
          <a href="/es" class="inline-flex items-center gap-2 group">
            <span class="relative w-6 h-6 flex items-center justify-center shrink-0">
              <span class="absolute inset-0 rounded-full border border-zinc-700"></span>
              <span class="absolute inset-0.5 rounded-full border border-blue-500/60 border-t-transparent"></span>
              <span class="w-1 h-1 rounded-full bg-white/50"></span>
            </span>
            <span class="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">ChronoMap</span>
          </a>
          <nav class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-zinc-500">
            <a href="/es" class="hover:text-zinc-300 transition-colors">Reloj mundial</a>
            <a href="/es/time-zone-map" class="hover:text-zinc-300 transition-colors">Mapa de husos horarios</a>
            <a href="/es/meeting-planner" class="hover:text-zinc-300 transition-colors">Planificador de reuniones</a>
            <a href="/es/time-zone-converter" class="hover:text-zinc-300 transition-colors">Conversor de husos horarios</a>
            <a href="/es/about" class="hover:text-zinc-300 transition-colors">Sobre ChronoMap</a>
            <a href="/es/privacy" class="hover:text-zinc-300 transition-colors">Privacidad</a>
            <a href="/time/${c.slug}" class="hover:text-zinc-300 transition-colors" hreflang="en">English</a>
          </nav>
        </div>
      </footer>
    </main>
    <script type="module" src="/src/city-page.tsx"></script>
  </body>
</html>
`;
}

function cityPage(c, hasEs, x) {
  const name = esc(c.name), country = esc(c.country), tz = esc(c.tz);
  const tzLabel = tzLabelOf(tz);
  const dst = dstSentence(name, c.tz);
  const enr = cityEnrichment(c, x, false);
  const robots = INDEXED_CITIES.includes(c.slug) ? 'index, follow' : 'noindex, follow';
  // Add a visible "Español" language link to the footer when a Spanish twin exists.
  const footer = hasEs
    ? FOOTER.replace('</nav>', `<a href="/es/time/${c.slug}" class="hover:text-zinc-300 transition-colors" hreflang="es">Español</a>\n          </nav>`)
    : FOOTER;
  return `<!DOCTYPE html>
<html lang="en" class="dark scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#09090b" />
    <title>Current Time in ${name} — Live Local Time &amp; Time Zone | ChronoMap</title>
    <meta name="description" content="What time is it in ${name}, ${country}? See the live current local time in ${name}, its ${tz} time zone and UTC offset, and compare it with major cities around the world." />
    <meta name="keywords" content="current time in ${name}, what time is it in ${name}, ${name} time now, ${name} time zone, ${name} local time" />
    <meta name="robots" content="${robots}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${SITE}/time/${c.slug}" />
    <meta name="ct-city" content="${name}" />
    <meta name="ct-country" content="${country}" />
    <meta name="ct-tz" content="${tz}" />${enr.metas}
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE}/time/${c.slug}" />
    <meta property="og:title" content="Current Time in ${name} — Live Local Time" />
    <meta property="og:description" content="Live local time in ${name}, ${country} (${tz}), with comparisons to major world cities." />
    <meta property="og:image" content="https://www.chronomap.top/og.png" />
    ${HEAD_FONTS}
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "What time zone is ${name} in?", "acceptedAnswer": { "@type": "Answer", "text": "${name} is in the ${tz} time zone (${offsetFacts(c.tz, false)})." } },
          { "@type": "Question", "name": "Does ${name} observe daylight saving time?", "acceptedAnswer": { "@type": "Answer", "text": "${dstAnswer(name, c.tz, false)}" } },
          { "@type": "Question", "name": "When do the clocks change in ${name}?", "acceptedAnswer": { "@type": "Answer", "text": "${dst}" } }${enr.faqLd}
        ]
      }
    </script>
    ${breadcrumb([{ name: 'Home', path: '/' }, { name: 'Cities', path: '/time' }, { name: `Time in ${c.name}`, path: `/time/${c.slug}` }])}
  </head>
  <body class="min-h-screen antialiased relative overflow-x-hidden selection:bg-blue-500/30 selection:text-white">
    ${headerEn(hasEs ? `/es/time/${c.slug}` : '')}
    <main class="relative z-10 flex flex-col items-center px-4 sm:px-6 pt-10 pb-28">
      <header class="max-w-2xl w-full text-center flex flex-col items-center mb-10 reveal">
        <h1 class="text-4xl sm:text-5xl md:text-[54px] leading-[1.08] font-semibold tracking-tight text-shimmer mb-4">Current Time in ${name}</h1>
        <p class="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl">The live local time in ${name}, ${country} — ${tzLabel} (${tz}). Compare it with major cities below, or open the full <a href="/" class="text-blue-400 hover:text-blue-300 transition-colors">world clock map</a>.</p>
      </header>

      <div class="w-full max-w-2xl mx-auto mb-14 reveal" style="animation-delay:.1s" id="city-app">
        <div class="glass-panel rounded-2xl p-8 text-center text-zinc-500">Loading the live clock for ${name}…</div>
      </div>

      <section class="max-w-2xl w-full mx-auto mb-14 reveal glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none"></div>
        <h2 class="text-xl font-semibold text-white mb-4 relative z-10">Time in ${name}</h2>
        <div class="space-y-4 text-sm text-zinc-400 leading-relaxed relative z-10">
          <p>${name} follows the <strong class="text-zinc-200">${tz}</strong> time zone. ${offsetSentence(c.tz, false)}</p>
          <p><strong class="text-zinc-200">Daylight saving:</strong> ${dst}</p>
          ${CITY_NOTES[c.slug] ? `<p>${esc(CITY_NOTES[c.slug])}</p>` : ''}
          <p>To convert a specific time, use the <a href="/time-zone-converter?from=${c.slug}" class="text-blue-400 hover:text-blue-300 transition-colors">time zone converter</a>. To find a slot for a call, use the <a href="/meeting-planner" class="text-blue-400 hover:text-blue-300 transition-colors">meeting planner</a>.</p>
        </div>
      </section>

      ${enr.sectionsHtml}

      <section class="max-w-2xl w-full mx-auto mb-14 reveal">
        <h2 class="text-xl font-semibold text-white mb-5 text-center">Frequently asked questions</h2>
        <div class="space-y-3">
          <details class="faq group glass-card rounded-lg overflow-hidden">
            <summary class="cursor-pointer list-none marker:hidden [&amp;::-webkit-details-marker]:hidden p-4 flex justify-between items-center gap-3 text-sm font-medium text-zinc-300"><span>What time zone is ${name} in?</span><span class="text-lg leading-none text-zinc-500 group-open:rotate-45 transition-transform duration-300 shrink-0">+</span></summary>
            <p class="px-4 pb-4 text-sm text-zinc-500 leading-relaxed">${name} is in the ${tz} time zone (${offsetFacts(c.tz, false)}).</p>
          </details>
          <details class="faq group glass-card rounded-lg overflow-hidden">
            <summary class="cursor-pointer list-none marker:hidden [&amp;::-webkit-details-marker]:hidden p-4 flex justify-between items-center gap-3 text-sm font-medium text-zinc-300"><span>Does ${name} observe daylight saving time?</span><span class="text-lg leading-none text-zinc-500 group-open:rotate-45 transition-transform duration-300 shrink-0">+</span></summary>
            <p class="px-4 pb-4 text-sm text-zinc-500 leading-relaxed">${dstAnswer(name, c.tz, false)}</p>
          </details>
          <details class="faq group glass-card rounded-lg overflow-hidden">
            <summary class="cursor-pointer list-none marker:hidden [&amp;::-webkit-details-marker]:hidden p-4 flex justify-between items-center gap-3 text-sm font-medium text-zinc-300"><span>When do the clocks change in ${name}?</span><span class="text-lg leading-none text-zinc-500 group-open:rotate-45 transition-transform duration-300 shrink-0">+</span></summary>
            <p class="px-4 pb-4 text-sm text-zinc-500 leading-relaxed">${dst}</p>
          </details>
          ${enr.faqHtml}
        </div>
      </section>

      ${footer}
    </main>
    <script type="module" src="/src/city-page.tsx"></script>
  </body>
</html>
`;
}

// Time-zone abbreviation comparators (/time/est-to-ist, /time/pst-to-gmt, …).
// `tz` is the IANA zone users MEAN by the abbreviation (colloquial "EST" = US
// Eastern Time including DST), `min` its STANDARD offset in minutes (for the
// "normally X hours ahead" prose — the live island always shows the real gap).
const ZONES = JSON.parse(readFileSync(filePath('src/zones.json'), 'utf8'));

// "IST is normally 10 hours 30 minutes ahead of EST" (standard offsets; live
// island shows the real current gap including DST).
function zoneGapSentence(a, b) {
  const diff = b.min - a.min;
  if (diff === 0) return `${b.abbr} and ${a.abbr} share the same standard offset, so their clocks normally read the same time.`;
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 60), m = abs % 60;
  const span = `${h} hour${h === 1 ? '' : 's'}${m ? ` ${m} minutes` : ''}`;
  return `${b.abbr} is normally ${span} ${diff > 0 ? 'ahead of' : 'behind'} ${a.abbr}.`;
}

function zoneDstSentence(z) {
  if (z.dstText) return z.dstText;
  return z.dst
    ? `${z.abbr} is the standard time (${z.off}); when daylight saving is in effect it becomes ${z.dst}. The live clock on this page always shows the current offset.`
    : `${z.abbr} stays at ${z.off} all year round — it does not observe daylight saving time.`;
}

function zoneComparePage(a, b) {
  const an = esc(a.abbr), bn = esc(b.abbr), atz = esc(a.tz), btz = esc(b.tz);
  const slug = `${a.slug}-to-${b.slug}`;
  const gap = zoneGapSentence(a, b);
  const notes = [a, b].filter((z) => z.note).map((z) => esc(z.note));
  return `<!DOCTYPE html>
<html lang="en" class="dark scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#09090b" />
    <title>${an} to ${bn} — Time Difference &amp; Converter | ChronoMap</title>
    <meta name="description" content="Convert ${an} (${esc(a.name)}, ${esc(a.off)}) to ${bn} (${esc(b.name)}, ${esc(b.off)}). ${esc(gap)} See both live clocks and convert any time between ${an} and ${bn}." />
    <meta name="keywords" content="${a.abbr} to ${b.abbr}, ${a.abbr} to ${b.abbr} converter, ${a.abbr} to ${b.abbr} time difference, convert ${a.abbr} to ${b.abbr}, ${a.name} to ${b.name}" />
    <meta name="robots" content="index, follow" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${SITE}/time/${slug}" />
    <meta name="ct-a-city" content="${an}" />
    <meta name="ct-a-tz" content="${atz}" />
    <meta name="ct-b-city" content="${bn}" />
    <meta name="ct-b-tz" content="${btz}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE}/time/${slug}" />
    <meta property="og:title" content="${an} to ${bn} — Time Difference &amp; Converter" />
    <meta property="og:description" content="${esc(gap)} Live clocks and converter between ${an} and ${bn}." />
    <meta property="og:image" content="https://www.chronomap.top/og.png" />
    ${HEAD_FONTS}
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "What is the time difference between ${an} and ${bn}?", "acceptedAnswer": { "@type": "Answer", "text": "${gap} The live tool on this page shows the exact current difference, which already accounts for daylight saving time where it applies." } },
          { "@type": "Question", "name": "What does ${an} stand for?", "acceptedAnswer": { "@type": "Answer", "text": "${an} stands for ${esc(a.name)}, at ${esc(a.off)}. ${zoneDstSentence(a)}" } },
          { "@type": "Question", "name": "What does ${bn} stand for?", "acceptedAnswer": { "@type": "Answer", "text": "${bn} stands for ${esc(b.name)}, at ${esc(b.off)}. ${zoneDstSentence(b)}" } }
        ]
      }
    </script>
    ${breadcrumb([{ name: 'Home', path: '/' }, { name: 'Cities', path: '/time' }, { name: `${a.abbr} to ${b.abbr}`, path: `/time/${slug}` }])}
  </head>
  <body class="min-h-screen antialiased relative overflow-x-hidden selection:bg-blue-500/30 selection:text-white">
    ${headerEn('')}
    <main class="relative z-10 flex flex-col items-center px-4 sm:px-6 pt-10 pb-28">
      <header class="max-w-2xl w-full text-center flex flex-col items-center mb-10 reveal">
        <h1 class="text-4xl sm:text-5xl md:text-[52px] leading-[1.08] font-semibold tracking-tight text-shimmer mb-4">${an} to ${bn}</h1>
        <p class="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl">Convert ${esc(a.name)} (${an}) to ${esc(b.name)} (${bn}), live. ${esc(gap)} Pick any time below, or open the full <a href="/" class="text-blue-400 hover:text-blue-300 transition-colors">world clock map</a>.</p>
      </header>

      <div class="w-full max-w-2xl mx-auto mb-14 reveal" style="animation-delay:.1s" id="compare-app">
        <div class="glass-panel rounded-2xl p-8 text-center text-zinc-500">Loading live ${an} and ${bn} clocks…</div>
      </div>

      <section class="max-w-2xl w-full mx-auto mb-14 reveal glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none"></div>
        <h2 class="text-xl font-semibold text-white mb-4 relative z-10">${an} vs ${bn}</h2>
        <div class="space-y-4 text-sm text-zinc-400 leading-relaxed relative z-10">
          <p><strong class="text-zinc-200">${an}</strong> (${esc(a.name)}) runs at <strong class="text-zinc-200">${esc(a.off)}</strong> and <strong class="text-zinc-200">${bn}</strong> (${esc(b.name)}) at <strong class="text-zinc-200">${esc(b.off)}</strong>. ${esc(gap)}</p>
          <p>${esc(zoneDstSentence(a))} ${esc(zoneDstSentence(b))}</p>
          ${notes.length ? `<p>${notes.join(' ')}</p>` : ''}
          <p>Need the reverse, another date, or a different zone? Use the <a href="/time-zone-converter?from=${b.slug}&amp;to=${a.slug}" class="text-blue-400 hover:text-blue-300 transition-colors">time zone converter</a>. You can also browse every offset on the <a href="/time-zone-map" class="text-blue-400 hover:text-blue-300 transition-colors">interactive time zone map</a> or line up several zones at once with the <a href="/meeting-planner" class="text-blue-400 hover:text-blue-300 transition-colors">meeting planner</a>.</p>
        </div>
      </section>

      ${FOOTER}
    </main>
    <script type="module" src="/src/compare-page.tsx"></script>
  </body>
</html>
`;
}

const REGION_ORDER = ['Americas', 'Europe', 'Africa', 'Asia', 'Oceania'];
function regionOf(tz) {
  const p = tz.split('/')[0];
  if (p === 'America') return 'Americas';
  if (p === 'Europe' || p === 'Atlantic') return 'Europe';
  if (p === 'Africa') return 'Africa';
  if (p === 'Asia') return 'Asia';
  return 'Oceania'; // Australia/ + Pacific/
}

function timeIndexPage(cities, zonePairs) {
  const byRegion = {};
  for (const c of cities) (byRegion[regionOf(c.tz)] ||= []).push(c);
  const regionsHtml = REGION_ORDER.filter((r) => byRegion[r]).map((r) => {
    const links = byRegion[r]
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => `<a href="/time/${c.slug}" data-city="${esc(c.name)}" class="city-link block text-sm text-zinc-300 hover:text-blue-300 transition-colors py-1">${esc(c.name)}</a>`)
      .join('\n            ');
    return `<div data-region class="glass-card rounded-xl p-5">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3">${r}</h2>
          <div class="grid grid-cols-2 gap-x-4">
            ${links}
          </div>
        </div>`;
  }).join('\n        ');

  const zoneHtml = zonePairs
    .map(([a, b]) => `<a href="/time/${a.slug}-to-${b.slug}" class="text-sm text-zinc-400 hover:text-blue-300 transition-colors py-1 truncate">${esc(a.abbr)} → ${esc(b.abbr)}</a>`)
    .join('\n          ');

  return `<!DOCTYPE html>
<html lang="en" class="dark scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#09090b" />
    <title>World Clock — Current Time in Cities Around the World | ChronoMap</title>
    <meta name="description" content="The current local time in ${cities.length} major cities, with live clocks, UTC offsets and daylight saving dates, plus popular time zone conversions." />
    <meta name="keywords" content="world clock, current time in cities, local time by city, time zone by city, city time list" />
    <meta name="robots" content="index, follow" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${SITE}/time" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE}/time" />
    <meta property="og:title" content="World Clock — Current Time in Cities Around the World" />
    <meta property="og:description" content="The current local time in ${cities.length} major cities, with live clocks and UTC offsets." />
    <meta property="og:image" content="https://www.chronomap.top/og.png" />
    ${HEAD_FONTS}
    ${breadcrumb([{ name: 'Home', path: '/' }, { name: 'Cities', path: '/time' }])}
  </head>
  <body class="min-h-screen antialiased relative overflow-x-hidden selection:bg-blue-500/30 selection:text-white">
    ${headerEn('')}
    <main class="relative z-10 flex flex-col items-center px-4 sm:px-6 pt-10 pb-28">
      <header class="max-w-2xl w-full text-center flex flex-col items-center mb-10 reveal">
        <h1 class="text-4xl sm:text-5xl md:text-[52px] leading-[1.08] font-semibold tracking-tight text-shimmer mb-4">World Clock by City</h1>
        <p class="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl mb-6">The current local time in major cities around the world. Search this list, or open the full <a href="/" class="text-blue-400 hover:text-blue-300 transition-colors">world clock map</a>.</p>
        <input id="city-search" type="search" placeholder="Search a city…" autocomplete="off" class="w-full max-w-sm bg-zinc-800/60 text-zinc-100 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all" />
      </header>

      <section class="max-w-4xl w-full mx-auto mb-14 reveal">
        <div id="city-groups" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${regionsHtml}
        </div>
        <p id="no-results" class="hidden text-center text-zinc-500 text-sm mt-8">No city matches your search.</p>
      </section>

      <section class="max-w-4xl w-full mx-auto mb-14 reveal">
        <h2 class="text-xl font-semibold text-white mb-5 text-center">Popular time zone conversions</h2>
        <p class="text-sm text-zinc-500 text-center mb-5 max-w-xl mx-auto">For any other pair of cities or zones, use the <a href="/time-zone-converter" class="text-blue-400 hover:text-blue-300 transition-colors">time zone converter</a>.</p>
        <div class="glass-panel rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-4">
          ${zoneHtml}
        </div>
      </section>

      ${FOOTER}
    </main>
    <script type="module" src="/src/time-index-page.tsx"></script>
  </body>
</html>
`;
}

export function generate() {
  const cities = JSON.parse(readFileSync(filePath('src/cities.json'), 'utf8'));
  mkdirSync(filePath('time'), { recursive: true });
  mkdirSync(filePath('es/time'), { recursive: true });

  const entries = [];

  // Enrichment inputs per city: coords/population + calling code + 6 nearest
  // cities (haversine over city-data.json; cities without data get none).
  const enrichOf = (c) => {
    const d = CITY_DATA[c.slug];
    const nearby = d
      ? cities
          .filter((o) => o.slug !== c.slug && CITY_DATA[o.slug])
          .map((o) => ({ o, km: havKm(d, CITY_DATA[o.slug]) }))
          .sort((p, q) => p.km - q.km)
          .slice(0, 6)
      : [];
    return { d, call: CALLING[c.country] || null, nearby };
  };

  for (const c of cities) {
    const es = ES_CITY[c.slug];
    const x = enrichOf(c);
    writeFileSync(filePath(`time/${c.slug}.html`), cityPage(c, !!es, x));
    entries.push({ name: `time-${c.slug}`, file: filePath(`time/${c.slug}.html`) });
    if (es) {
      writeFileSync(filePath(`es/time/${c.slug}.html`), cityPageEs(c, es, x));
      entries.push({ name: `es-time-${c.slug}`, file: filePath(`es/time/${c.slug}.html`) });
    }
  }

  // Time-zone abbreviation comparators (a≠b) — reuse the same compare island.
  const zoneOf = (slug) => ZONES.find((z) => z.slug === slug);
  const zonePairs = ZONE_KEEP.map((k) => k.split('-to-').map(zoneOf));
  for (const [a, b] of zonePairs) {
    const slug = `${a.slug}-to-${b.slug}`;
    writeFileSync(filePath(`time/${slug}.html`), zoneComparePage(a, b));
    entries.push({ name: `zcmp-${slug}`, file: filePath(`time/${slug}.html`) });
  }

  // Index/hub page served at /time: links to the pages offered to search engines.
  // time/index.html so it coexists with the time/{slug}.html pages; Vercel's
  // cleanUrls serves it at /time.
  const indexedCities = cities.filter((c) => INDEXED_CITIES.includes(c.slug));
  writeFileSync(filePath('time/index.html'), timeIndexPage(indexedCities, zonePairs));
  entries.push({ name: 'time-index', file: filePath('time/index.html') });

  const urls = [
    { loc: `${SITE}/`, mod: '2026-07-06' },
    { loc: `${SITE}/es`, mod: '2026-07-06' },
    { loc: `${SITE}/es/time-zone-converter`, mod: '2026-11-03' },
    { loc: `${SITE}/es/time-zone-map`, mod: '2026-07-06' },
    { loc: `${SITE}/es/meeting-planner`, mod: '2026-11-03' },
    { loc: `${SITE}/es/discord-timestamp-generator`, mod: '2026-11-03' },
    { loc: `${SITE}/es/flight-time-calculator`, mod: '2026-11-03' },
    { loc: `${SITE}/es/jet-lag-calculator`, mod: '2026-11-03' },
    { loc: `${SITE}/es/flight-route-map`, mod: '2026-07-06' },
    { loc: `${SITE}/es/clock-widget`, mod: '2026-07-06' },
    { loc: `${SITE}/es/about`, mod: '2026-11-02' },
    { loc: `${SITE}/es/privacy`, mod: '2026-11-02' },
    { loc: `${SITE}/time`, mod: HUB_UPDATED },
    { loc: `${SITE}/time-zone-converter`, mod: '2026-11-03' },
    { loc: `${SITE}/time-zone-map`, mod: '2026-07-06' },
    { loc: `${SITE}/discord-timestamp-generator`, mod: '2026-11-03' },
    { loc: `${SITE}/meeting-planner`, mod: '2026-11-03' },
    { loc: `${SITE}/flight-time-calculator`, mod: '2026-11-03' },
    { loc: `${SITE}/jet-lag-calculator`, mod: '2026-11-03' },
    { loc: `${SITE}/flight-route-map`, mod: '2026-07-06' },
    { loc: `${SITE}/clock-widget`, mod: '2026-07-06' },
    { loc: `${SITE}/windows`, mod: '2026-07-06' },
    { loc: `${SITE}/about`, mod: '2026-11-02' },
    { loc: `${SITE}/privacy`, mod: '2026-11-02' },
    ...indexedCities.map((c) => ({ loc: `${SITE}/time/${c.slug}`, mod: CITY_UPDATED })),
    ...zonePairs.map(([a, b]) => ({ loc: `${SITE}/time/${a.slug}-to-${b.slug}`, mod: ZONE_UPDATED })),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.mod}</lastmod>
  </url>`).join('\n')}
</urlset>
`;
  writeFileSync(filePath('public/sitemap.xml'), sitemap);
  console.log(`[gen-city-pages] ${cities.length} cities (${indexedCities.length} indexed) + ${zonePairs.length} zone conversions, sitemap ${urls.length} urls.`);
  return entries;
}

// Run when invoked directly: node scripts/gen-city-pages.mjs
if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  generate();
}
