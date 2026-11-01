/**
 * pagos-config.js — URL del Worker de pagos (lfs-pagos). ÚNICO lugar donde se
 * define. Mientras tenga TODO, la página muestra "Muy pronto" en vez del botón.
 * Sandbox: https://lfs-pagos-sandbox.<sub>.workers.dev (CORS permite localhost:4173).
 */
const WORKER_URL = 'TODO_WORKER_URL';
const WORKER_LISTO = !/TODO/.test(WORKER_URL);
