import { test, expect } from '@playwright/test';
import { setupPage, getCollection } from '../../helpers/setup';
import { ProductoPage } from '../../pages/producto.page';
import { mayoristaSample, CODIGO_MASTER_HASH } from '../../fixtures/test-data';

/**
 * El carrito/checkout de producto.html es una implementación DUPLICADA de la
 * de tienda.html (bug reportado: la lógica de mayoristas y pago no estaba
 * propagada ahí). Estos tests espejan checkout-mayorista.spec.ts y
 * pago-retiro.spec.ts pero entrando por producto.html, para que una futura
 * mejora en tienda.html no vuelva a quedar sin aplicar acá.
 */

test.describe('Checkout desde producto.html @producto @checkout', () => {

  test('panel mayorista aparece precargado también desde producto.html @mayorista @critical', async ({ page }) => {
    await setupPage(page, {
      perfil: 'mayorista',
      codigoHashValido: CODIGO_MASTER_HASH,
      mayoristaData: mayoristaSample
    });
    const producto = new ProductoPage(page);
    await producto.goto(1);
    await producto.esperarCarga();
    /* Sin items en el carrito, drawer-footer (y todo lo que tiene adentro,
       incluido el panel mayorista) queda oculto por el padre — hay que
       agregar algo primero. */
    await producto.elegirTalle('M');
    await producto.agregarAlCarrito();
    await producto.abrirCarrito();
    await expect(producto.mayoristaPanel).toBeVisible();
    await expect(producto.mayoristaNombre).toContainText(mayoristaSample.nombre);
    await expect(producto.inpNombre).toBeHidden();
  });

  test('envío con dirección del mayorista pre-llenada y deshabilitada @mayorista', async ({ page }) => {
    await setupPage(page, {
      perfil: 'mayorista', codigoHashValido: CODIGO_MASTER_HASH, mayoristaData: mayoristaSample
    });
    const producto = new ProductoPage(page);
    await producto.goto(1);
    await producto.esperarCarga();
    await producto.elegirTalle('M');
    await producto.agregarAlCarrito();
    await producto.abrirCarrito();
    await producto.elegirEnvio();
    await expect(producto.envioMayoHeader).toBeVisible();
    await expect(producto.inpDireccion).toHaveValue(mayoristaSample.direccion);
    await expect(producto.inpDireccion).toBeDisabled();
  });

  test('envío mayorista nunca se bonifica, aunque supere el mínimo gratis @mayorista @critical', async ({ page }) => {
    await setupPage(page, {
      perfil: 'mayorista', codigoHashValido: CODIGO_MASTER_HASH, mayoristaData: mayoristaSample
    });
    const producto = new ProductoPage(page);
    await producto.goto(1);
    await producto.esperarCarga();
    await producto.elegirTalle('M');
    await producto.setQty(10); // 10 × precio mayorista, muy por encima del umbral de envío gratis
    await producto.agregarAlCarrito();
    await producto.abrirCarrito();
    await producto.elegirEnvio();
    await expect(page.locator('#totals-box')).not.toContainText(/gratis/i);
  });

  test('retiro muestra el selector de pago local/QR también desde producto.html @checkout', async ({ page }) => {
    await setupPage(page, { perfil: 'minorista', provincia: 'Buenos Aires', localidad: 'Bahía Blanca', zonaStatus: 'libre' });
    const producto = new ProductoPage(page);
    await producto.goto(1);
    await producto.esperarCarga();
    await producto.elegirTalle('M');
    await producto.agregarAlCarrito();
    await producto.abrirCarrito();
    await producto.elegirRetiro();
    await expect(producto.retiroPagoWrap).toBeVisible();
    await expect(producto.togPagoLocal).toHaveClass(/active/);
  });

  test('retiro + pago QR desde producto.html muestra el QR al confirmar @checkout @critical', async ({ page }) => {
    await setupPage(page, { perfil: 'minorista', provincia: 'Buenos Aires', localidad: 'Bahía Blanca', zonaStatus: 'libre' });
    const producto = new ProductoPage(page);
    await producto.goto(1);
    await producto.esperarCarga();
    await producto.elegirTalle('M');
    await producto.agregarAlCarrito();
    await producto.abrirCarrito();
    await producto.elegirRetiro();
    await producto.elegirPagoQr();
    await producto.inpNombre.fill('Juan Producto QR');
    await producto.confirmarPedido();

    await expect(producto.confirmModal).toBeVisible({ timeout: 5000 });
    await expect(producto.confirmPagoQr).toBeVisible();

    const pedidos = await getCollection(page, 'pedidos');
    const docs = Object.values(pedidos) as any[];
    expect(docs.length).toBe(1);
    expect(docs[0].pagaEnLocal).toBe(false);
    expect(docs[0].items[0].talle).toBe('M');
  });

  test('flujo completo mayorista + envío usa datos del mayorista desde producto.html @mayorista @critical', async ({ page }) => {
    await setupPage(page, {
      perfil: 'mayorista', codigoHashValido: CODIGO_MASTER_HASH, mayoristaData: mayoristaSample
    });
    const producto = new ProductoPage(page);
    await producto.goto(1);
    await producto.esperarCarga();
    await producto.elegirTalle('M');
    /* 7 × 14500 = 101500, por encima del mínimo de compra mayorista */
    await producto.setQty(7);
    await producto.agregarAlCarrito();
    await producto.abrirCarrito();
    await producto.elegirEnvio();
    await producto.confirmarPedido();
    await expect(producto.confirmModal).toBeVisible({ timeout: 5000 });

    const pedidos = await getCollection(page, 'pedidos');
    const docs = Object.values(pedidos) as any[];
    expect(docs.length).toBe(1);
    expect(docs[0].cliente.nombre).toBe(mayoristaSample.nombre);
    expect(docs[0].cliente.negocio).toBe(mayoristaSample.negocio);
    expect(docs[0].cliente.perfil).toBe('mayorista');
    expect(docs[0].envio).toBeGreaterThan(0);
  });
});
