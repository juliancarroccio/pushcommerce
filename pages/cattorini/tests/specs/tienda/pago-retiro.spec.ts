import { test, expect } from '@playwright/test';
import { setupPage, getCollection } from '../../helpers/setup';
import { TiendaPage } from '../../pages/tienda.page';

/**
 * Iteración 2: al retirar en el local, el cliente elige si paga ahí mismo
 * o electrónico (QR). Envío siempre es QR (decisión de producto ya cubierta
 * en checkout-minorista/mayorista). Acá cubrimos las 3 combinaciones:
 * retiro+local (sin QR), retiro+QR, envío (QR siempre).
 */

const cart = [
  { id: 1, nombre: 'Camisa Oxford Blanca', categoria: 'Camisas', talle: 'M', qty: 1, precio: 22000 }
];

test.describe('Pago en retiro vs QR @tienda @checkout', () => {

  test('retiro muestra el selector de pago, envío lo oculta @checkout', async ({ page }) => {
    await setupPage(page, {
      perfil: 'minorista', provincia: 'Buenos Aires', localidad: 'Bahía Blanca', zonaStatus: 'libre',
      cart
    });
    const tienda = new TiendaPage(page);
    await tienda.goto();
    await tienda.abrirCarrito();
    await tienda.elegirRetiro();
    await expect(tienda.retiroPagoWrap).toBeVisible();

    await tienda.elegirEnvio();
    await expect(tienda.retiroPagoWrap).toBeHidden();
  });

  test('retiro por defecto es "pago en el local" @checkout', async ({ page }) => {
    await setupPage(page, {
      perfil: 'minorista', provincia: 'Buenos Aires', localidad: 'Bahía Blanca', zonaStatus: 'libre',
      cart
    });
    const tienda = new TiendaPage(page);
    await tienda.goto();
    await tienda.abrirCarrito();
    await tienda.elegirRetiro();
    await expect(tienda.togPagoLocal).toHaveClass(/active/);
    await expect(tienda.togPagoQr).not.toHaveClass(/active/);
  });

  test('retiro + paga en el local: no muestra QR y guarda pagaEnLocal=true @checkout @critical', async ({ page }) => {
    await setupPage(page, {
      perfil: 'minorista', provincia: 'Buenos Aires', localidad: 'Bahía Blanca', zonaStatus: 'libre',
      cart
    });
    const tienda = new TiendaPage(page);
    await tienda.goto();
    await tienda.abrirCarrito();
    await tienda.elegirRetiro();
    await tienda.elegirPagoLocal();
    await tienda.inpNombre.fill('Juan Retiro Local');
    await tienda.confirmarPedido();

    await expect(tienda.confirmModal).toHaveClass(/open/);
    await expect(tienda.confirmPagoQr).toBeHidden();
    await expect(tienda.confirmMsg).toContainText(/espera de que lo confirmemos|retirarlo/i);

    const pedidos = await getCollection(page, 'pedidos');
    const docs = Object.values(pedidos) as any[];
    expect(docs.length).toBe(1);
    expect(docs[0].modalidad).toBe('retiro');
    expect(docs[0].pagaEnLocal).toBe(true);
  });

  test('retiro + pago QR: muestra el QR y guarda pagaEnLocal=false @checkout @critical', async ({ page }) => {
    await setupPage(page, {
      perfil: 'minorista', provincia: 'Buenos Aires', localidad: 'Bahía Blanca', zonaStatus: 'libre',
      cart
    });
    const tienda = new TiendaPage(page);
    await tienda.goto();
    await tienda.abrirCarrito();
    await tienda.elegirRetiro();
    await tienda.elegirPagoQr();
    await tienda.inpNombre.fill('Juan Retiro QR');
    await tienda.confirmarPedido();

    await expect(tienda.confirmModal).toHaveClass(/open/);
    await expect(tienda.confirmPagoQr).toBeVisible();
    await expect(tienda.confirmMsg).toContainText(/pendiente de pago/i);

    const pedidos = await getCollection(page, 'pedidos');
    const docs = Object.values(pedidos) as any[];
    expect(docs.length).toBe(1);
    expect(docs[0].modalidad).toBe('retiro');
    expect(docs[0].pagaEnLocal).toBe(false);
  });

  test('envío siempre muestra QR y guarda pagaEnLocal=false @checkout', async ({ page }) => {
    await setupPage(page, {
      perfil: 'minorista', provincia: 'Buenos Aires', localidad: 'Bahía Blanca', zonaStatus: 'libre',
      cart
    });
    const tienda = new TiendaPage(page);
    await tienda.goto();
    await tienda.abrirCarrito();
    await tienda.elegirEnvio();
    await tienda.llenarDatosMinorista({
      nombre: 'Juan Envio',
      direccion: 'Calle Falsa 123',
      provincia: 'Buenos Aires',
      localidad: 'Bahía Blanca'
    });
    await tienda.confirmarPedido();

    await expect(tienda.confirmModal).toHaveClass(/open/);
    await expect(tienda.confirmPagoQr).toBeVisible();

    const pedidos = await getCollection(page, 'pedidos');
    const docs = Object.values(pedidos) as any[];
    expect(docs.length).toBe(1);
    expect(docs[0].modalidad).toBe('envio');
    expect(docs[0].pagaEnLocal).toBe(false);
  });
});
