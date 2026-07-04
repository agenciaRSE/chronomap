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
        ...generatedInputs,
      },
    },
  }
});