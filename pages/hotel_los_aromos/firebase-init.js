/**
 * firebase-init.js — config ÚNICA de Firebase de Hotel Los Aromos. La cargan
 * reservas.html y recepcion.html DESPUÉS del loader inline que decide entre
 * firestore-mock.js y los SDKs reales (y que define `const DEMO`).
 *
 * Hotel Los Aromos es un negocio FICTICIO (demo del módulo Hotel): no hay
 * proyecto Firebase real, y `DEMO = true` hace que use siempre el mock
 * (localStorage), también en GitHub Pages. `projectId` único por cliente: es
 * el prefijo de las keys del mock (`mockdb:TODO_REEMPLAZAR-hotel-los-aromos:*`).
 */
const FIREBASE_CONFIG = {
  apiKey: 'TODO_REEMPLAZAR',
  authDomain: 'TODO_REEMPLAZAR',
  projectId: 'TODO_REEMPLAZAR-hotel-los-aromos',
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

/**
 * Solo DEMO: la primera vez que alguien abre la demo en su navegador, carga un
 * par de reservas de ejemplo (huéspedes inventados) para que la recepción no
 * arranque vacía y el calendario muestre fechas ocupadas. Una sola vez por
 * navegador (flag en localStorage).
 */
const DEMO_SEED_READY = (async function sembrarDemo() {
  if (typeof DEMO === 'undefined' || !DEMO || !db) return;
  const FLAG = 'hla_demo_seed_v1';
  try { if (localStorage.getItem(FLAG)) return; } catch (e) { return; }
  const dia = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const ejemplos = [
    { nombre: 'Huésped de ejemplo 1', telefono: '2244 00-0001', habitacion_id: 2, habitacion_tipo: 'Doble', checkin: dia(0), checkout: dia(2), noches: 2, huespedes: 2, nota: 'Llegada a la tarde', estado: 'confirmada' },
    { nombre: 'Huésped de ejemplo 2', telefono: '2244 00-0002', habitacion_id: 1, habitacion_tipo: 'Simple', checkin: dia(-2), checkout: dia(0), noches: 2, huespedes: 1, nota: '', estado: 'hospedado' },
    { nombre: 'Huésped de ejemplo 3', telefono: '2244 00-0003', habitacion_id: 3, habitacion_tipo: 'Doble Superior', checkin: dia(5), checkout: dia(8), noches: 3, huespedes: 3, nota: 'Viajan con una cuna', estado: 'confirmada' },
  ];
  try {
    for (const r of ejemplos) {
      await db.collection('reservas').add({
        ...r,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        orden: Date.now(),
      });
    }
    localStorage.setItem(FLAG, '1');
  } catch (e) {
    console.warn('No se pudieron cargar las reservas de ejemplo:', e);
  }
})();
