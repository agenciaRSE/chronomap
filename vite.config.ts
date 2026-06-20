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
    modulePreload: { polyfill: false }
  }
});