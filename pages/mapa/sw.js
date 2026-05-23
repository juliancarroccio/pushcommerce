const CACHE = 'mapa-v1';
const STATIC = ['./', './index.html', './artistas.html', './artista.html', './manifest.json', './img/site/logo.png', './img/hero/hero.jpg'];
const JSON_FILES = ['./artistas.json'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC))));
self.addEventListener('fetch', e => {
  if (JSON_FILES.some(f => e.request.url.includes(f))) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
