// Gauras Mart service worker (Next.js).
// - Never cache API or Next data calls (always fresh auth/data).
// - JS/CSS: network-first (so deploys are never stale).
// - Navigations: network-first, fall back to cache, then sign-in.
// - Other static assets: cache-first.
const CACHE = 'gauras-next-v1';
const PRECACHE = ['/sign-in', '/register', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Never intercept API or Next internals.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')) return;

  // Navigations: network-first.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(request).then((r) => r || caches.match('/sign-in')))
    );
    return;
  }

  // JS/CSS (incl. /_next/static chunks): network-first so code is never stale.
  if (/\.(js|css)$/i.test(url.pathname) || url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      fetch(request).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // Other static (images, fonts, manifest): cache-first.
  event.respondWith(
    caches.match(request).then((cached) =>
      cached || fetch(request).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached)
    )
  );
});
