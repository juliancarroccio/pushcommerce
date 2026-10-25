import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/**
 * Tests del cliente La Usina (demo inventado) — cubre los 3 módulos:
 * Landing + QR Menú (index.html, menu.html), Turnos (agenda.html,
 * seguimiento.html) y Eventos/Entradas (evento.html, mi-entrada.html,
 * validar.html), más el panel (portal.html) con la API de GitHub simulada.
 *
 * Estándar: ~/.claude/skills/new_client/references/testing-playwright.md
 *
 * Navega vía http://localhost:4173 (ver playwright.config.ts), no file://,
 * porque todas estas páginas usan fetch() y/o el mock de Firestore en
 * localStorage (references/local-db-testing.md). Cada test corre en un
 * contexto nuevo → localStorage vacío; las páginas del MISMO contexto
 * comparten la "base" (como dos pestañas contra el mismo Firestore).
 */

const DB = 'mockdb:TODO_REEMPLAZAR-la-usina';

function vigilarConsola(page: Page): string[] {
  const errores: string[] = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errores.push(msg.text()); });
  page.on('pageerror', (err) => errores.push(err.message));
  return errores;
}

async function leerColeccion(page: Page, col: string): Promise<Record<string, any>> {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), `${DB}:${col}`);
}

async function escribirDoc(page: Page, col: string, id: string, data: any) {
  await page.evaluate(([k, docId, d]) => {
    const all = JSON.parse(localStorage.getItem(k as string) || '{}');
    all[docId as string] = d;
    localStorage.setItem(k as string, JSON.stringify(all));
  }, [`${DB}:${col}`, id, data] as const);
}

/* ─────────────────────────── Turnos: helpers ─────────────────────────── */

/** Lleva agenda.html hasta el paso 2 (día) con el servicio elegido. */
async function abrirAgenda(page: Page, servicioId: string) {
  await page.goto('/la_usina/agenda.html');
  await page.locator(`[data-servicio="${servicioId}"]`).click();
  await expect(page.locator('#step-2')).toBeVisible();
}

/** Desde el paso 3 (horario) completa datos y confirma. Devuelve el código. */
async function completarDatosYConfirmar(page: Page, nombre: string) {
  await expect(page.locator('#step-4')).toBeVisible();
  await page.locator('#in-nombre').fill(nombre);
  await page.locator('#in-telefono').fill('02244 15-555-0000');
  await page.locator('#btn-confirmar').click();
  await expect(page.locator('#step-5')).toBeVisible();
  const codigo = ((await page.locator('#confirmado-codigo').textContent()) ?? '').trim();
  expect(codigo).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  return codigo;
}

/* ═══════════════════════════ Landing / menú ═══════════════════════════ */

test('index.html carga el título, el hero y no tira errores de consola', async ({ page }) => {
  const errores = vigilarConsola(page);
  await page.goto('/la_usina/index.html');
  await expect(page).toHaveTitle(/La Usina/);
  await expect(page.locator('#hero')).toBeVisible();
  expect(errores, `Errores de consola: ${errores.join(' | ')}`).toEqual([]);
});

test('menu.html (QR Menú) carga la carta sin carrito y no tira errores de consola', async ({ page }) => {
  const errores = vigilarConsola(page);
  await page.goto('/la_usina/menu.html');
  await expect(page).toHaveTitle(/Carta/);
  await expect(page.locator('#categorias')).toBeVisible();
  await expect(page.locator('#skeleton')).toBeHidden();
  expect(await page.locator('text=/carrito|agregar al pedido|checkout/i').count()).toBe(0);
  expect(errores, `Errores de consola: ${errores.join(' | ')}`).toEqual([]);
});

/* ═══════════════════════════════ Turnos ═══════════════════════════════ */

test('agenda.html (Turnos): el wizard carga los servicios sin romperse', async ({ page }) => {
  const errores = vigilarConsola(page);
  await page.goto('/la_usina/agenda.html');
  await expect(page).toHaveTitle(/Reservá/);
  await expect(page.locator('#servicios-list')).toBeVisible();
  await expect(page.locator('#servicios-list >> text=Mesa')).toBeVisible();
  await expect(page.locator('#error-box')).toBeHidden();
  expect(errores, `Errores de consola: ${errores.join(' | ')}`).toEqual([]);
});

test('turnos de punta a punta: servicio → día → horario → datos → código → seguimiento.html?code=', async ({ page }) => {
  const errores = vigilarConsola(page);
  await abrirAgenda(page, 'mesa-show');

  // Vista por defecto = botones (turnos.json → selector_fecha: "botones").
  await expect(page.locator('.vista-btn[data-vista="botones"]')).toHaveAttribute('aria-pressed', 'true');
  const dia = page.locator('#fechas-list [data-fecha]:not([disabled])').first();
  const fecha = await dia.getAttribute('data-fecha');
  await dia.click();

  await expect(page.locator('#step-3')).toBeVisible();
  // Capacidad 8: el horario muestra lugares libres.
  await expect(page.locator('#slots-list button:not([disabled])').first()).toContainText('8/8 libres');
  await page.locator('#slots-list button:not([disabled])').first().click();
  const codigo = await completarDatosYConfirmar(page, 'Reserva Punta a Punta');

  // Persistencia con el patrón correcto: reservas/{codigo} (doc ID = código) + contador en slots/.
  const reservas = await leerColeccion(page, 'reservas');
  expect(reservas[codigo]).toMatchObject({ codigo, estado: 'confirmado', recurso_id: 'mesas-show', fecha });
  const slots = await leerColeccion(page, 'slots');
  const slot = slots[`mesas-show__${fecha}__${reservas[codigo].hora_inicio.replace(':', '')}`];
  expect(slot).toMatchObject({ ocupados: 1, capacidad: 8, reservas: [codigo] });
  expect(JSON.stringify(slot)).not.toContain('Reserva Punta a Punta'); // slots sin datos personales

  // Link de la confirmación → seguimiento.html?code=
  await page.locator('#link-seguimiento').click();
  await expect(page).toHaveURL(new RegExp(`seguimiento\\.html\\?code=${codigo}$`));
  await expect(page.locator('#reserva')).toBeVisible();
  await expect(page.locator('#r-titulo')).toHaveText('Te esperamos');
  await expect(page.locator('#r-codigo')).toHaveText(codigo);
  await expect(page.locator('#r-servicio')).toContainText('Mesa para la noche de show');
  await expect(page.locator('#r-nombre')).toHaveText('Reserva Punta a Punta');
  await expect(page.locator('footer a[href="./privacidad.html"]')).toBeVisible();
  await expect(page.locator('footer a[href="./terminos.html"]')).toBeVisible();

  // De vuelta en la agenda, ese horario ahora tiene 7/8.
  await abrirAgenda(page, 'mesa-show');
  await page.locator(`#fechas-list [data-fecha="${fecha}"]`).click();
  await expect(page.locator(`#slots-list [data-hora="${reservas[codigo].hora_inicio}"]`)).toContainText('7/8 libres');

  expect(errores, `Errores de consola: ${errores.join(' | ')}`).toEqual([]);
});

test('seguimiento.html: sin código pide el código; código inexistente → no encontrado + WhatsApp', async ({ page }) => {
  await page.goto('/la_usina/seguimiento.html');
  await expect(page.locator('#sin-codigo')).toBeVisible();
  await page.locator('#in-buscar-codigo').fill('zz-zz zz');
  await page.locator('#form-buscar button[type="submit"]').click();
  await expect(page).toHaveURL(/seguimiento\.html\?code=ZZZZZZ$/);
  await expect(page.locator('#no-encontrada')).toBeVisible();
  await expect(page.locator('#wa-no-encontrada')).toHaveAttribute('href', /wa\.me\/.*ZZZZZZ/);
});

test('capacidad: el privado (capacidad 1) se llena — el slot deja de ofrecerse y una segunda reserva simultánea se rechaza', async ({ context }) => {
  // Dos "pestañas" llegan al paso 4 con el MISMO horario del privado.
  const a = await context.newPage();
  const b = await context.newPage();
  const erroresA = vigilarConsola(a);
  let fecha = '';
  for (const p of [a, b]) {
    await abrirAgenda(p, 'privado-eventos');
    const dia = p.locator('#fechas-list [data-fecha]:not([disabled])').first();
    const f = (await dia.getAttribute('data-fecha'))!;
    if (fecha) expect(f).toBe(fecha);
    fecha = f;
    await dia.click();
    await expect(p.locator('#step-3')).toBeVisible();
  }
  const hora = await a.locator('#slots-list button:not([disabled])').first().getAttribute('data-hora');
  for (const p of [a, b]) await p.locator(`#slots-list [data-hora="${hora}"]`).click();

  // A confirma primero → gana.
  const codigo = await completarDatosYConfirmar(a, 'Cumple de Ana');

  // B confirma después → la transacción ve el slot lleno (OCUPADO) y vuelve al paso 3.
  await b.locator('#in-nombre').fill('Cumple de Beto');
  await b.locator('#in-telefono').fill('02244 15-555-0001');
  await b.locator('#btn-confirmar').click();
  await expect(b.locator('#error-box')).toContainText('Justo se ocupó ese horario');
  await expect(b.locator('#step-3')).toBeVisible();
  await expect(b.locator(`#slots-list [data-hora="${hora}"]`)).toBeDisabled();
  await expect(b.locator(`#slots-list [data-hora="${hora}"]`)).toContainText('Ocupado');

  // Solo existe la reserva de A, y el slot quedó en 1/1.
  const reservas = await leerColeccion(a, 'reservas');
  expect(Object.keys(reservas)).toEqual([codigo]);
  const slots = await leerColeccion(a, 'slots');
  expect(slots[`privado__${fecha}__${hora!.replace(':', '')}`]).toMatchObject({ ocupados: 1, capacidad: 1 });

  // Al recargar, ese horario ya no se ofrece.
  await abrirAgenda(a, 'privado-eventos');
  await a.locator(`#fechas-list [data-fecha="${fecha}"]`).click();
  await expect(a.locator(`#slots-list [data-hora="${hora}"]`)).toBeDisabled();

  // Si se llenan todos los horarios del día, el día entero queda "Sin lugar".
  const otros = a.locator('#slots-list button:not([disabled])');
  while (await otros.count()) {
    await otros.first().click();
    await completarDatosYConfirmar(a, 'Otro cumple');
    await abrirAgenda(a, 'privado-eventos');
    const btnDia = a.locator(`#fechas-list [data-fecha="${fecha}"]`);
    if (await btnDia.isDisabled()) break;
    await btnDia.click();
  }
  await expect(a.locator(`#fechas-list [data-fecha="${fecha}"]`)).toBeDisabled();
  await expect(a.locator(`#fechas-list [data-fecha="${fecha}"]`)).toContainText('Sin lugar');

  expect(erroresA, `Errores de consola: ${erroresA.join(' | ')}`).toEqual([]);
});

test('vista calendario (selector demo): día sin atención deshabilitado, elegir un sábado para la mesa de show y reservar', async ({ page }) => {
  const errores = vigilarConsola(page);
  await abrirAgenda(page, 'mesa-show');

  // El selector demo existe y cambia a la grilla mensual.
  await expect(page.locator('#demo-vista')).toBeVisible();
  await expect(page.locator('#demo-vista')).toContainText('el dueño elige una sola desde su panel');
  await page.locator('.vista-btn[data-vista="calendario"]').click();
  await expect(page.locator('.vista-btn[data-vista="calendario"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#calendario')).toBeVisible();
  await expect(page.locator('#fechas-list')).toBeHidden();
  await expect(page.locator('#cal-prev')).toBeDisabled(); // no se puede ir antes del mes actual

  // Hoy marcado.
  const hoy = await page.evaluate(() => (window as any).TurnosCore.hoyISO());
  await expect(page.locator(`.cal-dia[data-fecha="${hoy}"]`)).toHaveAttribute('aria-current', 'date');

  // Un día sin atención (la mesa de show solo abre los sábados) está deshabilitado y no avanza.
  const cerrado = page.locator('.cal-dia[data-estado="cerrado"]').first();
  await expect(cerrado).toHaveAttribute('aria-disabled', 'true');
  await cerrado.click({ force: true });
  await expect(page.locator('#step-2')).toBeVisible();

  // Primer día con lugar (si el mes actual ya no tiene sábados, pasar al siguiente).
  let disponible = page.locator('.cal-dia[data-estado="disponible"]');
  if (await disponible.count() === 0) {
    await page.locator('#cal-next').click();
    disponible = page.locator('.cal-dia[data-estado="disponible"]');
  }
  const fecha = (await disponible.first().getAttribute('data-fecha'))!;
  expect(new Date(fecha + 'T00:00:00').getDay()).toBe(6); // sábado
  // Todos los días habilitados del calendario son sábados.
  for (const f of await disponible.evaluateAll(els => els.map(e => (e as HTMLElement).dataset.fecha!))) {
    expect(new Date(f + 'T00:00:00').getDay()).toBe(6);
  }

  // Teclado: las flechas mueven el foco entre días; Enter elige.
  const enfocado = () => page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset?.fecha ?? '');
  await disponible.first().focus();
  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => new Date((await enfocado()) + 'T00:00:00').getDay()).toBe(5); // viernes
  await page.keyboard.press('ArrowRight');
  await expect.poll(enfocado).toBe(fecha);
  await page.keyboard.press('Enter');

  // Sigue el flujo igual que con botones.
  await expect(page.locator('#step-3')).toBeVisible();
  await page.locator('#slots-list button:not([disabled])').first().click();
  const codigo = await completarDatosYConfirmar(page, 'Reserva por Calendario');
  const reservas = await leerColeccion(page, 'reservas');
  expect(reservas[codigo]).toMatchObject({ fecha, servicio_id: 'mesa-show', estado: 'confirmado' });

  await page.goto(`/la_usina/seguimiento.html?code=${codigo}`);
  await expect(page.locator('#r-codigo')).toHaveText(codigo);

  expect(errores, `Errores de consola: ${errores.join(' | ')}`).toEqual([]);
});

test('fuera de DEMO: no aparece el selector de vista y manda selector_fecha de turnos.json', async ({ page }) => {
  // Simula un cliente real: DEMO = false (en localhost sigue usando el mock) y el
  // dueño eligió "calendario" en su panel.
  await page.route('**/la_usina/agenda.html', async (route) => {
    const res = await route.fetch();
    await route.fulfill({ response: res, body: (await res.text()).replace('const DEMO = true;', 'const DEMO = false;') });
  });
  await page.route('**/la_usina/turnos.json', async (route) => {
    const res = await route.fetch();
    const json = await res.json();
    await route.fulfill({ response: res, json: { ...json, selector_fecha: 'calendario' } });
  });
  await abrirAgenda(page, 'privado-eventos');
  await expect(page.locator('#demo-vista')).toBeHidden();
  await expect(page.locator('#calendario')).toBeVisible();
  await expect(page.locator('#fechas-list')).toBeHidden();
});

/* ═══════════════════════════════ Eventos ═══════════════════════════════ */

test('evento.html carga el título, los dos tipos de entrada y siembra los cupos (solo demo)', async ({ page }) => {
  const errores = vigilarConsola(page);
  await page.goto('/la_usina/evento.html');
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator('#ev-nombre')).toContainText('Noche de Blues');
  await expect(page.locator('.opt-card')).toHaveCount(2);
  await expect(page.locator('.opt-card').first()).toContainText('80 disponibles');
  const cupos = await leerColeccion(page, 'cupos');
  expect(cupos.general).toMatchObject({ vendidas: 0, cupo_total: 80 });
  expect(cupos.consumicion).toMatchObject({ vendidas: 0, cupo_total: 40 });
  expect(errores, `Errores de consola: ${errores.join(' | ')}`).toEqual([]);
});

test('mi-entrada.html sin ?code en la URL pide el código manualmente', async ({ page }) => {
  await page.goto('/la_usina/mi-entrada.html');
  await expect(page.locator('#sin-codigo')).toBeVisible();
});

test('validar.html (demo) carga sin login con el input manual disponible y sin errores', async ({ page }) => {
  const errores = vigilarConsola(page);
  await page.goto('/la_usina/validar.html');
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator('#demo-aviso')).toBeVisible();
  await expect(page.locator('#staff-login')).toBeHidden();
  await expect(page.locator('#in-codigo')).toBeVisible();
  expect(errores, `Errores de consola: ${errores.join(' | ')}`).toEqual([]);
});

async function comprarEntrada(page: Page, tipoId: string, nombre: string) {
  await page.goto('/la_usina/evento.html');
  await page.locator(`.opt-card[data-tipo="${tipoId}"]`).click();
  await page.locator('#in-nombre').fill(nombre);
  await page.locator('#in-telefono').fill('02244 15-999-0000');
  await page.locator('#btn-confirmar').click();
  await expect(page.locator('#step-3')).toBeVisible();
  const codigo = ((await page.locator('#confirmado-codigo').textContent()) ?? '').trim();
  expect(codigo).toMatch(/^[A-HJ-NP-Z2-9]{9}$/);
  return codigo;
}

test('flujo completo: comprar entrada → código de 9 caracteres → sin QR hasta vendida → QR único → validar.html acepta una vez y rechaza la segunda', async ({ context }) => {
  const evento = await context.newPage();
  const errores = vigilarConsola(evento);
  const codigo = await comprarEntrada(evento, 'general', 'Compradora Test Playwright');
  expect(errores, `Errores de consola en evento.html: ${errores.join(' | ')}`).toEqual([]);

  // entradas/{codigo} (doc ID = código) + cupo descontado en la misma transacción.
  const entradas = await leerColeccion(evento, 'entradas');
  expect(entradas[codigo]).toMatchObject({ codigo, tipo_id: 'general', estado: 'pendiente_pago', validadaEn: null });
  expect(Object.keys(entradas[codigo]).sort()).toEqual(['codigo', 'comprador', 'creadoEn', 'estado', 'tipo_id', 'validadaEn']);
  expect((await leerColeccion(evento, 'cupos')).general).toMatchObject({ vendidas: 1, ultima_entrada: codigo });

  // mi-entrada.html: todavía pendiente de pago — el QR NUNCA se pinta en este estado.
  const miEntrada = await context.newPage();
  await miEntrada.goto(`/la_usina/mi-entrada.html?code=${codigo}`);
  await expect(miEntrada.locator('#estado-pendiente')).toBeVisible();
  await expect(miEntrada.locator('#p-tipo')).toHaveText('Entrada general');
  await expect(miEntrada.locator('#qrcode canvas, #qrcode img')).toHaveCount(0);

  // Simula al staff confirmando el pago desde el portal (pendiente_pago → vendida).
  await miEntrada.evaluate(([key, code]) => {
    const raw = JSON.parse(localStorage.getItem(key) || '{}');
    raw[code].estado = 'vendida';
    localStorage.setItem(key, JSON.stringify(raw));
    window.dispatchEvent(new StorageEvent('storage', { key }));
  }, [`${DB}:entradas`, codigo]);
  await expect(miEntrada.locator('#estado-vendida')).toBeVisible();
  await expect(miEntrada.locator('#qrcode canvas, #qrcode img')).not.toHaveCount(0);

  // validar.html: primer escaneo (código manual) → válida; segundo → YA FUE USADA.
  const validar = await context.newPage();
  const erroresV = vigilarConsola(validar);
  await validar.goto('/la_usina/validar.html');
  await validar.locator('#in-codigo').fill(codigo);
  await validar.locator('#in-codigo').press('Enter');
  await expect(validar.locator('#resultado-titulo')).toHaveText('ENTRADA VÁLIDA');
  await expect(validar.locator('#resultado-sub')).toContainText('Compradora Test Playwright');
  await validar.locator('#in-codigo').fill(codigo);
  await validar.locator('#in-codigo').press('Enter');
  await expect(validar.locator('#resultado-titulo')).toHaveText('YA FUE USADA');
  // Un código inexistente nunca pasa.
  await validar.locator('#in-codigo').fill('ABCDEFGH2');
  await validar.locator('#in-codigo').press('Enter');
  await expect(validar.locator('#resultado-titulo')).toHaveText('CÓDIGO NO ENCONTRADO');
  expect(erroresV, `Errores de consola en validar.html: ${erroresV.join(' | ')}`).toEqual([]);

  // mi-entrada refleja en vivo que ya fue usada.
  await expect(miEntrada.locator('#estado-validada')).toBeVisible();
});

test('demo: comprar entrada → "Simular pago confirmado" → aparece el QR → validar.html la acepta', async ({ context }) => {
  const evento = await context.newPage();
  const codigo = await comprarEntrada(evento, 'consumicion', 'Visitante Demo');

  const miEntrada = await context.newPage();
  await miEntrada.goto(`/la_usina/mi-entrada.html?code=${codigo}`);
  await expect(miEntrada.locator('#estado-pendiente')).toBeVisible();
  await miEntrada.locator('#btn-demo-pago').click();
  await expect(miEntrada.locator('#estado-vendida')).toBeVisible();
  await expect(miEntrada.locator('#qrcode canvas, #qrcode img')).not.toHaveCount(0);
  await expect(miEntrada.locator('#demo-validar-box a[href="./validar.html"]')).toBeVisible();

  const validar = await context.newPage();
  await validar.goto('/la_usina/validar.html');
  await validar.locator('#in-codigo').fill(codigo.toLowerCase().replace(/(.{3})/g, '$1 ')); // normaliza
  await validar.locator('#in-codigo').press('Enter');
  await expect(validar.locator('#resultado-titulo')).toHaveText('ENTRADA VÁLIDA');
});

test('anti-oversell: con un cupo de 1 sembrado en el test, la compra que excede se rechaza', async ({ context }) => {
  const a = await context.newPage();
  await a.goto('/la_usina/evento.html');
  await expect(a.locator('.opt-card')).toHaveCount(2);
  // El "staff" deja el tipo general con cupo 1 (como si lo hubiera configurado desde el portal).
  await escribirDoc(a, 'cupos', 'general', { vendidas: 0, cupo_total: 1 });

  // Dos compradores llegan al paso de datos con 1 lugar disponible.
  const b = await context.newPage();
  for (const p of [a, b]) {
    await p.goto('/la_usina/evento.html');
    await expect(p.locator('.opt-card[data-tipo="general"]')).toContainText('1 disponibles');
    await p.locator('.opt-card[data-tipo="general"]').click();
    await p.locator('#in-nombre').fill('Comprador');
    await p.locator('#in-telefono').fill('02244 15-999-0002');
  }
  await a.locator('#btn-confirmar').click();
  await expect(a.locator('#step-3')).toBeVisible();

  await b.locator('#btn-confirmar').click();
  await expect(b.locator('#error-box')).toContainText('Justo se agotó');
  await expect(b.locator('#step-1')).toBeVisible();
  await expect(b.locator('.opt-card[data-tipo="general"]')).toBeDisabled();
  await expect(b.locator('.opt-card[data-tipo="general"]')).toContainText('Agotado');

  const cupos = await leerColeccion(a, 'cupos');
  expect(cupos.general).toMatchObject({ vendidas: 1, cupo_total: 1 });
  const generales = Object.values(await leerColeccion(a, 'entradas')).filter((e: any) => e.tipo_id === 'general');
  expect(generales).toHaveLength(1);
});

/* ═══════════════════════ Panel (portal.html) ═══════════════════════ */

/**
 * El portal publica turnos.json/evento.json vía la API de GitHub (PAT). En el
 * test se intercepta api.github.com: los GET devuelven los JSON del repo y los
 * PUT se capturan para verificar qué se publicaría.
 */
async function abrirPortal(context: BrowserContext, puts: Array<{ path: string; json: any }>) {
  const page = await context.newPage();
  const errores = vigilarConsola(page);
  page.on('dialog', (d) => d.accept());
  await page.route('https://api.github.com/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.split('/contents/')[1];
    if (req.method() === 'GET') {
      const local = await page.request.get(`/${path.replace(/^pages\//, '')}`);
      const content = Buffer.from(await local.body()).toString('base64');
      await route.fulfill({ json: { content, sha: 'sha-' + path } });
    } else {
      const body = req.postDataJSON();
      puts.push({ path, json: JSON.parse(Buffer.from(body.content, 'base64').toString('utf8')) });
      await route.fulfill({ json: { content: { sha: 'sha-nuevo' } } });
    }
  });
  await page.goto('/la_usina/portal.html');
  await page.locator('#in-pat').fill('ghp_testplaywright');
  await page.locator('#in-pass').fill('contraseña-larga');
  await page.locator('#in-pass2').fill('contraseña-larga');
  await page.locator('#login-first button.btn').click();
  await expect(page.locator('#app-screen')).toBeVisible();
  await expect(page.locator('#save-status')).toHaveText('Sincronizado');
  return Object.assign(page, { errores });
}

test('portal: "Horario de atención" elige botones/calendario y lo publica en turnos.json', async ({ context }) => {
  const puts: Array<{ path: string; json: any }> = [];
  const portal = await abrirPortal(context, puts);
  await portal.locator('.tab-btn[data-tab="horario-atencion"]').click();
  await expect(portal.locator('input[name="selector_fecha"][value="botones"]')).toBeChecked();
  await portal.locator('label.opt-radio', { hasText: 'Calendario' }).click();
  await expect(portal.locator('#save-bar')).toBeVisible();
  await portal.locator('#save-bar button').click();
  await expect(portal.locator('#save-status')).toHaveText('Publicado ✓');
  const put = puts.find(p => p.path === 'pages/la_usina/turnos.json');
  expect(put?.json.selector_fecha).toBe('calendario');
  expect(put?.json.servicios).toHaveLength(2); // no pisó el resto del archivo
  expect(portal.errores, `Errores de consola: ${portal.errores.join(' | ')}`).toEqual([]);
});

test('portal: bloqueo manual llena el día en la agenda pública, quitarlo lo libera; alta manual y cancelar mantienen el contador', async ({ context }) => {
  const portal = await abrirPortal(context, []);
  await portal.locator('.tab-btn[data-tab="agenda"]').click();

  // Bloquea todo el horario del privado en su primera fecha que no sea hoy
  // (hoy puede tener horarios ya pasados según la hora a la que corra el test).
  await portal.locator('#bloqueo-servicio').selectOption('privado-eventos');
  const hoy = await portal.evaluate(() => (window as any).TurnosCore.hoyISO());
  const fechas = await portal.locator('#bloqueo-fecha option').evaluateAll(os => os.map(o => (o as HTMLOptionElement).value));
  const fecha = fechas.find(f => f && f !== hoy)!;
  await portal.locator('#bloqueo-fecha').selectOption(fecha);
  await portal.locator('#bloqueo-desde').fill('19:00');
  await portal.locator('#bloqueo-hasta').fill('23:00');
  await portal.locator('button', { hasText: 'Bloquear horario' }).click();
  await expect(portal.locator('#reservas-list')).toContainText('bloqueado');

  const agenda = await context.newPage();
  await abrirAgenda(agenda, 'privado-eventos');
  await expect(agenda.locator(`#fechas-list [data-fecha="${fecha}"]`)).toBeDisabled();

  // Quitar el bloqueo → el día vuelve a estar disponible.
  await portal.locator('#reservas-list [data-act="desbloquear"]').click();
  await expect(portal.locator('#reservas-list')).not.toContainText('bloqueado');
  await abrirAgenda(agenda, 'privado-eventos');
  await expect(agenda.locator(`#fechas-list [data-fecha="${fecha}"]`)).toBeEnabled();

  // Alta manual (reserva telefónica) del primer horario → el público lo ve ocupado.
  await portal.locator('#manual-servicio').selectOption('privado-eventos');
  await portal.locator('#manual-fecha').selectOption(fecha);
  await expect(portal.locator('#manual-slot option:not([disabled])').first()).toBeAttached();
  const hora = (await portal.locator('#manual-slot').inputValue()).split('|')[0];
  await portal.locator('#manual-nombre').fill('Reserva Telefónica');
  await portal.locator('#manual-telefono').fill('02244 15-555-1111');
  await portal.locator('button', { hasText: 'Agregar reserva' }).click();
  await expect(portal.locator('#reservas-list')).toContainText('Reserva Telefónica');
  await agenda.locator(`#fechas-list [data-fecha="${fecha}"]`).click();
  await expect(agenda.locator(`#slots-list [data-hora="${hora}"]`)).toBeDisabled();

  // Cancelarla desde el panel libera el lugar (contador vuelve a 0).
  await portal.locator('#reservas-list .reserva-row', { hasText: 'Reserva Telefónica' }).locator('[data-act="cancelar"]').click();
  await expect(portal.locator('#reservas-list')).toContainText('cancelado');
  const slots = await leerColeccion(portal, 'slots');
  expect(slots[`privado__${fecha}__${hora.replace(':', '')}`]).toMatchObject({ ocupados: 0, reservas: [], bloqueos: [] });
  await abrirAgenda(agenda, 'privado-eventos');
  await agenda.locator(`#fechas-list [data-fecha="${fecha}"]`).click();
  await expect(agenda.locator(`#slots-list [data-hora="${hora}"]`)).toBeEnabled();
  expect(portal.errores, `Errores de consola: ${portal.errores.join(' | ')}`).toEqual([]);
});

test('portal: cancelar una entrada devuelve el cupo', async ({ context }) => {
  const evento = await context.newPage();
  const codigo = await comprarEntrada(evento, 'general', 'Para Cancelar');
  expect((await leerColeccion(evento, 'cupos')).general.vendidas).toBe(1);

  const portal = await abrirPortal(context, []);
  await portal.locator('.tab-btn[data-tab="entradas"]').click();
  const fila = portal.locator('#entradas-list .reserva-row', { hasText: codigo });
  await expect(fila).toContainText('Entrada general');
  await fila.locator('[data-act="cancelar"]').click();
  await expect(fila).toContainText('cancelada');
  expect((await leerColeccion(portal, 'cupos')).general.vendidas).toBe(0);

  await evento.goto(`/la_usina/mi-entrada.html?code=${codigo}`);
  await expect(evento.locator('#estado-cancelada')).toBeVisible();
});
