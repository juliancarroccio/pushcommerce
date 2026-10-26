/* sw.js estándar de PushCommerce.
 *
 * Objetivo: que NUNCA haga falta pedirle a nadie que borre la caché.
 * - HTML, JS, CSS y JSON (precios, catálogo, horarios): siempre se piden a la
 *   red, revalidando con el servidor (cache: 'no-cache' → GitHub Pages responde
 *   304 si no cambió, es liviano). La caché se usa SOLO si no hay conexión.
 * - Imágenes y fuentes: cache-first (casi nunca cambian y son lo pesado). Si se
 *   reemplaza una imagen, conviene cambiarle el nombre de archivo.
 * - Al instalarse se activa enseguida (skipWaiting + clients.claim) y borra las
 *   cachés de versiones anteriores. Si reemplaza un sw viejo, recarga una vez las
 *   pestañas abiertas: el visitante ve lo nuevo en la misma visita.
 * - En el HTML, no usar cache-busters tipo `?v=Date.now()` en los fetch de JSON:
 *   cada URL distinta queda guardada en la caché y crece sin límite. Usar
 *   `fetch('./productos.json', { cache: 'no-cache' })`.
 * - No toca nada de otros orígenes (CDNs, Firebase, Google Fonts, Analytics).
 *
 * Al copiarlo a un cliente: cambiar VERSION y PRECACHE. VERSION tiene que ser
 * distinta de la que tenía el sw.js anterior del cliente (así se limpian las
 * cachés viejas de los visitantes).
 */
const VERSION = 'pm-v2';
const PRECACHE = [
  './',
  './index.html',
  './tienda.html',
  './manifest.json',
  './img/logo.png',
  './img/logo.webp',
  './img/menu.webp',
  './img/hero.jpg',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(VERSION)
      // cache: 'reload' → baja la versión actual del servidor, no la de la caché HTTP.
      .then((c) => Promise.all(PRECACHE.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {}))))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const viejas = (await caches.keys()).filter((k) => k !== VERSION);
    await Promise.all(viejas.map((k) => caches.delete(k)));
    await self.clients.claim();
    // Si reemplaza una versión anterior, las pestañas abiertas están mostrando
    // HTML servido por el sw viejo: se recargan una vez para ver lo nuevo ya.
    // En la primera visita de alguien no hay cachés viejas y no recarga nada.
    if (viejas.length) {
      const ventanas = await self.clients.matchAll({ type: 'window' });
      ventanas.forEach((w) => w.navigate(w.url).catch(() => {}));
    }
  })());
});

function guardar(req, res) {
  if (res && res.ok && res.type === 'basic') {
    const copia = res.clone();
    caches.open(VERSION).then((c) => c.put(req, copia));
  }
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const esEstatico = ['image', 'font'].includes(req.destination) ||
    /\.(png|jpe?g|webp|gif|svg|ico|woff2?)$/i.test(url.pathname);

  if (esEstatico) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => guardar(req, res))));
    return;
  }

  // fetch(url, init) y no fetch(req, init): un Request de navegación no se puede
  // re-crear con opciones (tira TypeError).
  e.respondWith(
    fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then((res) => guardar(req, res))
      .catch(() => caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
