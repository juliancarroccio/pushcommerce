/**
 * eventos-core.js — venta de entradas de La Usina (module-eventos.md). La
 * usan evento.html (público), mi-entrada.html (público), validar.html
 * (staff) y portal.html (staff).
 *
 * Modelo Firestore:
 *   cupos/{tipoId}     vendidas, cupo_total (espejo de evento.json), ultima_entrada.
 *                      Sin datos personales, read público. Lo CREA el staff.
 *   entradas/{codigo}  doc ID = código de 9 chars (45 bits, crypto) — el código
 *                      ES la entrada. get público, list/update solo staff.
 */
(function () {
  const genCodigoEntrada = () => genCodigo(9);
  function err(code) { const e = new Error(code); e.code = code; return e; }

  /** Compra anti-oversell: tx.get(cupoRef) (doc ref) + entrada en el mismo paso. */
  async function comprarEntrada(db, tipo, comprador) {
    const codigo = genCodigoEntrada();
    const cupoRef = db.collection('cupos').doc(tipo.id);
    const entradaRef = db.collection('entradas').doc(codigo);
    await db.runTransaction(async (tx) => {
      const cupoSnap = await tx.get(cupoRef);                       // doc ref ✔
      if (!cupoSnap.exists) throw err('SIN_CUPO_CONFIGURADO');
      const { vendidas = 0, cupo_total } = cupoSnap.data();
      if (vendidas >= cupo_total) throw err('AGOTADO');
      tx.update(cupoRef, { vendidas: vendidas + 1, ultima_entrada: codigo });
      tx.set(entradaRef, {
        codigo, tipo_id: tipo.id, comprador, estado: 'pendiente_pago',
        validadaEn: null, creadoEn: firebase.firestore.FieldValue.serverTimestamp(),
      });
    });
    return codigo;
  }

  /** Staff: cancelar devuelve el cupo (transacción). Una validada no se cancela. */
  async function cancelarEntrada(db, codigo) {
    const entRef = db.collection('entradas').doc(codigo);
    return db.runTransaction(async (tx) => {
      const e = await tx.get(entRef);
      if (!e.exists || e.data().estado === 'cancelada') return;
      if (e.data().estado === 'validada') throw new Error('Ya fue usada: no se cancela.');
      const cupoRef = db.collection('cupos').doc(e.data().tipo_id);
      const c = await tx.get(cupoRef);
      if (c.exists) tx.update(cupoRef, { vendidas: Math.max(0, (c.data().vendidas || 0) - 1) });
      tx.update(entRef, { estado: 'cancelada', actualizadoEn: firebase.firestore.FieldValue.serverTimestamp() });
    });
  }

  /** Staff (puerta): vendida → validada, una sola vez. Ante la duda, se rechaza. */
  async function validarEntrada(db, codigo) {
    const ref = db.collection('entradas').doc(codigo);
    return db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return { ok: false, titulo: 'CÓDIGO NO ENCONTRADO', sub: 'No existe ninguna entrada con ese código. No se deja pasar.' };
      const d = snap.data();
      if (d.estado === 'vendida') {
        tx.update(ref, { estado: 'validada', validadaEn: firebase.firestore.FieldValue.serverTimestamp() });
        return { ok: true, entrada: d };
      }
      if (d.estado === 'validada') {
        const f = aFecha(d.validadaEn);
        return { ok: false, titulo: 'YA FUE USADA', sub: f ? `Validada el ${f.toLocaleString('es-AR')}.` : 'Ya fue validada antes.', entrada: d };
      }
      if (d.estado === 'pendiente_pago') return { ok: false, titulo: 'PAGO NO CONFIRMADO', sub: 'Esta entrada nunca se confirmó como vendida.', entrada: d };
      if (d.estado === 'cancelada') return { ok: false, titulo: 'ENTRADA CANCELADA', sub: 'Esta entrada fue cancelada.', entrada: d };
      return { ok: false, titulo: 'ESTADO NO VÁLIDO', sub: 'Estado desconocido: ' + d.estado, entrada: d };
    });
  }

  /** Staff (portal, al publicar evento.json): crea/actualiza cupos/{tipo} con cupo_total espejado. */
  async function sincronizarCupos(db, evento) {
    for (const t of evento.tipos_entrada || []) {
      const ref = db.collection('cupos').doc(t.id);
      const snap = await ref.get();
      if (snap.exists) await ref.update({ cupo_total: Number(t.cupo_total) || 0 });
      else await ref.set({ vendidas: 0, cupo_total: Number(t.cupo_total) || 0 });
    }
  }

  /**
   * SOLO DEMO (DEMO === true): en un cliente real los cupos/{tipo} los crea el
   * staff desde el portal (sincronizarCupos) y el público NO tiene permiso.
   * Acá no hay staff logueable, así que la página pública siembra los que
   * falten desde evento.json. Nunca pisa uno existente.
   */
  async function sembrarCuposDemo(db, evento) {
    if (typeof DEMO === 'undefined' || DEMO !== true) return;
    for (const t of evento.tipos_entrada || []) {
      const ref = db.collection('cupos').doc(t.id);
      const snap = await ref.get();
      if (!snap.exists) await ref.set({ vendidas: 0, cupo_total: Number(t.cupo_total) || 0 });
    }
  }

  function nombreTipo(evento, tipoId) {
    const t = evento && (evento.tipos_entrada || []).find(x => x.id === tipoId);
    return t ? t.nombre : tipoId;
  }

  window.EventosCore = { genCodigoEntrada, comprarEntrada, cancelarEntrada, validarEntrada, sincronizarCupos, sembrarCuposDemo, nombreTipo };
})();
