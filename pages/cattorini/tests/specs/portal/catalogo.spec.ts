import { test, expect, Page } from '@playwright/test';
import { setupPage, getGithubPuts } from '../../helpers/setup';
import { PortalPage } from '../../pages/portal.page';

/**
 * Tab Catálogo del portal: buscador + acordeón, toggle "Fab. propia" y
 * guía de talles POR PRODUCTO (antes era por categoría — bug real, ver
 * CRITERIOS.txt). Usa el mock de la GitHub Contents API (setup.ts,
 * opts.githubData) para que loadRemote()/publishChanges() no toquen la
 * red real. productosJsonSample trae el producto #2 con tipo_talle propio
 * ("camisas_slim") distinto al de su categoría ("camisas") justamente para
 * poder probar el fallback y el override.
 */

function base64ToJson(b64: string) {
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
}

/**
 * El <div> de un producto (renderProductRow) no tiene clase ni id propios
 * — solo su cabecera ".expandable-head" es identificable. La cabecera vive
 * dos niveles de <div> por debajo del box del producto (title -> head ->
 * box), así que subimos por xpath en vez de usar ".item-row" (esa clase es
 * de la CATEGORÍA entera, que contiene a todos sus productos).
 */
function productBox(page: Page, label: string) {
  return page.locator('.expandable-head', { hasText: label }).locator('xpath=ancestor::div[2]');
}

/**
 * El toggle ".switch" oculta el <input type=checkbox> real (opacity:0,
 * width/height:0 — ver CSS de portal.html) y lo reemplaza visualmente por
 * el <span class="slider">. Playwright no puede clickear un elemento de
 * tamaño cero, así que hay que clickear el slider (el <label> lo reenvía
 * al input real, como cualquier checkbox nativo con label).
 */
async function clickSwitch(container: import('@playwright/test').Locator) {
  await container.locator('.slider').click();
}

test.describe('Portal — Catálogo @portal @catalogo', () => {

  test('el buscador filtra los productos mostrados', async ({ page }) => {
    await setupPage(page, { portalSession: true });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('catalogo');
    const lista = page.locator('#cat-list');
    await expect(lista.getByText('Camisa Oxford Blanca')).toBeVisible();
    await expect(lista.getByText('Pantalón de Vestir Negro')).toBeVisible();

    await page.locator('#cat-search').fill('Oxford');
    await expect(lista.getByText('Camisa Oxford Blanca')).toBeVisible();
    await expect(lista.getByText('Pantalón de Vestir Negro')).not.toBeVisible();
  });

  test('el producto arranca colapsado y la flechita indica que se puede desplegar @critical', async ({ page }) => {
    await setupPage(page, { portalSession: true });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('catalogo');

    const fila = page.locator('.expandable-head', { hasText: '#1 · Camisa Oxford Blanca' });
    const detalle = productBox(page, '#1 · Camisa Oxford Blanca').getByText('Guía de talles');
    await expect(fila).toContainText('▸');
    // El detalle (precio, guía de talles, etc.) no debe estar visible todavía
    await expect(detalle).not.toBeVisible();

    await fila.click();
    await expect(fila).toContainText('▾');
    await expect(detalle).toBeVisible();
  });

  test('guía de talles: cae a la de categoría si el producto no tiene una propia', async ({ page }) => {
    await setupPage(page, { portalSession: true });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('catalogo');

    await page.locator('.expandable-head', { hasText: '#1 · Camisa Oxford Blanca' }).click();
    // Producto 1 no tiene tipo_talle propio → hereda "camisas" de la categoría
    await expect(productBox(page, '#1 · Camisa Oxford Blanca').locator('select')).toHaveValue('camisas');
  });

  test('guía de talles: respeta el override del producto sobre el de su categoría @critical', async ({ page }) => {
    await setupPage(page, { portalSession: true });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('catalogo');

    await page.locator('.expandable-head', { hasText: '#2 · Camisa Slim Fit Negra' }).click();
    // Producto 2 tiene tipo_talle: "camisas_slim" propio, distinto al de la categoría ("camisas")
    await expect(productBox(page, '#2 · Camisa Slim Fit Negra').locator('select')).toHaveValue('camisas_slim');
  });

  test('cambiar la guía de talles de un producto y publicar persiste el cambio @critical', async ({ page }) => {
    await setupPage(page, { portalSession: true });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('catalogo');

    await page.locator('.expandable-head', { hasText: '#1 · Camisa Oxford Blanca' }).click();
    await productBox(page, '#1 · Camisa Oxford Blanca').locator('select').selectOption('camisas_slim');

    await expect(portal.saveBar).toBeVisible();
    await portal.publishBtn.click();
    await expect(portal.saveStatus).toHaveText('Publicado ✓');

    const puts = getGithubPuts(page);
    expect(puts.length).toBeGreaterThanOrEqual(1);
    const published = base64ToJson(puts[0].content);
    const prod1 = published.categorias[0].productos.find((p: any) => p.id === 1);
    expect(prod1.tipo_talle).toBe('camisas_slim');
  });

  test('apagar "Fab. propia" en un producto y publicar lo marca como no fabricado por Cattorini @critical', async ({ page }) => {
    await setupPage(page, { portalSession: true });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('catalogo');

    await clickSwitch(productBox(page, '#1 · Camisa Oxford Blanca').getByText('Fab. propia'));

    await portal.publishBtn.click();
    await expect(portal.saveStatus).toHaveText('Publicado ✓');
    const puts = getGithubPuts(page);
    const published = base64ToJson(puts[0].content);
    const prod1 = published.categorias[0].productos.find((p: any) => p.id === 1);
    expect(prod1.fabricacion_propia).toBe(false);
  });

  test('el producto marcado fabricacion_propia:false ya arranca con el switch apagado', async ({ page }) => {
    await setupPage(page, { portalSession: true });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('catalogo');

    const swInput = productBox(page, '#2 · Camisa Slim Fit Negra').getByText('Fab. propia').locator('input[type="checkbox"]');
    await expect(swInput).not.toBeChecked();
  });
});
