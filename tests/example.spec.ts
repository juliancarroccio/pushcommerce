import { test, expect } from '@playwright/test';

/**
 * Test de ejemplo mínimo — demuestra que la infraestructura de Playwright
 * funciona en este repo. NO es parte del testing real de ningún cliente.
 *
 * Usa pages/cincomentario/ (cliente demo, NO vendido) solo para LEER y
 * verificar que carga. No modificar esos archivos desde este test.
 *
 * Se navega vía http://localhost:4173 (ver playwright.config.ts: webServer
 * levanta `python3 -m http.server` sobre pages/), NO con file://, porque
 * la landing usa fetch() (productos.json) y fetch() no soporta file://.
 *
 * El estándar real que cada cliente nuevo debe cumplir vive en:
 * ~/.claude/skills/new_client/references/testing-playwright.md
 */

test('cincomentario/index.html carga el título y no tira errores de consola', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  await page.goto('/cincomentario/index.html');

  // El título de la página debe existir y no estar vacío.
  await expect(page).toHaveTitle(/.+/);

  // Sin errores de consola ni excepciones JS no capturadas.
  expect(consoleErrors, `Errores de consola encontrados: ${consoleErrors.join(' | ')}`).toEqual([]);
});
