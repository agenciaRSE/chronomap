// Minimal service worker: network-only, with an offline fallback page for navigations.
// It caches nothing but offline.html, so it can never serve stale app assets.
const CACHE = 'chronomap-offline-v1';
const OFFLINE_URL = '/offline'; // cleanUrls on Vercel serves offline.html here; '.html' would 308-redirect

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Drop caches left by any older service worker on this origin.
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});
