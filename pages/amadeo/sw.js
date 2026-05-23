const CACHE = 'amadeo-v1';
const STATIC = [
  './',
  './index.html',
  './tienda.html',
  './manifest.json',
  './img/favicon.png',
  './img/logo.png',
  './img/hero.jpg',
  './img/interior.jpg',
  './img/productos.jpg'
];
const JSON_FILES = ['./productos.json'];

self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)))
);

self.addEventListener('fetch', e => {
  if (JSON_FILES.some(f => e.request.url.includes(f))) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
