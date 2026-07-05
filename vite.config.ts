import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// @ts-ignore — plain .mjs generator, no types needed
import { generate } from './scripts/gen-city-pages.mjs';

// Generate the per-city + comparator pages (and sitemap) before Vite resolves
// the MPA inputs, so they exist regardless of the build command Vercel runs.
// generate() returns the [{ name, file }] entry list for the extra pages.
const generatedPages: { name: string; file: string }[] = generate();
const generatedInputs = Object.fromEntries(generatedPages.map((p) => [p.name, p.file]));

// IndexNow: after each PRODUCTION build, notify Bing/Yandex of all URLs so the
// ~200 pages get crawled promptly. Ownership is proven by public/<key>.txt.
// Runs in closeBundle so it fires whether Vercel runs `vite build` or the npm
// script; gated to VERCEL_ENV=production so previews/local don't ping.
const INDEXNOW_KEY = '6b1f0a9c7d3e42588a0c5f4b2e9d17c3';
function indexNowPlugin() {
  return {
    name: 'indexnow-ping',
    async closeBundle() {
      if (process.env.VERCEL_ENV !== 'production') return;
      try {
        const sitemap = readFileSync(fileURLToPath(new URL('./public/sitemap.xml', import.meta.url)), 'utf8');
        const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
        const res = await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            host: 'www.chronomap.top',
            key: INDEXNOW_KEY,
            keyLocation: `https://www.chronomap.top/${INDEXNOW_KEY}.txt`,
            urlList,
          }),
        });
        console.log(`[indexnow] pinged ${urlList.length} urls -> ${res.status}`);
      } catch (e) {
        console.warn('[indexnow] ping failed (non-fatal):', String(e));
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    indexNowPlugin(),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // No inline modulepreload polyfill → keeps a strict `script-src 'self'` CSP
    // working without 'unsafe-inline'. Modern browsers support modulepreload.
    modulePreload: { polyfill: false },
    // Multi-page: the SPA (index.html) + standalone SEO pages that ship real
    // indexable HTML (e.g. the Discord timestamp generator).
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        home_es: fileURLToPath(new URL('./es/index.html', import.meta.url)),
        tzmap_es: fileURLToPath(new URL('./es/time-zone-map.html', import.meta.url)),
        discord_es: fileURLToPath(new URL('./es/discord-timestamp-generator.html', import.meta.url)),
        planner_es: fileURLToPath(new URL('./es/meeting-planner.html', import.meta.url)),
        discord: fileURLToPath(new URL('./discord-timestamp-generator.html', import.meta.url)),
        tzmap: fileURLToPath(new URL('./time-zone-map.html', import.meta.url)),
        windows: fileURLToPath(new URL('./windows.html', import.meta.url)),
        planner: fileURLToPath(new URL('./meeting-planner.html', import.meta.url)),
        embed: fileURLToPath(new URL('./embed.html', import.meta.url)),
        clockwidget: fileURLToPath(new URL('./clock-widget.html', import.meta.url)),
        clockwidget_es: fileURLToPath(new URL('./es/clock-widget.html', import.meta.url)),
        flight: fileURLToPath(new URL('./flight-time-calculator.html', import.meta.url)),
        flight_es: fileURLToPath(new URL('./es/flight-time-calculator.html', import.meta.url)),
        jetlag: fileURLToPath(new URL('./jet-lag-calculator.html', import.meta.url)),
        jetlag_es: fileURLToPath(new URL('./es/jet-lag-calculator.html', import.meta.url)),
        route: fileURLToPath(new URL('./flight-route-map.html', import.meta.url)),
        route_es: fileURLToPath(new URL('./es/flight-route-map.html', import.meta.url)),
        notfound: fileURLToPath(new URL('./404.html', import.meta.url)),
        ...generatedInputs,
      },
    },
  }
});