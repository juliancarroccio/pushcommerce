/**
 * firestore-mock.js — reemplaza el namespace global `firebase` por una
 * implementación en localStorage, para probar el flujo E2E en local SIN
 * instalar firebase-tools, sin loguearse, sin crear ningún proyecto.
 *
 * Se carga EN VEZ de los SDKs reales de Firebase (no junto a ellos) cuando
 * se está en localhost — ver snippet de carga condicional en
 * references/local-db-testing.md. Implementa el subconjunto de la API
 * compat de Firestore/Auth que usan los HTML generados por esta skill:
 * collection().add/doc/where/limit/onSnapshot, doc().update/get/set,
 * firebase.firestore.FieldValue.serverTimestamp(), auth().signInAnonymously.
 *
 * Persistencia: localStorage, una key por colección, prefijada con el
 * projectId pasado a initializeApp (para no mezclar datos entre clientes
 * de prueba distintos servidos desde el mismo localhost). Sincroniza entre
 * pestañas con el evento nativo `storage` del navegador — así un pedido
 * hecho en tienda.html (una pestaña) aparece solo en pedidos.html (otra
 * pestaña), igual que con Firestore real.
 */
(function () {
  let PREFIX = 'mockdb';
  const listeners = {}; // collectionName -> Set<fn>

  function key(col) { return `${PREFIX}:${col}`; }
  function readCol(col) {
    try { return JSON.parse(localStorage.getItem(key(col)) || '{}'); }
    catch { return {}; }
  }
  function writeCol(col, data) {
    localStorage.setItem(key(col), JSON.stringify(data));
    notify(col);
  }
  function notify(col) {
    (listeners[col] || new Set()).forEach(fn => fn());
  }
  function genId() {
    return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
  function resolveServerValues(data) {
    const out = {};
    for (const k in data) {
      out[k] = data[k] === '__SERVER_TIMESTAMP__' ? new Date().toISOString() : data[k];
    }
    return out;
  }

  function makeSnapshotDoc(id, data) {
    return { id, data: () => ({ ...data }), exists: true };
  }

  function makeQuerySnapshot(docsArr) {
    return {
      empty: docsArr.length === 0,
      size: docsArr.length,
      docs: docsArr,
      forEach(fn) { docsArr.forEach(fn); },
    };
  }

  function docRef(col, id) {
    return {
      id,
      get() {
        const all = readCol(col);
        return Promise.resolve(all[id]
          ? makeSnapshotDoc(id, all[id])
          : { id, exists: false, data: () => undefined });
      },
      set(data) {
        const all = readCol(col);
        all[id] = resolveServerValues(data);
        writeCol(col, all);
        return Promise.resolve();
      },
      update(data) {
        const all = readCol(col);
        all[id] = { ...(all[id] || {}), ...resolveServerValues(data) };
        writeCol(col, all);
        return Promise.resolve();
      },
      delete() {
        const all = readCol(col);
        delete all[id];
        writeCol(col, all);
        return Promise.resolve();
      },
    };
  }

  function subscribe(col, computeDocs, cb) {
    const run = () => cb(makeQuerySnapshot(computeDocs()));
    run();
    listeners[col] = listeners[col] || new Set();
    listeners[col].add(run);
    window.addEventListener('storage', (e) => { if (e.key === key(col)) run(); });
    return () => listeners[col].delete(run); // unsubscribe
  }

  function collectionRef(col) {
    return {
      add(data) {
        const all = readCol(col);
        const id = genId();
        all[id] = resolveServerValues(data);
        writeCol(col, all);
        return Promise.resolve(docRef(col, id));
      },
      doc(id) { return docRef(col, id || genId()); },
      onSnapshot(cb) {
        return subscribe(col, () => {
          const all = readCol(col);
          return Object.entries(all).map(([id, d]) => makeSnapshotDoc(id, d));
        }, cb);
      },
      where(field, op, value) {
        return makeQuery(col, [{ field, op, value }], Infinity);
      },
    };
  }

  function matchesAll(d, predicates) {
    return predicates.every(({ field, op, value }) => {
      switch (op) {
        case '==': return d[field] === value;
        case '!=': return d[field] !== value;
        case '>': return d[field] > value;
        case '>=': return d[field] >= value;
        case '<': return d[field] < value;
        case '<=': return d[field] <= value;
        default: return true;
      }
    });
  }

  // Encadenable: .where().where().limit().onSnapshot()/.get(), como Firestore real.
  function makeQuery(col, predicates, limitN) {
    const q = {
      where(field, op, value) {
        return makeQuery(col, [...predicates, { field, op, value }], limitN);
      },
      limit(n) { return makeQuery(col, predicates, n); },
      onSnapshot(cb) {
        return subscribe(col, () => {
          const all = readCol(col);
          return Object.entries(all)
            .filter(([, d]) => matchesAll(d, predicates))
            .slice(0, limitN)
            .map(([id, d]) => makeSnapshotDoc(id, d));
        }, cb);
      },
      get() {
        const all = readCol(col);
        const docsArr = Object.entries(all)
          .filter(([, d]) => matchesAll(d, predicates))
          .slice(0, limitN)
          .map(([id, d]) => makeSnapshotDoc(id, d));
        return Promise.resolve(makeQuerySnapshot(docsArr));
      },
    };
    return q;
  }

  window.firebase = {
    initializeApp(config) {
      PREFIX = `mockdb:${config.projectId || 'default'}`;
      console.info('[firestore-mock] usando BD local en localStorage, proyecto:', config.projectId);
    },
    firestore() {
      return { collection: collectionRef, useEmulator() {} };
    },
    auth() {
      return { signInAnonymously: () => Promise.resolve(), useEmulator() {} };
    },
  };
  window.firebase.firestore.FieldValue = {
    serverTimestamp: () => '__SERVER_TIMESTAMP__',
  };
})();
