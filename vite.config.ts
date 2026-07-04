import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// @ts-ignore — plain .mjs generator, no types needed
import { generate } from './scripts/gen-city-pages.mjs';

// Generate per-city pages (time/{slug}.html) + sitemap before Vite resolves the
// MPA inputs, so they exist regardless of the build command Vercel runs.
generate();
// One indexable page per city (time/{slug}.html). Each becomes a Vite MPA entry.
const cities: { slug: string }[] = JSON.parse(
  readFileSync(new URL('./src/cities.json', import.meta.url), 'utf8')
);
const cityInputs = Object.fromEntries(
  cities.map((c) => [`time-${c.slug}`, fileURLToPath(new URL(`./time/${c.slug}.html`, import.meta.url))])
);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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
        discord: fileURLToPath(new URL('./discord-timestamp-generator.html', import.meta.url)),
        tzmap: fileURLToPath(new URL('./time-zone-map.html', import.meta.url)),
        ...cityInputs,
      },
    },
  }
});