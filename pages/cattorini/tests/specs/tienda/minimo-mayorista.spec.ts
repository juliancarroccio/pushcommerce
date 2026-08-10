import { test, expect } from '@playwright/test';
import { setupPage, getCollection } from '../../helpers/setup';
import { TiendaPage } from '../../pages/tienda.page';
import { ProductoPage } from '../../pages/producto.page';
import { mayoristaSample, CODIGO_MASTER_HASH } from '../../fixtures/test-data';

/**
 * Mínimo de compra mayorista (config.mayoristas.minimo_compra, 100000 por
 * default en productos.json). Bug real: un mayorista pudo confirmar un
 * pedido de $60.000 sin ningún aviso ni bloqueo. Cubrimos tienda.html Y
 * producto.html (misma lección de la duplicación de checkout).
 */

const cartBajoMinimo = [
  { id: 1, nombre: 'Camisa Oxford Blanca', categoria: 'Camisas', talle: 'M', qty: 2, precio: 14500 } // 29000
];

test.describe('Mínimo de compra mayorista @tienda @checkout @mayorista', () => {

  test('tienda.html: bajo el mínimo muestra warning y deshabilita Confirmar @critical', async ({ page }) => {
    await setupPage(page, {
      perfil: 'mayorista', codigoHashValido: CODIGO_MASTER_HASH, mayoristaData: mayoristaSample,
      cart: cartBajoMinimo
    });
    const tienda = new TiendaPage(page);
    await tienda.goto();
    await tienda.abrirCarrito();
    await expect(page.locator('#minimo-warning')).toBeVisible();
    await expect(page.locator('#minimo-warning')).toContainText(/mínimo/i);
    await expect(tienda.btnSend).toBeDisabled();
  });

  test('tienda.html: minorista nunca ve el warning de mínimo mayorista', async ({ page }) => {
    await setupPage(page, {
      perfil: 'minorista', provincia: 'Buenos Aires', localidad: 'Bahía Blanca', zonaStatus: 'libre',
      cart: cartBajoMinimo
    });
    const tienda = new TiendaPage(page);
    await tienda.goto();
    await tienda.abrirCarrito();
    await expect(page.locator('#minimo-warning')).toBeHidden();
    await expect(tienda.btnSend).toBeEnabled();
  });

  test('tienda.html: llegando al mínimo se habilita y desaparece el warning', async ({ page }) => {
    const cartSuficiente = [
      { id: 1, nombre: 'Camisa Oxford Blanca', categoria: 'Camisas', talle: 'M', qty: 7, precio: 14500 } // 101500
    ];
    await setupPage(page, {
      perfil: 'mayorista', codigoHashValido: CODIGO_MASTER_HASH, mayoristaData: mayoristaSample,
      cart: cartSuficiente
    });
    const tienda = new TiendaPage(page);
    await tienda.goto();
    await tienda.abrirCarrito();
    await expect(page.locator('#minimo-warning')).toBeHidden();
    await expect(tienda.btnSend).toBeEnabled();
  });

  test('tienda.html: sendOrder bloquea aunque se fuerce el click (defensa real, no solo UI)', async ({ page }) => {
    await setupPage(page, {
      perfil: 'mayorista', codigoHashValido: CODIGO_MASTER_HASH, mayoristaData: mayoristaSample,
      cart: cartBajoMinimo
    });
    const tienda = new TiendaPage(page);
    await tienda.goto();
    await tienda.abrirCarrito();
    await tienda.elegirRetiro();
    await tienda.confirmarPedido(); // llama sendOrder() directo por JS, salteando el disabled del botón
    await expect(tienda.confirmModal).not.toHaveClass(/open/);
    const pedidos = await getCollection(page, 'pedidos');
    expect(Object.keys(pedidos).length).toBe(0);
  });

  test('producto.html: bajo el mínimo muestra warning y deshabilita Confirmar @critical', async ({ page }) => {
    await setupPage(page, {
      perfil: 'mayorista', codigoHashValido: CODIGO_MASTER_HASH, mayoristaData: mayoristaSample
    });
    const producto = new ProductoPage(page);
    await producto.goto(1);
    await producto.esperarCarga();
    await producto.elegirTalle('M');
    await producto.setQty(2); // 29000, bajo el mínimo
    await producto.agregarAlCarrito();
    await producto.abrirCarrito();
    await expect(page.locator('#minimo-warning')).toBeVisible();
    await expect(producto.btnSend).toBeDisabled();
  });
});
