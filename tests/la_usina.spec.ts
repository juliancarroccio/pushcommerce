import { test, expect } from '@playwright/test';

/**
 * Tests del cliente La Usina (demo inventado) — cubre los 3 módulos:
 * Landing + QR Menú (index.html, menu.html), Turnos (agenda.html) y
 * Eventos/Entradas (evento.html, mi-entrada.html, validar.html).
 *
 * Estándar: ~/.claude/skills/new_client/references/testing-playwright.md
 *
 * Navega vía http://localhost:4173 (ver playwright.config.ts), no file://,
 * porque todas estas páginas usan fetch() y/o el mock de Firestore en
 * localStorage (references/local-db-testing.md).
 */

test('index.html carga el título, el hero y no tira errores de consola', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.goto('/la_usina/index.html');

  await expect(page).toHaveTitle(/La Usina/);
  await expect(page.locator('#hero')).toBeVisible();

  expect(consoleErrors, `Errores de consola: ${consoleErrors.join(' | ')}`).toEqual([]);
});

test('menu.html (QR Menú) carga la carta sin carrito y no tira errores de consola', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.goto('/la_usina/menu.html');

  await expect(page).toHaveTitle(/Carta/);
  // El skeleton de carga debe resolver y mostrar las categorías reales.
  await expect(page.locator('#categorias')).toBeVisible();
  await expect(page.locator('#skeleton')).toBeHidden();
  // Es un menú de solo lectura: no debe existir ningún carrito/checkout.
  expect(await page.locator('text=/carrito|agregar al pedido|checkout/i').count()).toBe(0);

  expect(consoleErrors, `Errores de consola: ${consoleErrors.join(' | ')}`).toEqual([]);
});

test('agenda.html (Turnos): el wizard carga los servicios sin romperse', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.goto('/la_usina/agenda.html');

  await expect(page).toHaveTitle(/Reservá/);
  // Paso 1 del wizard: la lista de servicios (Mesa para la noche de show /
  // Privado para eventos) debe poblarse desde turnos.json.
  await expect(page.locator('#servicios-list')).toBeVisible();
  await expect(page.locator('#servicios-list >> text=Mesa')).toBeVisible();
  await expect(page.locator('#error-box')).toBeHidden();

  expect(consoleErrors, `Errores de consola: ${consoleErrors.join(' | ')}`).toEqual([]);
});

test('evento.html carga el título, los dos tipos de entrada y no tira errores de consola', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.goto('/la_usina/evento.html');

  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator('#ev-nombre')).toContainText('Noche de Blues');
  await expect(page.locator('.opt-card')).toHaveCount(2);

  expect(consoleErrors, `Errores de consola: ${consoleErrors.join(' | ')}`).toEqual([]);
});

test('mi-entrada.html sin ?code en la URL pide el código manualmente', async ({ page }) => {
  await page.goto('/la_usina/mi-entrada.html');
  await expect(page.locator('#sin-codigo')).toBeVisible();
});

test('validar.html carga con el input manual disponible y no tira errores de consola', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.goto('/la_usina/validar.html');

  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator('#in-codigo')).toBeVisible();

  expect(consoleErrors, `Errores de consola: ${consoleErrors.join(' | ')}`).toEqual([]);
});

test('flujo completo: comprar entrada → código de 9+ caracteres → sin QR hasta vendida → QR único → validar.html acepta una vez y rechaza la segunda', async ({ context }) => {
  const evento = await context.newPage();
  const consoleErrors: string[] = [];
  evento.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  evento.on('pageerror', (err) => consoleErrors.push(err.message));

  await evento.goto('/la_usina/evento.html');

  // Paso 1: elegir el primer tipo de entrada disponible (no agotado).
  await evento.locator('.opt-card:not(.agotado)').first().click();

  // Paso 2: datos del comprador.
  await evento.locator('#in-nombre').fill('Compradora Test Playwright');
  await evento.locator('#in-telefono').fill('02244 15-999-0000');
  await evento.locator('#btn-confirmar').click();

  // Paso 3: confirmación — código de 9+ caracteres (más largo que el de 5 de pedidos/turnos, ver module-eventos.md).
  await expect(evento.locator('#step-3')).toBeVisible();
  const codigoRaw = await evento.locator('#confirmado-codigo').textContent();
  const codigo = (codigoRaw ?? '').trim();
  expect(codigo.length).toBeGreaterThanOrEqual(9);

  expect(consoleErrors, `Errores de consola en evento.html: ${consoleErrors.join(' | ')}`).toEqual([]);

  // mi-entrada.html: todavía pendiente de pago — el QR NUNCA se pinta en este estado.
  const miEntrada = await context.newPage();
  await miEntrada.goto(`/la_usina/mi-entrada.html?code=${codigo}`);
  await expect(miEntrada.locator('#estado-pendiente')).toBeVisible();
  await expect(miEntrada.locator('#qrcode canvas, #qrcode img')).toHaveCount(0);

  // Simula al admin confirmando el pago desde el portal (pendiente_pago -> vendida),
  // igual que haría la tab "Entradas" de portal.html contra Firestore real.
  await miEntrada.evaluate((code) => {
    const KEY = 'mockdb:la-usina-demo:entradas';
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    for (const id in raw) {
      if (raw[id].codigo === code) raw[id].estado = 'vendida';
    }
    localStorage.setItem(KEY, JSON.stringify(raw));
    window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
  }, codigo);

  // Ahora sí: QR visible — recién cuando estado === 'vendida'.
  // qrcodejs pinta tanto <canvas> como <img> (fallback cross-browser) dentro
  // de #qrcode; lo que importa es que el contenedor dejó de estar vacío.
  await expect(miEntrada.locator('#estado-vendida')).toBeVisible();
  await expect(miEntrada.locator('#qrcode canvas, #qrcode img')).not.toHaveCount(0);

  // validar.html: primer escaneo (código manual) → entrada válida.
  const validar = await context.newPage();
  const validarErrors: string[] = [];
  validar.on('console', (msg) => { if (msg.type() === 'error') validarErrors.push(msg.text()); });
  validar.on('pageerror', (err) => validarErrors.push(err.message));

  await validar.goto('/la_usina/validar.html');
  await validar.locator('#in-codigo').fill(codigo);
  await validar.locator('#in-codigo').press('Enter');
  await expect(validar.locator('#resultado-titulo')).toHaveText('ENTRADA VÁLIDA');

  // Segundo intento con el MISMO código → rechazado, nunca se deja pasar dos veces.
  await validar.locator('#in-codigo').fill(codigo);
  await validar.locator('#in-codigo').press('Enter');
  await expect(validar.locator('#resultado-titulo')).toHaveText('YA FUE USADA');

  expect(validarErrors, `Errores de consola en validar.html: ${validarErrors.join(' | ')}`).toEqual([]);
});
