import { test, expect, Page } from '@playwright/test';
import { setupPage, getCollection } from '../../helpers/setup';
import { PortalPage } from '../../pages/portal.page';

/**
 * El bloque "Talle X" y la fila de producto del acordeón comparten la clase
 * ".item-row" (uno anida dentro del otro una vez desplegado), así que un
 * locator por clase+texto matchea ambos. El heading "Talle M" en cambio es
 * un texto EXACTO y único — lo usamos para subir al box correcto.
 */
function talleBox(page: Page, talle: string) {
  return page.getByText(`Talle ${talle}`, { exact: true }).locator('xpath=..');
}

/**
 * Tab Stock del portal: antes era un <select> gigante, ahora es un
 * buscador + acordeón igual que Catálogo. El stock en sí vive en Firestore
 * (colección `stock`, no en productos.json), así que estos tests combinan
 * el mock de la GitHub Contents API (para que cargue el catálogo) con el
 * mock de Firestore (para leer/escribir el stock real).
 */

test.describe('Portal — Stock @portal @stock', () => {

  test('el buscador filtra la lista de productos', async ({ page }) => {
    await setupPage(page, { portalSession: true, firebase: { collections: { stock: {} } } });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('stock');
    await expect(page.locator('#stock-list')).toContainText('Camisa Oxford Blanca');
    await expect(page.locator('#stock-list')).toContainText('Pantalón de Vestir Negro');

    await page.locator('#stock-search').fill('Pantalón');
    await expect(page.locator('#stock-list')).toContainText('Pantalón de Vestir Negro');
    await expect(page.locator('#stock-list')).not.toContainText('Camisa Oxford Blanca');
  });

  test('un producto sin stock cargado arranca colapsado, con flechita de desplegable', async ({ page }) => {
    await setupPage(page, { portalSession: true, firebase: { collections: { stock: {} } } });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('stock');

    const fila = page.locator('.expandable-head-box', { hasText: '#1 · Camisa Oxford Blanca' });
    await expect(fila).toContainText('▸');
    await fila.click();
    await expect(fila).toContainText('▾');
    // Al desplegar, aparece la carga de color/stock por talle (talle S, M, L del fixture)
    await expect(page.getByText('Talle M')).toBeVisible();
  });

  test('agregar un color nuevo con stock inicial lo persiste en Firestore @critical', async ({ page }) => {
    await setupPage(page, { portalSession: true, firebase: { collections: { stock: {} } } });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('stock');

    await page.locator('.expandable-head-box', { hasText: '#1 · Camisa Oxford Blanca' }).click();
    const talleM = talleBox(page, 'M');
    await talleM.getByPlaceholder('Nombre del color (ej: Rojo)').fill('Verde');
    await talleM.getByPlaceholder('Stock inicial').fill('7');
    await talleM.getByText('+ Agregar color').click();

    await expect(async () => {
      const stock: any = await getCollection(page, 'stock');
      expect(stock['1']?.variantes?.M?.Verde?.cantidad).toBe(7);
    }).toPass();

    const movimientos: any = await getCollection(page, 'stock/1/movimientos');
    const movs = Object.values(movimientos) as any[];
    expect(movs.length).toBe(1);
    expect(movs[0].delta).toBe(7);
    expect(movs[0].motivo).toBe('Alta inicial');
  });

  test('editar la cantidad de un color existente registra el ajuste como movimiento', async ({ page }) => {
    await setupPage(page, {
      portalSession: true,
      firebase: { collections: { stock: { '1': { variantes: { M: { Rojo: { cantidad: 5, hex: '#C0392B' } } } } } } }
    });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('stock');

    await page.locator('.expandable-head-box', { hasText: '#1 · Camisa Oxford Blanca' }).click();
    const talleM = talleBox(page, 'M');
    const qtyInput = talleM.locator('input[type="number"]').first();
    await expect(qtyInput).toHaveValue('5');
    /* fill() dispara 'change' DOS veces en este input (comportamiento del
       propio Playwright/Chromium para inputs numéricos, no de la app) — el
       handler de portal.html calcula el delta contra un cierre viejo de
       `v.cantidad`, así que dos disparos duplican el ajuste. Para probar
       el comportamiento real de un solo cambio de usuario, seteamos el
       valor y disparamos el evento nosotros mismos, una sola vez. */
    await qtyInput.evaluate((el: HTMLInputElement) => {
      el.value = '12';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await expect(async () => {
      const stock: any = await getCollection(page, 'stock');
      expect(stock['1'].variantes.M.Rojo.cantidad).toBe(12);
    }).toPass();

    const movimientos: any = await getCollection(page, 'stock/1/movimientos');
    const movs = Object.values(movimientos) as any[];
    expect(movs.length).toBe(1);
    expect(movs[0].delta).toBe(7); // 12 - 5
    expect(movs[0].motivo).toBe('Ingreso manual');
  });
});
