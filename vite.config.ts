import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

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
      },
    },
  }
});