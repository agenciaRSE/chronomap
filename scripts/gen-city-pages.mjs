// Generates a static, crawlable HTML page per city under time/{slug}.html from
// src/cities.json, plus a matching public/sitemap.xml. Called from vite.config
// (so it runs at the start of every `vite build`, regardless of the build
// command) and runnable directly (`node scripts/gen-city-pages.mjs`). Each page
// ships real SEO content as static HTML; the live clock is a React island
// (src/city-page.tsx) that reads the ct-* meta tags. Scaling = add JSON rows.
import { readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';

const root = new URL('..', import.meta.url);
const SITE = 'https://www.chronomap.top';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const LOGO = `<a href="/" class="inline-flex items-center gap-3 mb-8 group shrink-0">
      <span class="relative w-8 h-8 flex items-center justify-center shrink-0">
        <span class="absolute inset-0 rounded-full border-[1.5px] border-zinc-700/50 animate-[spin_12s_linear_infinite]"></span>
        <span class="absolute inset-1 rounded-full border-[1.5px] border-blue-500/80 border-t-transparent animate-[spin_8s_linear_infinite_reverse]"></span>
        <span class="w-2 h-2 rounded-full bg-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.9)]"></span>
      </span>
      <span class="text-[20px] font-semibold tracking-tight text-white group-hover:text-blue-400 transition-colors">ChronoMap</span>
    </a>`;

function page(c) {
  const name = esc(c.name), country = esc(c.country), tz = esc(c.tz);
  const tzLabel = tz.split('/').pop().replace(/_/g, ' ');
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
    <link rel="canonical" href="${SITE}/time/${c.slug}" />
    <meta name="ct-city" content="${name}" />
    <meta name="ct-country" content="${country}" />
    <meta name="ct-tz" content="${tz}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE}/time/${c.slug}" />
    <meta property="og:title" content="Current Time in ${name} — Live Local Time" />
    <meta property="og:description" content="Live local time in ${name}, ${country} (${tz}), with comparisons to major world cities." />
    <meta property="og:image" content="https://agenciarse.com/wp-content/uploads/2025/11/screenshot-desktop.jpg" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;700&display=swap" rel="stylesheet">
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "What time zone is ${name} in?", "acceptedAnswer": { "@type": "Answer", "text": "${name} is in the ${tz} time zone. The live clock above shows its current UTC offset, which already accounts for daylight saving time where it applies." } },
          { "@type": "Question", "name": "Does ${name} observe daylight saving time?", "acceptedAnswer": { "@type": "Answer", "text": "The times shown for ${name} use its current IANA time zone (${tz}), so daylight saving is reflected automatically whenever ${country} observes it." } },
          { "@type": "Question", "name": "How do I compare ${name} time with another city?", "acceptedAnswer": { "@type": "Answer", "text": "The comparison list shows the current time in major world cities alongside ${name}. For any two places, use the interactive ChronoMap world clock to pin and compare them." } }
        ]
      }
    </script>
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
        </div>
      </section>

      <footer class="w-full text-center mt-2 reveal">
        <div class="flex flex-col items-center gap-5">
          <a href="/" class="inline-flex items-center gap-2 group">
            <span class="relative w-6 h-6 flex items-center justify-center shrink-0">
              <span class="absolute inset-0 rounded-full border border-zinc-700"></span>
              <span class="absolute inset-0.5 rounded-full border border-blue-500/60 border-t-transparent"></span>
              <span class="w-1 h-1 rounded-full bg-white/50"></span>
            </span>
            <span class="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">ChronoMap</span>
          </a>
          <nav class="flex items-center gap-6 text-[13px] text-zinc-500">
            <a href="/" class="hover:text-zinc-300 transition-colors">World clock map</a>
            <a href="/time-zone-map" class="hover:text-zinc-300 transition-colors">Time zone map</a>
            <a href="/discord-timestamp-generator" class="hover:text-zinc-300 transition-colors">Discord timestamps</a>
          </nav>
        </div>
      </footer>
    </main>
    <script type="module" src="/src/city-page.tsx"></script>
  </body>
</html>
`;
}

export function generate() {
  const cities = JSON.parse(readFileSync(new URL('src/cities.json', root), 'utf8'));
  const today = new Date().toISOString().slice(0, 10);

  mkdirSync(fileURLToPath(new URL('time', root)), { recursive: true });
  for (const c of cities) {
    writeFileSync(fileURLToPath(new URL(`time/${c.slug}.html`, root)), page(c));
  }

  const urls = [
    { loc: `${SITE}/`, pri: '1.0', freq: 'weekly' },
    { loc: `${SITE}/time-zone-map`, pri: '0.9', freq: 'weekly' },
    { loc: `${SITE}/discord-timestamp-generator`, pri: '0.8', freq: 'monthly' },
    ...cities.map((c) => ({ loc: `${SITE}/time/${c.slug}`, pri: '0.7', freq: 'weekly' })),
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
  writeFileSync(fileURLToPath(new URL('public/sitemap.xml', root)), sitemap);
  console.log(`[gen-city-pages] ${cities.length} city pages + sitemap (${urls.length} urls).`);
  return cities;
}

// Run when invoked directly: node scripts/gen-city-pages.mjs
if (argv[1] && realpathSync(argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  generate();
}
