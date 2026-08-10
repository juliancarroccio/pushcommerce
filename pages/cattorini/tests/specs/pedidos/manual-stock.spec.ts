import { test, expect } from '@playwright/test';
import { setupPage, getCollection } from '../../helpers/setup';
import { PedidosPage } from '../../pages/pedidos.page';

/**
 * Carga manual de pedidos: antes no pedía color ni chequeaba stock, y el
 * selector de producto era un <select> gigante sin buscador. Cubrimos las
 * tres cosas: buscador, color dependiente del talle, y bloqueo/descuento
 * real de stock (vía la transacción de Firestore — de paso valida que el
 * mock ahora soporta runTransaction + subcolecciones).
 */

const stockProducto1 = {
  '1': {
    variantes: {
      M: {
        Rojo: { cantidad: 5, hex: '#C0392B' },
        Azul: { cantidad: 0, hex: '#2980B9' }
      }
    }
  }
};

test.describe('Pedido manual — buscador, color y stock @pedidos @manual @stock', () => {

  test('buscador filtra las opciones del select de producto', async ({ page }) => {
    await setupPage(page, {
      portalSession: true,
      firebase: { collections: { pedidos: {}, mayoristas_activos: {}, stock: stockProducto1 } }
    });
    const p = new PedidosPage(page);
    await p.goto();
    await page.locator('button', { hasText: '+ Manual' }).click();
    const totalInicial = (await p.mProducto.locator('option').count());
    await p.mProdSearch.fill('Jean Slim');
    await expect(async () => {
      const count = await p.mProducto.locator('option').count();
      expect(count).toBeLessThan(totalInicial);
      expect(count).toBeGreaterThan(0);
    }).toPass();
    const texts = await p.mProducto.locator('option').allTextContents();
    expect(texts.every(t => /jean slim/i.test(t))).toBe(true);
  });

  test('elegir producto con stock cargado muestra el selector de color', async ({ page }) => {
    await setupPage(page, {
      portalSession: true,
      firebase: { collections: { pedidos: {}, mayoristas_activos: {}, stock: stockProducto1 } }
    });
    const p = new PedidosPage(page);
    await p.goto();
    await page.locator('button', { hasText: '+ Manual' }).click();
    await p.mProducto.selectOption({ value: 'camisas__1' });
    await p.mTalle.selectOption('M');
    await expect(p.mColorWrap).toBeVisible();
    const opciones = await p.mColor.locator('option').allTextContents();
    expect(opciones.some(o => o.includes('Rojo'))).toBe(true);
    expect(opciones.some(o => o.includes('Azul'))).toBe(true);
    await expect(p.mStockInfo).toContainText(/5/);
  });

  test('no deja agregar más cantidad de la que hay en stock', async ({ page }) => {
    await setupPage(page, {
      portalSession: true,
      firebase: { collections: { pedidos: {}, mayoristas_activos: {}, stock: stockProducto1 } }
    });
    const p = new PedidosPage(page);
    await p.goto();
    await page.locator('button', { hasText: '+ Manual' }).click();
    await p.mProducto.selectOption({ value: 'camisas__1' });
    await p.mTalle.selectOption('M');
    await p.mColor.selectOption('Rojo');
    await p.mQty.fill('10'); // solo hay 5
    page.on('dialog', d => d.accept());
    await p.mAgregarBtn.click();
    await expect(p.mItems).toContainText('Sin items todavía.');
  });

  test('flujo completo: crea el pedido y descuenta el stock real en Firestore @critical', async ({ page }) => {
    await setupPage(page, {
      portalSession: true,
      firebase: { collections: { pedidos: {}, mayoristas_activos: {}, stock: stockProducto1 } }
    });
    const p = new PedidosPage(page);
    await p.goto();
    await page.locator('button', { hasText: '+ Manual' }).click();
    await p.mNombre.fill('Cliente Mostrador');
    await p.mProducto.selectOption({ value: 'camisas__1' });
    await p.mTalle.selectOption('M');
    await p.mColor.selectOption('Rojo');
    await p.mQty.fill('2');
    await p.mAgregarBtn.click();
    await expect(p.mItems).toContainText('Rojo');
    await p.mSubmitBtn.click();

    await expect(async () => {
      const pedidos = await getCollection(page, 'pedidos');
      expect(Object.keys(pedidos).length).toBe(1);
    }).toPass();

    const pedidos = await getCollection(page, 'pedidos');
    const doc: any = Object.values(pedidos)[0];
    expect(doc.items[0].color).toBe('Rojo');
    expect(doc.manual).toBe(true);

    const stock: any = await getCollection(page, 'stock');
    expect(stock['1'].variantes.M.Rojo.cantidad).toBe(3); // 5 - 2

    const movimientos: any = await getCollection(page, 'stock/1/movimientos');
    const movs = Object.values(movimientos) as any[];
    expect(movs.length).toBe(1);
    expect(movs[0].delta).toBe(-2);
    expect(movs[0].motivo).toContain('Venta manual');
  });

  test('sin stock suficiente, bloquea la creación del pedido y no descuenta nada', async ({ page }) => {
    await setupPage(page, {
      portalSession: true,
      firebase: { collections: { pedidos: {}, mayoristas_activos: {}, stock: stockProducto1 } }
    });
    const p = new PedidosPage(page);
    await p.goto();
    await page.locator('button', { hasText: '+ Manual' }).click();
    await p.mNombre.fill('Cliente Mostrador');
    await p.mProducto.selectOption({ value: 'camisas__1' });
    await p.mTalle.selectOption('M');
    await p.mColor.selectOption('Rojo');
    await p.mQty.fill('5'); // justo el máximo
    await p.mAgregarBtn.click();
    await expect(p.mItems).toContainText('Rojo');

    /* Otro admin/venta consume el stock entre que se agregó al carrito
       manual y se confirma — la transacción tiene que detectarlo igual. */
    await page.evaluate(() => (window as any).__firebaseMock.setDoc('stock', '1', {
      variantes: { M: { Rojo: { cantidad: 1, hex: '#C0392B' }, Azul: { cantidad: 0, hex: '#2980B9' } } }
    }));

    page.on('dialog', d => d.accept());
    await p.mSubmitBtn.click();

    const pedidos = await getCollection(page, 'pedidos');
    expect(Object.keys(pedidos).length).toBe(0);
    const stock: any = await getCollection(page, 'stock');
    expect(stock['1'].variantes.M.Rojo.cantidad).toBe(1); // no se tocó
  });

  test('producto sin stock cargado se sigue agregando sin selector de color (compatibilidad)', async ({ page }) => {
    await setupPage(page, {
      portalSession: true,
      firebase: { collections: { pedidos: {}, mayoristas_activos: {}, stock: {} } }
    });
    const p = new PedidosPage(page);
    await p.goto();
    await page.locator('button', { hasText: '+ Manual' }).click();
    await p.mProducto.selectOption({ value: 'camisas__1' });
    await p.mTalle.selectOption('M');
    await expect(p.mColorWrap).toBeHidden();
    await expect(p.mStockInfo).toContainText(/sin control de stock/i);
  });
});
