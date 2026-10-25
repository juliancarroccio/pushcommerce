/**
 * firebase-init.js — config ÚNICA de Firebase de La Usina (panel-unico.md,
 * firestore-setup-guide.md §1.4). La cargan agenda, seguimiento, evento,
 * mi-entrada, validar y portal, DESPUÉS del loader inline que decide entre
 * firestore-mock.js y los SDKs reales (y que define `const DEMO`).
 *
 * La Usina es un cliente DEMO inventado: nunca se creó el proyecto Firebase
 * real, y `DEMO = true` hace que use siempre el mock (localStorage), también
 * en GitHub Pages. `projectId` único por cliente (local-db-testing.md): es el
 * prefijo de las keys del mock (`mockdb:TODO_REEMPLAZAR-la-usina:*`).
 */
const FIREBASE_CONFIG = {
  apiKey: 'TODO_REEMPLAZAR',
  authDomain: 'TODO_REEMPLAZAR',
  projectId: 'TODO_REEMPLAZAR-la-usina',
  storageBucket: 'TODO_REEMPLAZAR',
  messagingSenderId: 'TODO_REEMPLAZAR',
  appId: 'TODO_REEMPLAZAR',
};

let db = null;
try {
  firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.firestore();
} catch (e) {
  console.error('Error inicializando Firebase/mock:', e);
}

/** Códigos con crypto (firestore-setup-guide.md §2.6): 32 símbolos, sin 0/O/1/I. */
const CODIGO_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCodigo(len) {
  const buf = new Uint32Array(len);
  crypto.getRandomValues(buf); // 2^32 es múltiplo de 32 → sin sesgo de módulo
  return Array.from(buf, v => CODIGO_CHARS[v % CODIGO_CHARS.length]).join('');
}
/**
 * Normaliza lo que tipea/escanea la gente: mayúsculas, sin espacios ni
 * guiones (ni nada que no sea alfanumérico — un '/' rompería el path del doc).
 */
function normalizarCodigo(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
}
/** serverTimestamp(): Timestamp en el SDK real, string ISO en el mock. */
function aFecha(f) {
  if (!f) return null;
  const d = f.toDate ? f.toDate() : new Date(f);
  return isNaN(d) ? null : d;
}
function escHTML(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
