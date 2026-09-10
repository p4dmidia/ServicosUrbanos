// Service Worker for PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// IMPORTANT: Do NOT intercept cross-origin API requests (e.g. Supabase, external APIs)
// Calling event.respondWith(fetch(event.request)) on cross-origin requests causes CORS failures,
// promise rejections, and extreme network timeouts.
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
});
