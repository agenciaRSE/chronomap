// Generates static, crawlable pages from src/cities.json:
//   - one per city:            time/{slug}.html          (/time/{slug})
//   - directional comparators: time/{a}-to-{b}.html      (/time/{a}-to-{b})
//     for ordered pairs among the top PAIR_COUNT cities.
// Also writes public/sitemap.xml and returns the Vite MPA entry list. Called
// from vite.config (runs at the start of every build) and runnable directly
// (`node scripts/gen-city-pages.mjs`). Live clocks are React islands
// (city-page.tsx / compare-page.tsx) that read the ct-* meta tags.
import { readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';

const root = new URL('..', import.meta.url);
const SITE = 'https://www.chronomap.top';
const PAIR_COUNT = 10; // comparators are generated among the first N cities

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
            <a href="/time" class="hover:text-zinc-300 transition-colors">All cities</a>
            <a href="/time-zone-map" class="hover:text-zinc-300 transition-colors">Time zone map</a>
            <a href="/meeting-planner" class="hover:text-zinc-300 transition-colors">Meeting planner</a>
            <a href="/discord-timestamp-generator" class="hover:text-zinc-300 transition-colors">Discord timestamps</a>
            <a href="/windows" class="hover:text-zinc-300 transition-colors">Windows app</a>
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

// Spanish per-city page for /es/time/{slug}. Same React island (city-page.tsx)
// reads the ct-* meta; only the static SEO content is translated.
function cityPageEs(c, es) {
  const name = esc(es.name), country = esc(es.country), tz = esc(c.tz);
  const tzLabel = tzLabelOf(tz);
  const dst = dstSentenceEs(name, c.tz);
  return `<!DOCTYPE html>
<html lang="es" class="dark scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#09090b" />
    <title>Hora actual en ${name} — Hora local en vivo y zona horaria | ChronoMap</title>
    <meta name="description" content="¿Qué hora es en ${name}, ${country}? Consulta la hora local actual en vivo en ${name}, su zona horaria ${tz} y su offset UTC, y compárala con las principales ciudades del mundo." />
    <meta name="keywords" content="hora actual en ${name}, qué hora es en ${name}, hora en ${name} ahora, zona horaria de ${name}, hora local de ${name}" />
    <meta name="robots" content="index, follow" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${SITE}/es/time/${c.slug}" />
    <link rel="alternate" hreflang="en" href="${SITE}/time/${c.slug}" />
    <link rel="alternate" hreflang="es" href="${SITE}/es/time/${c.slug}" />
    <link rel="alternate" hreflang="x-default" href="${SITE}/time/${c.slug}" />
    <meta name="ct-city" content="${name}" />
    <meta name="ct-country" content="${country}" />
    <meta name="ct-tz" content="${tz}" />
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
          { "@type": "Question", "name": "¿En qué zona horaria está ${name}?", "acceptedAnswer": { "@type": "Answer", "text": "${name} está en la zona horaria ${tz}. El reloj en vivo de arriba muestra su offset UTC actual, que ya tiene en cuenta el horario de verano donde aplica." } },
          { "@type": "Question", "name": "¿${name} observa el horario de verano?", "acceptedAnswer": { "@type": "Answer", "text": "Las horas mostradas para ${name} usan su zona horaria IANA actual (${tz}), así que el horario de verano se refleja automáticamente cuando ${country} lo observa." } },
          { "@type": "Question", "name": "¿Cuándo cambian los relojes en ${name}?", "acceptedAnswer": { "@type": "Answer", "text": "${dst}" } }
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
    <main class="relative z-10 flex flex-col items-center px-4 sm:px-6 pt-20 pb-28">
      <header class="max-w-2xl w-full text-center flex flex-col items-center mb-10 reveal">
        ${LOGO_ES}
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
          <p>${name} sigue la zona horaria <strong class="text-zinc-200">${tz}</strong>. Su offset respecto al Tiempo Universal Coordinado (UTC) cambia cuando está en vigor el horario de verano, así que el reloj en vivo de arriba siempre muestra la hora local real en este momento.</p>
          <p><strong class="text-zinc-200">Horario de verano:</strong> ${dst}</p>
          <p>Para planificar una llamada o evento entre zonas, compara ${name} con otras ciudades de la lista de arriba, explora cada offset en el <a href="/es/time-zone-map" class="text-blue-400 hover:text-blue-300 transition-colors">mapa de husos horarios interactivo</a>, o convierte cualquier momento en un código compartible con el <a href="/es/discord-timestamp-generator" class="text-blue-400 hover:text-blue-300 transition-colors">generador de timestamps de Discord</a>.</p>
        </div>
      </section>

      <section class="max-w-2xl w-full mx-auto mb-14 reveal">
        <h2 class="text-xl font-semibold text-white mb-5 text-center">Preguntas frecuentes</h2>
        <div class="space-y-3">
          <details class="faq group glass-card rounded-lg overflow-hidden">
            <summary class="cursor-pointer list-none marker:hidden [&amp;::-webkit-details-marker]:hidden p-4 flex justify-between items-center gap-3 text-sm font-medium text-zinc-300"><span>¿En qué zona horaria está ${name}?</span><span class="text-lg leading-none text-zinc-500 group-open:rotate-45 transition-transform duration-300 shrink-0">+</span></summary>
            <p class="px-4 pb-4 text-sm text-zinc-500 leading-relaxed">${name} está en la zona horaria ${tz}. El reloj en vivo muestra su offset UTC actual, que ya tiene en cuenta el horario de verano donde aplica.</p>
          </details>
          <details class="faq group glass-card rounded-lg overflow-hidden">
            <summary class="cursor-pointer list-none marker:hidden [&amp;::-webkit-details-marker]:hidden p-4 flex justify-between items-center gap-3 text-sm font-medium text-zinc-300"><span>¿${name} observa el horario de verano?</span><span class="text-lg leading-none text-zinc-500 group-open:rotate-45 transition-transform duration-300 shrink-0">+</span></summary>
            <p class="px-4 pb-4 text-sm text-zinc-500 leading-relaxed">Las horas mostradas usan la zona horaria IANA actual (${tz}), así que el horario de verano se refleja automáticamente cuando ${country} lo observa.</p>
          </details>
          <details class="faq group glass-card rounded-lg overflow-hidden">
            <summary class="cursor-pointer list-none marker:hidden [&amp;::-webkit-details-marker]:hidden p-4 flex justify-between items-center gap-3 text-sm font-medium text-zinc-300"><span>¿Cuándo cambian los relojes en ${name}?</span><span class="text-lg leading-none text-zinc-500 group-open:rotate-45 transition-transform duration-300 shrink-0">+</span></summary>
            <p class="px-4 pb-4 text-sm text-zinc-500 leading-relaxed">${dst}</p>
          </details>
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

function cityPage(c, hasEs) {
  const name = esc(c.name), country = esc(c.country), tz = esc(c.tz);
  const tzLabel = tzLabelOf(tz);
  const dst = dstSentence(name, c.tz);
  const esAlt = hasEs
    ? `\n    <link rel="alternate" hreflang="en" href="${SITE}/time/${c.slug}" />\n    <link rel="alternate" hreflang="es" href="${SITE}/es/time/${c.slug}" />\n    <link rel="alternate" hreflang="x-default" href="${SITE}/time/${c.slug}" />`
    : '';
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
    <meta name="robots" content="index, follow" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${SITE}/time/${c.slug}" />${esAlt}
    <meta name="ct-city" content="${name}" />
    <meta name="ct-country" content="${country}" />
    <meta name="ct-tz" content="${tz}" />
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
          { "@type": "Question", "name": "What time zone is ${name} in?", "acceptedAnswer": { "@type": "Answer", "text": "${name} is in the ${tz} time zone. The live clock above shows its current UTC offset, which already accounts for daylight saving time where it applies." } },
          { "@type": "Question", "name": "Does ${name} observe daylight saving time?", "acceptedAnswer": { "@type": "Answer", "text": "The times shown for ${name} use its current IANA time zone (${tz}), so daylight saving is reflected automatically whenever ${country} observes it." } },
          { "@type": "Question", "name": "When do the clocks change in ${name}?", "acceptedAnswer": { "@type": "Answer", "text": "${dst}" } }
        ]
      }
    </script>
    ${breadcrumb([{ name: 'Home', path: '/' }, { name: 'All cities', path: '/time' }, { name: `Time in ${c.name}`, path: `/time/${c.slug}` }])}
  </head>
  <body class="min-h-screen antialiased relative overflow-x-hidden selection:bg-blue-500/30 selection:text-white">
    <main class="relative z-10 flex flex-col items-center px-4 sm:px-6 pt-20 pb-28">
      <header class="max-w-2xl w-full text-center flex flex-col items-center mb-10 reveal">
        ${LOGO}
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
          <p>${name} follows the <strong class="text-zinc-200">${tz}</strong> time zone. Its offset from Coordinated Universal Time (UTC) changes when daylight saving time is in effect, so the live clock above always shows the real local time right now.</p>
          <p><strong class="text-zinc-200">Daylight saving:</strong> ${dst}</p>
          <p>To plan a call or event across zones, compare ${name} with other cities in the list above, browse every offset on the <a href="/time-zone-map" class="text-blue-400 hover:text-blue-300 transition-colors">interactive time zone map</a>, or turn any moment into a shareable code with the <a href="/discord-timestamp-generator" class="text-blue-400 hover:text-blue-300 transition-colors">Discord timestamp generator</a>.</p>
        </div>
      </section>

      <section class="max-w-2xl w-full mx-auto mb-14 reveal">
        <h2 class="text-xl font-semibold text-white mb-5 text-center">Frequently asked questions</h2>
        <div class="space-y-3">
          <details class="faq group glass-card rounded-lg overflow-hidden">
            <summary class="cursor-pointer list-none marker:hidden [&amp;::-webkit-details-marker]:hidden p-4 flex justify-between items-center gap-3 text-sm font-medium text-zinc-300"><span>What time zone is ${name} in?</span><span class="text-lg leading-none text-zinc-500 group-open:rotate-45 transition-transform duration-300 shrink-0">+</span></summary>
            <p class="px-4 pb-4 text-sm text-zinc-500 leading-relaxed">${name} is in the ${tz} time zone. The live clock shows its current UTC offset, which already accounts for daylight saving where it applies.</p>
          </details>
          <details class="faq group glass-card rounded-lg overflow-hidden">
            <summary class="cursor-pointer list-none marker:hidden [&amp;::-webkit-details-marker]:hidden p-4 flex justify-between items-center gap-3 text-sm font-medium text-zinc-300"><span>Does ${name} observe daylight saving time?</span><span class="text-lg leading-none text-zinc-500 group-open:rotate-45 transition-transform duration-300 shrink-0">+</span></summary>
            <p class="px-4 pb-4 text-sm text-zinc-500 leading-relaxed">The times shown use the current IANA time zone (${tz}), so daylight saving is reflected automatically whenever ${country} observes it.</p>
          </details>
          <details class="faq group glass-card rounded-lg overflow-hidden">
            <summary class="cursor-pointer list-none marker:hidden [&amp;::-webkit-details-marker]:hidden p-4 flex justify-between items-center gap-3 text-sm font-medium text-zinc-300"><span>When do the clocks change in ${name}?</span><span class="text-lg leading-none text-zinc-500 group-open:rotate-45 transition-transform duration-300 shrink-0">+</span></summary>
            <p class="px-4 pb-4 text-sm text-zinc-500 leading-relaxed">${dst}</p>
          </details>
        </div>
      </section>

      ${footer}
    </main>
    <script type="module" src="/src/city-page.tsx"></script>
  </body>
</html>
`;
}

function comparePage(a, b) {
  const an = esc(a.name), bn = esc(b.name), atz = esc(a.tz), btz = esc(b.tz);
  const slug = `${a.slug}-to-${b.slug}`;
  return `<!DOCTYPE html>
<html lang="en" class="dark scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#09090b" />
    <title>${an} to ${bn} Time Difference &amp; Converter | ChronoMap</title>
    <meta name="description" content="Time difference between ${an} and ${bn}. See the current local time in both cities side by side, how many hours apart they are, and convert any time from ${an} to ${bn}." />
    <meta name="keywords" content="${a.name} to ${b.name} time, time difference ${a.name} ${b.name}, ${a.name} ${b.name} time converter, what time is it in ${b.name} when it is in ${a.name}" />
    <meta name="robots" content="index, follow" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${SITE}/time/${slug}" />
    <meta name="ct-a-city" content="${an}" />
    <meta name="ct-a-tz" content="${atz}" />
    <meta name="ct-b-city" content="${bn}" />
    <meta name="ct-b-tz" content="${btz}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE}/time/${slug}" />
    <meta property="og:title" content="${an} to ${bn} Time Difference" />
    <meta property="og:description" content="Current time in ${an} and ${bn} side by side, with the exact time difference." />
    <meta property="og:image" content="https://www.chronomap.top/og.png" />
    ${HEAD_FONTS}
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "What is the time difference between ${an} and ${bn}?", "acceptedAnswer": { "@type": "Answer", "text": "The live tool above shows the current time in both ${an} (${atz}) and ${bn} (${btz}) and the exact difference in hours, which already accounts for daylight saving time on either side." } },
          { "@type": "Question", "name": "How do I convert a time from ${an} to ${bn}?", "acceptedAnswer": { "@type": "Answer", "text": "Read the current time in ${an} and ${bn} from the two clocks above, or pin both cities on the interactive ChronoMap world clock to convert any specific time between them." } }
        ]
      }
    </script>
    ${breadcrumb([{ name: 'Home', path: '/' }, { name: 'All cities', path: '/time' }, { name: `${a.name} to ${b.name}`, path: `/time/${slug}` }])}
  </head>
  <body class="min-h-screen antialiased relative overflow-x-hidden selection:bg-blue-500/30 selection:text-white">
    <main class="relative z-10 flex flex-col items-center px-4 sm:px-6 pt-20 pb-28">
      <header class="max-w-2xl w-full text-center flex flex-col items-center mb-10 reveal">
        ${LOGO}
        <h1 class="text-4xl sm:text-5xl md:text-[52px] leading-[1.08] font-semibold tracking-tight text-shimmer mb-4">${an} to ${bn} Time</h1>
        <p class="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl">The current time difference between ${an} and ${bn}, live. See both clocks side by side below, or open the full <a href="/" class="text-blue-400 hover:text-blue-300 transition-colors">world clock map</a>.</p>
      </header>

      <div class="w-full max-w-2xl mx-auto mb-14 reveal" style="animation-delay:.1s" id="compare-app">
        <div class="glass-panel rounded-2xl p-8 text-center text-zinc-500">Loading live times for ${an} and ${bn}…</div>
      </div>

      <section class="max-w-2xl w-full mx-auto mb-14 reveal glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none"></div>
        <h2 class="text-xl font-semibold text-white mb-4 relative z-10">${an} and ${bn} time difference</h2>
        <div class="space-y-4 text-sm text-zinc-400 leading-relaxed relative z-10">
          <p>${an} follows the <strong class="text-zinc-200">${atz}</strong> time zone and ${bn} follows <strong class="text-zinc-200">${btz}</strong>. The gap between them shifts across the year as each city enters or leaves daylight saving time, so the live clocks above always show the real current difference.</p>
          <p>Need to convert a specific time? Pin both cities on the <a href="/time-zone-map" class="text-blue-400 hover:text-blue-300 transition-colors">interactive time zone map</a>, or turn a moment into a code everyone reads in their own zone with the <a href="/discord-timestamp-generator" class="text-blue-400 hover:text-blue-300 transition-colors">Discord timestamp generator</a>.</p>
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

function timeIndexPage(cities, pairs) {
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

  const cmpHtml = pairs
    .map(([a, b]) => `<a href="/time/${a.slug}-to-${b.slug}" class="text-sm text-zinc-400 hover:text-blue-300 transition-colors py-1 truncate">${esc(a.name)} → ${esc(b.name)}</a>`)
    .join('\n          ');

  return `<!DOCTYPE html>
<html lang="en" class="dark scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#09090b" />
    <title>World Clock — Current Time in Cities Around the World | ChronoMap</title>
    <meta name="description" content="Find the current local time in any major city. Browse or search ${cities.length}+ cities worldwide and popular time-zone comparisons, with live clocks and UTC offsets." />
    <meta name="keywords" content="world clock, current time in cities, local time by city, time zone by city, city time list" />
    <meta name="robots" content="index, follow" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="canonical" href="${SITE}/time" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE}/time" />
    <meta property="og:title" content="World Clock — Current Time in Cities Around the World" />
    <meta property="og:description" content="Browse or search current local time in ${cities.length}+ cities worldwide." />
    <meta property="og:image" content="https://www.chronomap.top/og.png" />
    ${HEAD_FONTS}
    ${breadcrumb([{ name: 'Home', path: '/' }, { name: 'All cities', path: '/time' }])}
  </head>
  <body class="min-h-screen antialiased relative overflow-x-hidden selection:bg-blue-500/30 selection:text-white">
    <main class="relative z-10 flex flex-col items-center px-4 sm:px-6 pt-20 pb-28">
      <header class="max-w-2xl w-full text-center flex flex-col items-center mb-10 reveal">
        ${LOGO}
        <h1 class="text-4xl sm:text-5xl md:text-[52px] leading-[1.08] font-semibold tracking-tight text-shimmer mb-4">World Clock by City</h1>
        <p class="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl mb-6">The current local time in cities around the world. Search a city to jump to its live clock, or open the full <a href="/" class="text-blue-400 hover:text-blue-300 transition-colors">world clock map</a>.</p>
        <input id="city-search" type="search" placeholder="Search a city…" autocomplete="off" class="w-full max-w-sm bg-zinc-800/60 text-zinc-100 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all" />
      </header>

      <section class="max-w-4xl w-full mx-auto mb-14 reveal">
        <div id="city-groups" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${regionsHtml}
        </div>
        <p id="no-results" class="hidden text-center text-zinc-500 text-sm mt-8">No city matches your search.</p>
      </section>

      <section class="max-w-4xl w-full mx-auto mb-14 reveal">
        <h2 class="text-xl font-semibold text-white mb-5 text-center">Popular time comparisons</h2>
        <div class="glass-panel rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4">
          ${cmpHtml}
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
  const today = new Date().toISOString().slice(0, 10);
  mkdirSync(filePath('time'), { recursive: true });
  mkdirSync(filePath('es/time'), { recursive: true });

  const entries = [];

  for (const c of cities) {
    const es = ES_CITY[c.slug];
    writeFileSync(filePath(`time/${c.slug}.html`), cityPage(c, !!es));
    entries.push({ name: `time-${c.slug}`, file: filePath(`time/${c.slug}.html`) });
    if (es) {
      writeFileSync(filePath(`es/time/${c.slug}.html`), cityPageEs(c, es));
      entries.push({ name: `es-time-${c.slug}`, file: filePath(`es/time/${c.slug}.html`) });
    }
  }

  // Directional comparators among the top cities (a≠b).
  const top = cities.slice(0, PAIR_COUNT);
  const pairs = [];
  for (const a of top) for (const b of top) if (a.slug !== b.slug) pairs.push([a, b]);
  for (const [a, b] of pairs) {
    const slug = `${a.slug}-to-${b.slug}`;
    writeFileSync(filePath(`time/${slug}.html`), comparePage(a, b));
    entries.push({ name: `cmp-${slug}`, file: filePath(`time/${slug}.html`) });
  }

  // Index/hub page served at /time — search + links to every city and comparison.
  // time/index.html so it coexists with the time/{slug}.html pages; Vercel's
  // cleanUrls serves it at /time.
  writeFileSync(filePath('time/index.html'), timeIndexPage(cities, pairs));
  entries.push({ name: 'time-index', file: filePath('time/index.html') });

  const urls = [
    { loc: `${SITE}/`, pri: '1.0', freq: 'weekly' },
    { loc: `${SITE}/es`, pri: '0.9', freq: 'weekly' },
    { loc: `${SITE}/es/time-zone-map`, pri: '0.8', freq: 'weekly' },
    { loc: `${SITE}/es/meeting-planner`, pri: '0.7', freq: 'monthly' },
    { loc: `${SITE}/es/discord-timestamp-generator`, pri: '0.7', freq: 'monthly' },
    { loc: `${SITE}/time`, pri: '0.9', freq: 'weekly' },
    { loc: `${SITE}/time-zone-map`, pri: '0.9', freq: 'weekly' },
    { loc: `${SITE}/discord-timestamp-generator`, pri: '0.8', freq: 'monthly' },
    { loc: `${SITE}/meeting-planner`, pri: '0.8', freq: 'monthly' },
    { loc: `${SITE}/windows`, pri: '0.7', freq: 'monthly' },
    ...cities.map((c) => ({ loc: `${SITE}/time/${c.slug}`, pri: '0.7', freq: 'weekly' })),
    ...cities.filter((c) => ES_CITY[c.slug]).map((c) => ({ loc: `${SITE}/es/time/${c.slug}`, pri: '0.6', freq: 'weekly' })),
    ...pairs.map(([a, b]) => ({ loc: `${SITE}/time/${a.slug}-to-${b.slug}`, pri: '0.6', freq: 'weekly' })),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>
  </url>`).join('\n')}
</urlset>
`;
  writeFileSync(filePath('public/sitemap.xml'), sitemap);
  console.log(`[gen-city-pages] ${cities.length} cities + ${pairs.length} comparators, sitemap ${urls.length} urls.`);
  return entries;
}

// Run when invoked directly: node scripts/gen-city-pages.mjs
if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  generate();
}
