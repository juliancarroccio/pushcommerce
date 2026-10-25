/**
 * turnos-core.js — lógica de turnos de La Usina (module-turnos.md +
 * module-reservas.md, granularidad horaria, modo instantáneo). La usan
 * agenda.html (público), seguimiento.html (público) y portal.html (staff).
 *
 * Modelo Firestore:
 *   reservas/{codigo}                       doc ID = código (6 chars, crypto).
 *                                           get público, list/update solo staff.
 *   slots/{recurso}__{YYYY-MM-DD}__{HHMM}   contador por intervalo de la grilla,
 *                                           SIN datos personales, read público:
 *     recurso_id, fecha, hora, capacidad, ocupados, reservas [codigos],
 *     bloqueos [codigos]   ← solo lo escribe el staff (bloqueo manual)
 *
 * Invariante de cada slot: ocupados = bloqueos.length ? capacidad : reservas.length
 * (un bloqueo ocupa toda la capacidad; al quitarlo vuelve a contar las reservas).
 *
 * Transacciones SOLO con DocumentReference (el SDK web no acepta queries en
 * tx.get, y el mock tampoco). Todas las lecturas antes que las escrituras.
 */
(function () {
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const DIAS_LUN_DOM = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const VENTANA_DIAS = 90; // hasta cuántos días adelante se puede reservar

  /* ---------------- tiempo ---------------- */
  const toMin = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + m; };
  const toHHMM = (min) => String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
  function fechaISO(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  const parseFecha = (iso) => new Date(iso + 'T00:00:00');
  const diaDeLaSemana = (iso) => DIAS[parseFecha(iso).getDay()];
  function addDias(iso, n) { const d = parseFecha(iso); d.setDate(d.getDate() + n); return fechaISO(d); }
  const hoyISO = () => fechaISO(new Date());
  const ultimoDiaReservable = () => addDias(hoyISO(), VENTANA_DIAS - 1);
  const fechaLabel = (iso) => parseFecha(iso).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  const fechaLabelLarga = (iso) => parseFecha(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  /* ---------------- turnos.json ---------------- */
  /** Recurso de un servicio, con defaults del shape viejo (horario/intervalo en la raíz, capacidad 1). */
  function recursoDe(turnos, servicioOId) {
    const s = typeof servicioOId === 'string' ? servicioOId : servicioOId.recurso_id;
    const r = (turnos.recursos || []).find(x => x.id === s) || { id: s || 'principal', nombre: 'Turno' };
    return {
      ...r,
      horario_atencion: r.horario_atencion || turnos.horario_atencion || {},
      intervalo_slots_min: Number(r.intervalo_slots_min || turnos.intervalo_slots_min || 30),
      capacidad: Math.max(1, Number(r.capacidad || 1)),
    };
  }
  /** 'botones' (default, comportamiento histórico) o 'calendario'. */
  const selectorFecha = (turnos) => (turnos && turnos.selector_fecha === 'calendario' ? 'calendario' : 'botones');

  /* ---------------- grilla ---------------- */
  const slotId = (recursoId, fecha, hhmm) => `${recursoId}__${fecha}__${hhmm.replace(':', '')}`;
  const franjasDe = (recurso, fecha) => recurso.horario_atencion[diaDeLaSemana(fecha)] || [];
  const tieneAtencion = (recurso, fecha) => franjasDe(recurso, fecha).length > 0;

  /** Intervalos de la grilla que ocupa un turno [inicio, fin). */
  function horasDe(recurso, hora_inicio, hora_fin) {
    const out = [];
    for (let m = toMin(hora_inicio); m < toMin(hora_fin); m += recurso.intervalo_slots_min) out.push(toHHMM(m));
    return out;
  }
  /** Intervalos de la grilla del día que se pisan con [desde, hasta) — para bloqueos. */
  function horasEnRango(recurso, fecha, desde, hasta) {
    const out = [], d = toMin(desde), h = toMin(hasta), paso = recurso.intervalo_slots_min;
    for (const f of franjasDe(recurso, fecha)) {
      for (let m = toMin(f.abre); m < toMin(f.cierra); m += paso) {
        if (m < h && m + paso > d) out.push(toHHMM(m));
      }
    }
    return out;
  }

  /* ---------------- disponibilidad pública (lee slots, NUNCA reservas) ---------------- */
  function mapaOcupacion(snap) {
    const porFecha = new Map(); // fecha -> Map('HH:MM' -> {ocupados, bloqueado})
    snap.forEach(doc => {
      const s = doc.data();
      if (!porFecha.has(s.fecha)) porFecha.set(s.fecha, new Map());
      porFecha.get(s.fecha).set(s.hora, { ocupados: s.ocupados || 0, bloqueado: (s.bloqueos || []).length > 0 });
    });
    return porFecha;
  }
  /** Un día: solo igualdades → sin índice compuesto. */
  async function leerOcupacion(db, recursoId, fecha) {
    const snap = await db.collection('slots').where('recurso_id', '==', recursoId).where('fecha', '==', fecha).get();
    return mapaOcupacion(snap).get(fecha) || new Map();
  }
  /** Rango de días (calendario / botones): recurso_id == + fecha >= <= → índice recurso_id ASC, fecha ASC. */
  async function leerOcupacionRango(db, recursoId, desde, hasta) {
    const snap = await db.collection('slots').where('recurso_id', '==', recursoId)
      .where('fecha', '>=', desde).where('fecha', '<=', hasta).get();
    return mapaOcupacion(snap);
  }

  /**
   * Horarios de un día. Nunca ofrece uno que no entra antes del cierre, ni
   * uno que ya empezó (si es hoy). libres === 0 → "Sin lugar".
   */
  function slotsDisponibles(servicio, recurso, fecha, ocupacion, ahora = new Date()) {
    const paso = recurso.intervalo_slots_min, cap = recurso.capacidad;
    const esHoy = fecha === fechaISO(ahora);
    const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
    const out = [];
    for (const franja of franjasDe(recurso, fecha)) {
      for (let ini = toMin(franja.abre); ini + servicio.duracion_min <= toMin(franja.cierra); ini += paso) {
        if (esHoy && ini <= minAhora) continue;
        let libres = cap;
        for (let m = ini; m < ini + servicio.duracion_min; m += paso) {
          const o = ocupacion.get(toHHMM(m));
          if (o) libres = Math.min(libres, o.bloqueado ? 0 : cap - o.ocupados);
        }
        out.push({ hora_inicio: toHHMM(ini), hora_fin: toHHMM(ini + servicio.duracion_min), libres: Math.max(0, libres), capacidad: cap });
      }
    }
    return out;
  }

  /** 'cerrado' (sin atención) | 'fuera' (pasado o fuera de la ventana) | 'lleno' | 'disponible'. */
  function estadoDia(servicio, recurso, fecha, ocupacion, ahora = new Date()) {
    if (fecha < fechaISO(ahora) || fecha > ultimoDiaReservable()) return 'fuera';
    if (!tieneAtencion(recurso, fecha)) return 'cerrado';
    const slots = slotsDisponibles(servicio, recurso, fecha, ocupacion || new Map(), ahora);
    return slots.some(s => s.libres > 0) ? 'disponible' : 'lleno';
  }

  /** Próximas n fechas con atención (dentro de la ventana). */
  function proximasFechasConAtencion(recurso, n) {
    const out = [];
    for (let i = 0; i < VENTANA_DIAS && out.length < n; i++) {
      const f = addDias(hoyISO(), i);
      if (tieneAtencion(recurso, f)) out.push(f);
    }
    return out;
  }

  /* ---------------- transacciones ---------------- */
  function errOcupado(horas) { const e = new Error('OCUPADO'); e.code = 'OCUPADO'; e.horas = horas; return e; }

  /**
   * Reserva instantánea (público) o alta manual (staff): toma un lugar en
   * cada intervalo del turno y crea reservas/{codigo} en el mismo paso.
   * Escribe el valor nuevo (prev + 1), no FieldValue.increment: la regla
   * compara ocupados == resource.data.ocupados + 1.
   */
  async function reservarTurno(db, recurso, docReserva) {
    const { codigo, fecha, hora_inicio, hora_fin } = docReserva;
    const horas = horasDe(recurso, hora_inicio, hora_fin);
    const refs = horas.map(h => db.collection('slots').doc(slotId(recurso.id, fecha, h)));
    const resRef = db.collection('reservas').doc(codigo);
    return db.runTransaction(async (tx) => {
      const snaps = await Promise.all(refs.map(r => tx.get(r)));        // doc refs ✔
      const yaExiste = await tx.get(resRef);
      if (yaExiste.exists) throw new Error('CODIGO_DUPLICADO');
      const llenos = horas.filter((h, i) => {
        if (!snaps[i].exists) return false;
        const s = snaps[i].data();
        return (s.bloqueos || []).length > 0 || (s.ocupados || 0) >= recurso.capacidad;
      });
      if (llenos.length) throw errOcupado(llenos);
      refs.forEach((ref, i) => {
        if (snaps[i].exists) {
          const prev = snaps[i].data();
          tx.update(ref, { ocupados: (prev.ocupados || 0) + 1, reservas: [...(prev.reservas || []), codigo] });
        } else {
          tx.set(ref, { recurso_id: recurso.id, fecha, hora: horas[i], capacidad: recurso.capacidad, ocupados: 1, reservas: [codigo] });
        }
      });
      tx.set(resRef, docReserva);
    });
  }

  /** Staff: cancelar (libera sus lugares) o completar una reserva. */
  async function cambiarEstadoReserva(db, turnos, codigo, estadoFinal, motivo) {
    const resRef = db.collection('reservas').doc(codigo);
    return db.runTransaction(async (tx) => {
      const rSnap = await tx.get(resRef);
      if (!rSnap.exists) throw new Error('La reserva ya no existe.');
      const r = rSnap.data();
      const liberar = estadoFinal === 'cancelado' && r.estado === 'confirmado';
      let refs = [], snaps = [];
      if (liberar) {
        const recurso = recursoDe(turnos, r.recurso_id);
        refs = horasDe(recurso, r.hora_inicio, r.hora_fin).map(h => db.collection('slots').doc(slotId(r.recurso_id, r.fecha, h)));
        snaps = await Promise.all(refs.map(ref => tx.get(ref)));
      }
      refs.forEach((ref, i) => {
        if (!snaps[i].exists) return;
        const s = snaps[i].data();
        const reservas = (s.reservas || []).filter(c => c !== codigo);
        const bloqueado = (s.bloqueos || []).length > 0;
        tx.update(ref, { reservas, ocupados: bloqueado ? s.capacidad : reservas.length });
      });
      const upd = { estado: estadoFinal, actualizadoEn: firebase.firestore.FieldValue.serverTimestamp() };
      if (estadoFinal === 'cancelado') upd.motivo = motivo || 'cancelada_por_el_negocio';
      tx.update(resRef, upd);
    });
  }

  /**
   * Staff: bloqueo manual (feriado, mantenimiento). Ocupa TODA la capacidad
   * de cada intervalo de la grilla que toca [desde, hasta). Las reservas que
   * ya había en esos intervalos siguen vigentes (se avisan en `conReservas`).
   */
  async function crearBloqueo(db, recurso, { fecha, desde, hasta, nota }) {
    const horas = horasEnRango(recurso, fecha, desde, hasta);
    if (!horas.length) { const e = new Error('SIN_HORARIOS'); e.code = 'SIN_HORARIOS'; throw e; }
    const codigo = genCodigo(6);
    const refs = horas.map(h => db.collection('slots').doc(slotId(recurso.id, fecha, h)));
    const resRef = db.collection('reservas').doc(codigo);
    let afectadas = new Set();
    await db.runTransaction(async (tx) => {
      const snaps = await Promise.all(refs.map(r => tx.get(r)));
      afectadas = new Set();
      refs.forEach((ref, i) => {
        const prev = snaps[i].exists ? snaps[i].data() : null;
        if (prev) (prev.reservas || []).forEach(c => afectadas.add(c));
        if (prev) tx.update(ref, { bloqueos: [...(prev.bloqueos || []), codigo], ocupados: prev.capacidad || recurso.capacidad });
        else tx.set(ref, { recurso_id: recurso.id, fecha, hora: horas[i], capacidad: recurso.capacidad, ocupados: recurso.capacidad, reservas: [], bloqueos: [codigo] });
      });
      tx.set(resRef, {
        codigo, recurso_id: recurso.id, recurso_nombre: recurso.nombre || recurso.id, fecha,
        hora_inicio: horas[0], hora_fin: toHHMM(toMin(horas[horas.length - 1]) + recurso.intervalo_slots_min),
        horas, nota: nota || '', estado: 'bloqueado',
        creadoEn: firebase.firestore.FieldValue.serverTimestamp(),
      });
    });
    return { codigo, horas, conReservas: afectadas.size };
  }

  /** Staff: quitar un bloqueo — devuelve cada intervalo a "cuántas reservas tiene". */
  async function quitarBloqueo(db, codigo) {
    const resRef = db.collection('reservas').doc(codigo);
    return db.runTransaction(async (tx) => {
      const rSnap = await tx.get(resRef);
      if (!rSnap.exists) return;
      const b = rSnap.data();
      if (b.estado !== 'bloqueado') throw new Error('No es un bloqueo.');
      const refs = (b.horas || []).map(h => db.collection('slots').doc(slotId(b.recurso_id, b.fecha, h)));
      const snaps = await Promise.all(refs.map(r => tx.get(r)));
      refs.forEach((ref, i) => {
        if (!snaps[i].exists) return;
        const s = snaps[i].data();
        const bloqueos = (s.bloqueos || []).filter(c => c !== codigo);
        tx.update(ref, { bloqueos, ocupados: bloqueos.length ? s.capacidad : (s.reservas || []).length });
      });
      tx.delete(resRef);
    });
  }

  window.TurnosCore = {
    DIAS, DIAS_LUN_DOM, VENTANA_DIAS,
    toMin, toHHMM, fechaISO, parseFecha, diaDeLaSemana, addDias, hoyISO, ultimoDiaReservable,
    fechaLabel, fechaLabelLarga,
    recursoDe, selectorFecha, slotId, tieneAtencion, horasDe, horasEnRango,
    leerOcupacion, leerOcupacionRango, slotsDisponibles, estadoDia, proximasFechasConAtencion,
    reservarTurno, cambiarEstadoReserva, crearBloqueo, quitarBloqueo,
  };
})();
