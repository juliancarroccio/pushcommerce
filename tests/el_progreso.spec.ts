import { test, expect } from '@playwright/test';

/**
 * Tests del cliente Supermercado El Progreso (demo inventado, módulo
 * Consulta de precios). Estándar: ~/.claude/skills/new_client/references/testing-playwright.md
 *
 * Navega vía http://localhost:4173 (ver playwright.config.ts), no file://,
 * porque consulta.html/panel.html usan fetch() y localStorage.
 */

test('el_progreso/index.html carga el título y no tira errores de consola', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.goto('/el_progreso/index.html');

  await expect(page).toHaveTitle(/.+/);
  expect(consoleErrors, `Errores de consola: ${consoleErrors.join(' | ')}`).toEqual([]);
});

test('consulta.html: el input tiene foco automático al cargar', async ({ page }) => {
  await page.goto('/el_progreso/consulta.html');
  await expect(page.locator('#codigo')).toBeFocused();
});

test('consulta.html: escanear un código válido muestra el producto y vacía el input', async ({ page }) => {
  await page.goto('/el_progreso/consulta.html');

  const input = page.locator('#codigo');
  await input.fill('7790070418014'); // Arroz Gallo Oro 1kg, $2450
  await input.press('Enter');

  await expect(page.locator('#resultado')).toContainText('Arroz Gallo Oro');
  await expect(page.locator('#resultado')).toContainText('2.450');
  await expect(input).toHaveValue('');
});

test('consulta.html: código inexistente muestra "no encontrado"', async ({ page }) => {
  await page.goto('/el_progreso/consulta.html');

  const input = page.locator('#codigo');
  await input.fill('0000000000000');
  await input.press('Enter');

  await expect(page.locator('#resultado')).toContainText(/no encontrado/i);
});

test('panel.html → consulta.html: un producto cargado en el ABM aparece al escanearlo', async ({ context }) => {
  const panel = await context.newPage();
  await panel.goto('/el_progreso/panel.html');

  // Alta de producto nuevo vía el form del panel.
  await panel.locator('#input-codigo').fill('9999999999999');
  await panel.locator('#input-nombre').fill('Producto Test Playwright');
  await panel.locator('#input-precio').fill('1234');
  await panel.locator('#btn-guardar').click();

  const consulta = await context.newPage();
  await consulta.goto('/el_progreso/consulta.html');
  const input = consulta.locator('#codigo');
  await input.fill('9999999999999');
  await input.press('Enter');

  await expect(consulta.locator('#resultado')).toContainText('Producto Test Playwright');
});
