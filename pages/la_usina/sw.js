// v2: al cambiar el nombre del cache, `activate` borra el v1 (que tenía
// agenda.html y firestore-mock.js viejos guardados cache-first).
const CACHE = 'la-usina-v2';
const PRECACHE = [
  './',
  './index.html',
  './menu.html',
  './404.html',
  './manifest.json',
  './img/favicon-32.png',
  './img/favicon-180.png',
  './img/logo.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function networkFirst(req) {
  return fetch(req, { cache: 'no-cache' })
    .then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
      }
      return res;
    })
    .catch(() => caches.match(req));
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  const path = new URL(e.request.url).pathname;
  // Network-first para JSON (carta/horarios/evento), HTML y JS: así un deploy
  // nuevo (páginas, mock, cores) llega siempre; el cache queda solo como
  // respaldo offline.
  if (e.request.mode === 'navigate' || /\.(json|html|js)$/.test(path) || path.endsWith('/')) {
    e.respondWith(networkFirst(e.request));
    return;
  }
  // Cache-first para estáticos (imágenes, íconos)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
