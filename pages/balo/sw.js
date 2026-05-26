const CACHE = 'balo-v1';
const STATIC = [
  './',
  './index.html',
  './reservas.html',
  './manifest.json',
  './img/hotel-balo1.jpg',
  './img/hotel-balo2.jpg',
  './img/hotel-balo3.jpg',
  './img/hotel-balo4.jpg'
];
const JSON_FILES = ['./hotel.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Network-first para hotel.json (datos dinámicos)
  if (JSON_FILES.some(f => url.includes(f.replace('./', '')))) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first para assets estáticos
  e.respondWith(
    caches.match(e.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (!res || res.status !== 200 || res.type !== 'basic') return res;
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        });
      })
  );
});
