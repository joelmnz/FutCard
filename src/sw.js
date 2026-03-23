const CACHE_VERSION = '__FUTCARD_SW_VERSION__';
const PRECACHE_URLS = __FUTCARD_PRECACHE_URLS__;
const CACHE_NAME = `futcard-shell-${CACHE_VERSION}`;
const FALLBACK_URL = new URL('./index.html', self.location).href;
const PRECACHE_URL_SET = new Set(PRECACHE_URLS.map((path) => new URL(path, self.location).href));

async function cachePrecacheAssets() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(PRECACHE_URLS);
}

async function cacheFirst(request, event) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    })());
  }

  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(cachePrecacheAssets());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith('futcard-shell-') && cacheName !== CACHE_NAME)
        .map((cacheName) => caches.delete(cacheName)),
    );

    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(FALLBACK_URL, networkResponse.clone());
        return networkResponse;
      } catch {
        const cached = await caches.match(FALLBACK_URL);
        if (cached) return cached;
        return new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    })());
    return;
  }

  if (PRECACHE_URL_SET.has(url.href)) {
    event.respondWith(cacheFirst(request, event));
  }
});