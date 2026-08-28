import { test, expect, Page, Locator } from '@playwright/test';
import { setupPage, getCollection, getGithubPuts } from '../../helpers/setup';
import { PortalPage } from '../../pages/portal.page';
import { productosJsonSample } from '../../fixtures/test-data';

/**
 * Dos bugs reales reportados por el cliente en producción, ambos con la
 * misma raíz: el stock (colores+cantidad por talle) vive en Firestore,
 * independiente de productos.json, y nada lo mantenía sincronizado con
 * los cambios que se hacían del lado del catálogo.
 *
 * Bug 1 — cambiar la guía de talles (o destildar un talle) dejaba el
 * talle viejo invisible en la UI de "Talles disponibles" (los chips solo
 * se generan para la guía ACTUAL) pero seguía vivo en talles_disponibles
 * y su color/stock seguía en Firestore — reaparecía en "Colores y stock
 * inicial" mezclado con los talles nuevos. Encima, borrar el producto no
 * limpiaba su doc de stock, y el próximo producto podía heredar el mismo
 * ID (nextId = max(ids)+1) y resucitar el fantasma.
 *
 * Bug 2 — un talle marcado como disponible sin ningún color cargado se
 * podía publicar igual, y en la tienda ese talle quedaba comprable sin
 * ningún control de stock (el mismo código que sostiene la compatibilidad
 * con productos viejos "sin control de stock" no puede distinguir eso de
 * "producto nuevo, tema olvidado").
 */

function base64ToJson(b64: string) {
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
}

function productBox(page: Page, label: string) {
  return page.locator('.expandable-head', { hasText: label }).locator('xpath=ancestor::div[2]');
}

function chip(scope: Locator, talle: string) {
  return scope.locator('.talle-chip').filter({ hasText: new RegExp(`^${talle}$`) });
}

function talleBox(scope: Locator, talle: string) {
  return scope.getByText(`Talle ${talle}`, { exact: true }).locator('xpath=..');
}

async function clickSwitch(container: Locator) {
  await container.locator('.slider').click();
}

/**
 * La guía "camisas" del fixture compartido (productosJsonSample) solo
 * define el talle M — insuficiente para probar destildar/cambiar entre
 * varios talles. Clonamos y la ampliamos a S/M/L para estos tests
 * puntuales, sin tocar el fixture compartido (lo usan muchos otros specs).
 */
function dataConGuiaCamisasAmplia() {
  const data = JSON.parse(JSON.stringify(productosJsonSample));
  data.guia_talles.camisas = { unidad: 'cm', medidas: ['Pecho'], tabla: { S: ['92'], M: ['96'], L: ['100'] } };
  const prod1 = data.categorias[0].productos.find((p: any) => p.id === 1);
  prod1.talles_disponibles = ['S', 'M', 'L'];
  return data;
}

test.describe('Bug 1 — talles/colores huérfanos al cambiar de guía o destildar @portal @catalogo @stock', () => {

  test('cambiar la guía de talles purga en Firestore los talles que quedan afuera de la guía nueva @critical', async ({ page }) => {
    await setupPage(page, {
      portalSession: true,
      githubData: dataConGuiaCamisasAmplia(),
      firebase: { collections: { stock: {
        '1': { variantes: {
          S: { Rojo: { cantidad: 3, hex: '#C0392B' } },
          M: { Azul: { cantidad: 5, hex: '#2980B9' } },
          L: { Verde: { cantidad: 2, hex: '#27AE60' } }
        } }
      } } }
    });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('catalogo');

    await page.locator('.expandable-head', { hasText: '#1 · Camisa Oxford Blanca' }).click();
    const box1 = productBox(page, '#1 · Camisa Oxford Blanca');

    await expect(talleBox(box1, 'S')).toBeVisible();
    await expect(talleBox(box1, 'M')).toBeVisible();
    await expect(talleBox(box1, 'L')).toBeVisible();

    // La guía "camisas_slim" del fixture solo define el talle M
    await box1.locator('select').selectOption('camisas_slim');

    // En la UI: S y L desaparecen de "Colores y stock inicial", M se mantiene
    await expect(talleBox(box1, 'S')).not.toBeVisible();
    await expect(talleBox(box1, 'L')).not.toBeVisible();
    await expect(talleBox(box1, 'M')).toBeVisible();

    // En Firestore: el fix purga los talles removidos, no solo los esconde
    await expect(async () => {
      const stock: any = await getCollection(page, 'stock');
      expect(stock['1'].variantes.S).toBeUndefined();
      expect(stock['1'].variantes.L).toBeUndefined();
      expect(stock['1'].variantes.M.Azul.cantidad).toBe(5); // el talle vigente no se toca
    }).toPass();

    const movimientos: any = await getCollection(page, 'stock/1/movimientos');
    const movs = Object.values(movimientos) as any[];
    expect(movs.some((m: any) => m.talle === 'S' && m.delta === -3 && m.motivo === 'Guía de talles cambiada')).toBe(true);
    expect(movs.some((m: any) => m.talle === 'L' && m.delta === -2 && m.motivo === 'Guía de talles cambiada')).toBe(true);
  });

  test('destildar un talle (sin cambiar de guía) también purga su color/stock @critical', async ({ page }) => {
    await setupPage(page, {
      portalSession: true,
      githubData: dataConGuiaCamisasAmplia(),
      firebase: { collections: { stock: {
        '1': { variantes: {
          S: { Rojo: { cantidad: 4, hex: '#C0392B' } },
          M: { Azul: { cantidad: 6, hex: '#2980B9' } }
        } }
      } } }
    });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('catalogo');

    await page.locator('.expandable-head', { hasText: '#1 · Camisa Oxford Blanca' }).click();
    const box1 = productBox(page, '#1 · Camisa Oxford Blanca');

    await expect(talleBox(box1, 'S')).toBeVisible();
    await chip(box1, 'S').click();

    await expect(talleBox(box1, 'S')).not.toBeVisible();
    await expect(talleBox(box1, 'M')).toBeVisible(); // no tocado

    await expect(async () => {
      const stock: any = await getCollection(page, 'stock');
      expect(stock['1'].variantes.S).toBeUndefined();
      expect(stock['1'].variantes.M.Azul.cantidad).toBe(6);
    }).toPass();

    const movimientos: any = await getCollection(page, 'stock/1/movimientos');
    const movs = Object.values(movimientos) as any[];
    expect(movs.some((m: any) => m.talle === 'S' && m.motivo === 'Talle deseleccionado en Catálogo')).toBe(true);
  });

  test('un producto nuevo NO hereda automáticamente la guía de talles de su categoría @critical', async ({ page }) => {
    await setupPage(page, { portalSession: true });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('catalogo');

    await page.locator('button', { hasText: '+ Producto' }).first().click();
    const nuevaBox = productBox(page, 'Producto nuevo');

    await expect(nuevaBox.locator('select')).toHaveValue('');
    await expect(nuevaBox.locator('option[value=""]')).toHaveText('— Elegí una guía de talles —');
    await expect(nuevaBox.getByText('Elegí una guía de talles arriba antes de marcar talles disponibles.')).toBeVisible();
  });

  test('eliminar un producto purga su doc de stock en Firestore', async ({ page }) => {
    await setupPage(page, {
      portalSession: true,
      firebase: { collections: { stock: {
        '4': { variantes: { '40': { Negro: { cantidad: 10, hex: '#000' } } } }
      } } }
    });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('catalogo');

    page.on('dialog', d => d.accept());
    await page.locator('.expandable-head', { hasText: '#4 · Pantalón de Vestir Negro' })
      .locator('xpath=ancestor::div[2]').getByText('Eliminar').click();

    await expect(async () => {
      const stock: any = await getCollection(page, 'stock');
      expect(stock['4']).toBeUndefined();
    }).toPass();
  });

  test('eliminar el producto de mayor ID y crear uno nuevo NO reutiliza ese ID (evita resucitar stock fantasma) @critical', async ({ page }) => {
    await setupPage(page, { portalSession: true }); // fixture trae ids 1, 2, 4 — el mayor es 4
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('catalogo');

    page.on('dialog', d => d.accept());
    await page.locator('.expandable-head', { hasText: '#4 · Pantalón de Vestir Negro' })
      .locator('xpath=ancestor::div[2]').getByText('Eliminar').click();
    await expect(page.locator('.expandable-head', { hasText: '#4 ·' })).not.toBeVisible();

    await page.locator('button', { hasText: '+ Producto' }).first().click();

    // Si reutilizara IDs (max(ids actuales tras el borrado)+1), el nuevo producto
    // sería #3 (el máximo que queda es 2) — el fix ancla el contador al máximo
    // que existía al ABRIR el portal (4), sin importar qué se borre después.
    await expect(page.locator('.expandable-head', { hasText: '#5 · Producto nuevo' })).toBeVisible();
    await expect(page.locator('.expandable-head', { hasText: '#4 · Producto nuevo' })).not.toBeVisible();
    await expect(page.locator('.expandable-head', { hasText: '#3 · Producto nuevo' })).not.toBeVisible();
  });
});

test.describe('Bug 2 — publicar con un talle disponible sin ningún color cargado @portal @catalogo @stock', () => {

  test('bloquea "Publicar cambios" si un producto con stock parcial tiene un talle sin color @critical', async ({ page }) => {
    await setupPage(page, {
      portalSession: true,
      // Producto 1 (talles_disponibles: S, M, L) solo tiene color cargado para S
      firebase: { collections: { stock: {
        '1': { variantes: { S: { Rojo: { cantidad: 3, hex: '#C0392B' } } } }
      } } }
    });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('catalogo');

    let alertMsg = '';
    page.on('dialog', async d => { alertMsg = d.message(); await d.accept(); });

    // Cualquier edición marca dirty y muestra la barra de publicar
    await clickSwitch(productBox(page, '#1 · Camisa Oxford Blanca').getByText('Dest.', { exact: true }));
    await expect(portal.saveBar).toBeVisible();
    await portal.publishBtn.click();

    await expect(async () => {
      expect(alertMsg).toContain('#1 · Camisa Oxford Blanca');
    }).toPass();
    expect(alertMsg).toContain('M');
    expect(alertMsg).toContain('L');

    // No debe haber publicado nada
    expect(getGithubPuts(page).length).toBe(0);
    await expect(portal.saveBar).toBeVisible(); // sigue con cambios sin publicar
  });

  test('publica normalmente si el producto no tiene NINGÚN color cargado (modo legado, sin bloquear)', async ({ page }) => {
    await setupPage(page, {
      portalSession: true,
      firebase: { collections: { stock: {} } } // nada cargado — modo legado
    });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('catalogo');

    let alertFired = false;
    page.on('dialog', async d => { alertFired = true; await d.accept(); });

    await clickSwitch(productBox(page, '#1 · Camisa Oxford Blanca').getByText('Dest.', { exact: true }));
    await portal.publishBtn.click();
    await expect(portal.saveStatus).toHaveText('Publicado ✓');
    expect(alertFired).toBe(false);
  });

  test('publica normalmente si todos los talles disponibles tienen al menos un color cargado', async ({ page }) => {
    await setupPage(page, {
      portalSession: true,
      firebase: { collections: { stock: {
        '1': { variantes: {
          S: { Rojo: { cantidad: 3, hex: '#C0392B' } },
          M: { Azul: { cantidad: 5, hex: '#2980B9' } },
          L: { Verde: { cantidad: 2, hex: '#27AE60' } }
        } }
      } } }
    });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('catalogo');

    let alertFired = false;
    page.on('dialog', async d => { alertFired = true; await d.accept(); });

    await clickSwitch(productBox(page, '#1 · Camisa Oxford Blanca').getByText('Dest.', { exact: true }));
    await portal.publishBtn.click();
    await expect(portal.saveStatus).toHaveText('Publicado ✓');
    expect(alertFired).toBe(false);
  });
});
