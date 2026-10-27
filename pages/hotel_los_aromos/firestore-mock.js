/**
 * firestore-mock.js — reemplaza el namespace global `firebase` por una
 * implementación en localStorage, para probar el flujo E2E en local SIN
 * instalar firebase-tools, sin loguearse, sin crear ningún proyecto.
 *
 * Se carga EN VEZ de los SDKs reales de Firebase (no junto a ellos) cuando
 * se está en localhost (o siempre, en clientes DEMO) — ver snippet de carga
 * condicional y la lista completa de "qué implementa / qué NO" en
 * references/local-db-testing.md.
 *
 * API compat implementada (subconjunto que usan los HTML de esta skill):
 *   firestore():  collection(path) · doc(path) · runTransaction(fn) · batch()
 *   collection:   add · doc([id]) · get · onSnapshot · where · orderBy · limit
 *   query:        where (== != < <= > >= in not-in array-contains array-contains-any)
 *                 · orderBy(campo, 'asc'|'desc') · limit · get · onSnapshot
 *   doc:          get · set(data, {merge}) · update(data | campo, valor, ...)
 *                 (dotted paths: 'variantes.M.Negro' ANIDA) · delete
 *                 · onSnapshot (de documento) · collection(sub) (subcolecciones)
 *   transaction:  get(DocumentReference) — con una query TIRA ERROR, igual que
 *                 el SDK web real — · set · update · delete
 *   FieldValue:   serverTimestamp · increment · delete · arrayUnion · arrayRemove
 *   auth():       signInAnonymously · signInWithEmailAndPassword (cualquier
 *                 email+contraseña NO vacíos loguea) · signOut ·
 *                 onAuthStateChanged · currentUser
 *
 * NO ejecuta firestore.rules ni índices (todo se permite, como modo test) y
 * NO es atómico entre pestañas. Eso se prueba contra el emulador (nivel 1).
 *
 * Persistencia: localStorage, una key por colección (`mockdb:{projectId}:{ruta}`,
 * ej. `mockdb:TODO_REEMPLAZAR-mi-cliente:stock/12/movimientos`). El projectId
 * de initializeApp separa los datos de cada cliente servido desde el mismo
 * localhost — por eso cada cliente necesita un projectId ÚNICO. Sincroniza
 * entre pestañas con el evento nativo `storage`.
 *
 * Timestamps: serverTimestamp() se guarda como string ISO (no Timestamp).
 * Las páginas deben leerlo con `f?.toDate ? f.toDate() : new Date(f)`.
 */
(function () {
  let PROJECT = 'default';
  let PREFIX = 'mockdb';
  const listeners = {}; // collectionPath -> Set<fn>

  /* ---------------- almacenamiento ---------------- */
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
  function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

  /* ---------------- FieldValue (sentinels) ---------------- */
  const SERVER_TS = '__SERVER_TIMESTAMP__'; // string, por compatibilidad con la versión anterior
  const FieldValue = {
    serverTimestamp: () => SERVER_TS,
    increment: (n) => ({ __mockOp: 'increment', n: Number(n) || 0 }),
    delete: () => ({ __mockOp: 'delete' }),
    arrayUnion: (...items) => ({ __mockOp: 'arrayUnion', items }),
    arrayRemove: (...items) => ({ __mockOp: 'arrayRemove', items }),
  };
  function isOp(v) { return isPlainObject(v) && typeof v.__mockOp === 'string'; }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  /** Aplica un valor (posible sentinel) sobre el valor previo del campo. */
  function applyValue(prev, v) {
    if (v === SERVER_TS) return new Date().toISOString();
    if (isOp(v)) {
      switch (v.__mockOp) {
        case 'increment': return (typeof prev === 'number' ? prev : 0) + v.n;
        case 'arrayUnion': {
          const arr = Array.isArray(prev) ? prev.slice() : [];
          v.items.forEach(it => { if (!arr.some(x => same(x, it))) arr.push(it); });
          return arr;
        }
        case 'arrayRemove':
          return (Array.isArray(prev) ? prev : []).filter(x => !v.items.some(it => same(x, it)));
        default: return undefined;
      }
    }
    if (isPlainObject(v)) {
      // Un map nuevo REEMPLAZA al anterior (como Firestore), pero sus sentinels internos se resuelven.
      const out = {};
      for (const k in v) {
        if (isOp(v[k]) && v[k].__mockOp === 'delete') continue;
        out[k] = applyValue(undefined, v[k]);
      }
      return out;
    }
    if (Array.isArray(v)) return v.map(x => applyValue(undefined, x));
    return v;
  }

  /** Escribe `value` en `obj` siguiendo un path ya separado (crea los maps intermedios). */
  function setPath(obj, parts, value) {
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!isPlainObject(cur[parts[i]])) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    const last = parts[parts.length - 1];
    if (isOp(value) && value.__mockOp === 'delete') { delete cur[last]; return; }
    cur[last] = applyValue(cur[last], value);
  }
  function getPath(obj, field) {
    return String(field).split('.').reduce((o, p) => (o == null ? undefined : o[p]), obj);
  }

  /** set(): las claves son literales (un '.' NO anida, igual que el SDK real). */
  function applySet(prev, data, merge) {
    if (!merge) {
      const out = {};
      for (const k in data) setPath(out, [k], data[k]);
      return out;
    }
    const out = clone(prev) || {};
    (function deepMerge(target, src) {
      for (const k in src) {
        const v = src[k];
        if (isPlainObject(v) && !isOp(v) && isPlainObject(target[k])) deepMerge(target[k], v);
        else setPath(target, [k], v);
      }
    })(out, data);
    return out;
  }

  /** update(): las claves con '.' son field paths y ANIDAN ('variantes.M.Negro': 5). */
  function applyUpdate(prev, data) {
    const out = clone(prev) || {};
    for (const k in data) setPath(out, String(k).split('.'), data[k]);
    return out;
  }

  /* ---------------- snapshots ---------------- */
  function makeSnapshotDoc(col, id, data) {
    const exists = data !== undefined;
    return {
      id,
      ref: docRef(col, id),
      exists,
      data: () => (exists ? clone(data) : undefined),
      get: (field) => (exists ? clone(getPath(data, field)) : undefined),
    };
  }

  function makeQuerySnapshot(docsArr) {
    return {
      empty: docsArr.length === 0,
      size: docsArr.length,
      docs: docsArr,
      forEach(fn) { docsArr.forEach(fn); },
    };
  }

  function subscribe(col, run) {
    run();
    listeners[col] = listeners[col] || new Set();
    listeners[col].add(run);
    const onStorage = (e) => { if (e.key === key(col)) run(); };
    window.addEventListener('storage', onStorage);
    return () => { listeners[col].delete(run); window.removeEventListener('storage', onStorage); };
  }

  /* ---------------- referencias ---------------- */
  function docRef(col, id) {
    return {
      __mockType: 'doc',
      id,
      path: `${col}/${id}`,
      get parent() { return collectionRef(col); },
      get() {
        return Promise.resolve(makeSnapshotDoc(col, id, readCol(col)[id]));
      },
      set(data, opts) {
        const all = readCol(col);
        all[id] = applySet(all[id], data || {}, !!(opts && opts.merge));
        writeCol(col, all);
        return Promise.resolve();
      },
      update(dataOrField, ...rest) {
        let data = dataOrField;
        if (typeof dataOrField === 'string') { // update('campo', valor, 'campo2', valor2)
          data = {};
          const args = [dataOrField, ...rest];
          for (let i = 0; i < args.length; i += 2) data[args[i]] = args[i + 1];
        }
        const all = readCol(col);
        if (!all[id]) {
          // El SDK real rechaza con not-found. Se mantiene el comportamiento
          // permisivo de la versión anterior del mock, pero se avisa.
          console.warn(`[firestore-mock] update() sobre un doc inexistente (${col}/${id}) — el SDK real tiraría not-found.`);
        }
        all[id] = applyUpdate(all[id], data || {});
        writeCol(col, all);
        return Promise.resolve();
      },
      delete() {
        const all = readCol(col);
        delete all[id];
        writeCol(col, all);
        return Promise.resolve();
      },
      onSnapshot(cb, onError) {
        const fn = typeof cb === 'function' ? cb : cb && cb.next;
        return subscribe(col, () => {
          try { fn(makeSnapshotDoc(col, id, readCol(col)[id])); }
          catch (e) { if (onError) onError(e); else throw e; }
        });
      },
      collection(sub) { return collectionRef(`${col}/${id}/${sub}`); },
    };
  }

  function matchesAll(d, predicates) {
    return predicates.every(({ field, op, value }) => {
      const v = getPath(d, field);
      switch (op) {
        case '==': return same(v, value);
        case '!=': return v !== undefined && !same(v, value);
        case '>': return v !== undefined && v > value;
        case '>=': return v !== undefined && v >= value;
        case '<': return v !== undefined && v < value;
        case '<=': return v !== undefined && v <= value;
        case 'in': return Array.isArray(value) && value.includes(v);
        case 'not-in': return v !== undefined && Array.isArray(value) && !value.includes(v);
        case 'array-contains': return Array.isArray(v) && v.includes(value);
        case 'array-contains-any': return Array.isArray(v) && Array.isArray(value) && value.some(x => v.includes(x));
        default:
          console.warn('[firestore-mock] operador no soportado en where():', op);
          return true;
      }
    });
  }

  function compare(a, b) {
    if (a === b) return 0;
    if (a === undefined || a === null) return -1;
    if (b === undefined || b === null) return 1;
    return a < b ? -1 : 1;
  }

  // Encadenable: .where().orderBy().limit().get()/.onSnapshot(), como Firestore real.
  function makeQuery(col, predicates, orders, limitN) {
    function compute() {
      let entries = Object.entries(readCol(col)).filter(([, d]) => matchesAll(d, predicates));
      if (orders.length) {
        // Como el real: orderBy excluye los docs que no tienen el campo.
        entries = entries.filter(([, d]) => orders.every(o => getPath(d, o.field) !== undefined));
        entries.sort(([, a], [, b]) => {
          for (const o of orders) {
            const c = compare(getPath(a, o.field), getPath(b, o.field));
            if (c) return o.dir === 'desc' ? -c : c;
          }
          return 0;
        });
      }
      return entries.slice(0, limitN).map(([id, d]) => makeSnapshotDoc(col, id, d));
    }
    return {
      __mockType: 'query',
      where(field, op, value) { return makeQuery(col, [...predicates, { field, op, value }], orders, limitN); },
      orderBy(field, dir = 'asc') { return makeQuery(col, predicates, [...orders, { field, dir }], limitN); },
      limit(n) { return makeQuery(col, predicates, orders, n); },
      get() { return Promise.resolve(makeQuerySnapshot(compute())); },
      onSnapshot(cb, onError) {
        const fn = typeof cb === 'function' ? cb : cb && cb.next;
        return subscribe(col, () => {
          try { fn(makeQuerySnapshot(compute())); }
          catch (e) { if (onError) onError(e); else throw e; }
        });
      },
    };
  }

  function collectionRef(path) {
    const col = String(path).replace(/^\/+|\/+$/g, '');
    return {
      ...makeQuery(col, [], [], Infinity),
      __mockType: 'collection',
      id: col.split('/').pop(),
      path: col,
      add(data) {
        const ref = docRef(col, genId());
        return ref.set(data).then(() => ref);
      },
      doc(id) { return docRef(col, id || genId()); },
    };
  }

  function docFromPath(path) {
    const parts = String(path).replace(/^\/+|\/+$/g, '').split('/');
    const id = parts.pop();
    return docRef(parts.join('/'), id);
  }

  /* ---------------- transacciones y batch ---------------- */
  // Serializa las transacciones de ESTA pestaña (dos clicks seguidos no se pisan).
  // Entre pestañas NO es atómico: localStorage no tiene locks.
  let txQueue = Promise.resolve();
  function runTransaction(fn) {
    const run = () => {
      const writes = [];
      const tx = {
        get(ref) {
          if (!ref || ref.__mockType !== 'doc') {
            return Promise.reject(new Error('[firestore-mock] transaction.get() solo acepta DocumentReference (no queries ni colecciones), igual que el SDK web real. Usá docs de lock/contador con ID determinístico.'));
          }
          if (writes.length) {
            return Promise.reject(new Error('[firestore-mock] En una transacción todas las lecturas van antes que las escrituras (igual que el SDK real).'));
          }
          return ref.get();
        },
        set(ref, data, opts) { writes.push(() => ref.set(data, opts)); return tx; },
        update(ref, ...args) { writes.push(() => ref.update(...args)); return tx; },
        delete(ref) { writes.push(() => ref.delete()); return tx; },
      };
      return Promise.resolve()
        .then(() => fn(tx))
        .then(async (res) => { for (const w of writes) await w(); return res; });
    };
    const p = txQueue.then(run, run);
    txQueue = p.catch(() => {});
    return p;
  }

  function batch() {
    const writes = [];
    const b = {
      set(ref, data, opts) { writes.push(() => ref.set(data, opts)); return b; },
      update(ref, ...args) { writes.push(() => ref.update(...args)); return b; },
      delete(ref) { writes.push(() => ref.delete()); return b; },
      async commit() { for (const w of writes) await w(); },
    };
    return b;
  }

  /* ---------------- auth ---------------- */
  // Persistencia en localStorage por projectId (como la persistencia LOCAL por
  // defecto del SDK): el login del staff sobrevive recargas y se comparte entre pestañas.
  const authCbs = new Set();
  function authKey() { return `mockauth:${PROJECT}`; }
  function readUser() {
    try { return JSON.parse(localStorage.getItem(authKey()) || 'null'); } catch { return null; }
  }
  function setUser(u) {
    try {
      if (u) localStorage.setItem(authKey(), JSON.stringify(u));
      else localStorage.removeItem(authKey());
    } catch {}
    authCbs.forEach(cb => cb(u));
  }
  window.addEventListener('storage', (e) => { if (e.key === authKey()) authCbs.forEach(cb => cb(readUser())); });

  const authApi = {
    get currentUser() { return readUser(); },
    signInAnonymously() {
      const u = { uid: 'anon-' + genId(), isAnonymous: true, email: null };
      setUser(u);
      return Promise.resolve({ user: u });
    },
    signInWithEmailAndPassword(email, password) {
      if (!email || !password) {
        const e = new Error('[firestore-mock] auth/invalid-credential');
        e.code = 'auth/invalid-credential';
        return Promise.reject(e);
      }
      const mail = String(email).trim().toLowerCase();
      const u = { uid: 'mock-' + mail, email: mail, isAnonymous: false };
      setUser(u);
      return Promise.resolve({ user: u });
    },
    signOut() { setUser(null); return Promise.resolve(); },
    onAuthStateChanged(cb) {
      authCbs.add(cb);
      setTimeout(() => cb(readUser()), 0);
      return () => authCbs.delete(cb);
    },
    useEmulator() {},
  };

  /* ---------------- namespace global ---------------- */
  const firestoreApi = {
    collection: collectionRef,
    doc: docFromPath,
    runTransaction,
    batch,
    useEmulator() {},
    settings() {},
  };

  window.firebase = {
    initializeApp(config) {
      PROJECT = (config && config.projectId) || 'default';
      PREFIX = `mockdb:${PROJECT}`;
      console.info('[firestore-mock] usando BD local en localStorage, proyecto:', PROJECT);
      return { name: '[DEFAULT]', options: config };
    },
    firestore() { return firestoreApi; },
    auth() { return authApi; },
  };
  window.firebase.firestore.FieldValue = FieldValue;
})();
