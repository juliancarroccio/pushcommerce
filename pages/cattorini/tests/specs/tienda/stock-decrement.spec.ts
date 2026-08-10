import { test, expect } from '@playwright/test';
import { setupPage, getCollection } from '../../helpers/setup';
import { TiendaPage } from '../../pages/tienda.page';

/**
 * Cobertura end-to-end de la transacción de descuento de stock al confirmar
 * un pedido online (no solo el manual). Hasta ahora ningún test ejercitaba
 * este camino de verdad porque los carritos de fixture no traían `color`
 * (el mock de Firestore tampoco soportaba runTransaction/subcolecciones,
 * ver fixtures/firebase-mock.ts).
 */

const stockProducto1 = {
  '1': {
    variantes: {
      M: { Rojo: { cantidad: 3, hex: '#C0392B' } }
    }
  }
};

const cartConColor = [
  { key: '1__M__Rojo', id: 1, nombre: 'Camisa Oxford Blanca', categoria: 'Camisas', talle: 'M', color: 'Rojo', qty: 2, precio: 22000 }
];

test.describe('Descuento de stock al confirmar pedido online @tienda @checkout @stock', () => {

  test('confirmar pedido descuenta el stock real y registra el movimiento @critical', async ({ page }) => {
    await setupPage(page, {
      perfil: 'minorista', provincia: 'Buenos Aires', localidad: 'Bahía Blanca', zonaStatus: 'libre',
      cart: cartConColor,
      firebase: { collections: { pedidos: {}, stock: stockProducto1 } }
    });
    const tienda = new TiendaPage(page);
    await tienda.goto();
    await tienda.abrirCarrito();
    await tienda.elegirRetiro();
    await tienda.elegirPagoLocal();
    await tienda.inpNombre.fill('Cliente Con Stock');
    await tienda.confirmarPedido();
    await expect(tienda.confirmModal).toHaveClass(/open/);

    const stock: any = await getCollection(page, 'stock');
    expect(stock['1'].variantes.M.Rojo.cantidad).toBe(1); // 3 - 2

    const movimientos: any = await getCollection(page, 'stock/1/movimientos');
    const movs = Object.values(movimientos) as any[];
    expect(movs.length).toBe(1);
    expect(movs[0].delta).toBe(-2);
    expect(movs[0].motivo).toMatch(/^Venta #/);
  });

  test('sin stock suficiente, no crea el pedido ni descuenta nada', async ({ page }) => {
    const cartExcede = [
      { key: '1__M__Rojo', id: 1, nombre: 'Camisa Oxford Blanca', categoria: 'Camisas', talle: 'M', color: 'Rojo', qty: 5, precio: 22000 }
    ];
    await setupPage(page, {
      perfil: 'minorista', provincia: 'Buenos Aires', localidad: 'Bahía Blanca', zonaStatus: 'libre',
      cart: cartExcede,
      firebase: { collections: { pedidos: {}, stock: stockProducto1 } } // solo hay 3
    });
    const tienda = new TiendaPage(page);
    await tienda.goto();
    await tienda.abrirCarrito();
    await tienda.elegirRetiro();
    await tienda.elegirPagoLocal();
    await tienda.inpNombre.fill('Cliente Sin Stock');
    await tienda.confirmarPedido();

    await expect(tienda.confirmModal).not.toHaveClass(/open/);
    const pedidos = await getCollection(page, 'pedidos');
    expect(Object.keys(pedidos).length).toBe(0);
    const stock: any = await getCollection(page, 'stock');
    expect(stock['1'].variantes.M.Rojo.cantidad).toBe(3); // no se tocó
  });
});
