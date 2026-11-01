/**
 * firebase-init.js — config de Firebase de "Invitame un café" (la usan
 * gracias.html y panel.html). Esta página es REAL: no hay mock. Julian crea el
 * proyecto y reemplaza los TODO_REEMPLAZAR; mientras tanto FIREBASE_LISTO es
 * false y las páginas lo avisan sin romperse.
 * El navegador solo LEE (get del aporte por código; list para el staff
 * logueado). Nunca escribe: eso lo hace el Worker.
 */
const FIREBASE_CONFIG = {
  apiKey: 'TODO_REEMPLAZAR',
  authDomain: 'TODO_REEMPLAZAR',
  projectId: 'TODO_REEMPLAZAR',
  storageBucket: 'TODO_REEMPLAZAR',
  messagingSenderId: 'TODO_REEMPLAZAR',
  appId: 'TODO_REEMPLAZAR',
};
const FIREBASE_LISTO = !Object.values(FIREBASE_CONFIG).some(v => /TODO/.test(v));

let db = null;
let auth = null;
if (FIREBASE_LISTO) {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    auth = firebase.auth();
  } catch (e) {
    console.error('Error inicializando Firebase:', e);
  }
}

/** Mismo alfabeto del Worker (sin 0/O/1/I); descarta cualquier otro símbolo. */
function normalizarCodigo(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
}
/** Timestamp del SDK real (toDate) o string/Date. */
function aFecha(f) {
  if (!f) return null;
  const d = f.toDate ? f.toDate() : new Date(f);
  return isNaN(d) ? null : d;
}
function escHTML(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
