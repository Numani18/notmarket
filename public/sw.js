// Minimal service worker — PWA "kurulabilir" olsun diye.
// Agresif önbellek yapmaz; istekleri doğrudan ağa geçirir (içerik hep güncel).
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => new Response('', { status: 504 })))
})
