import { test, expect } from '@playwright/test';
import { setupPage } from '../../helpers/setup';
import { TiendaPage } from '../../pages/tienda.page';
import { ProductoPage } from '../../pages/producto.page';
import { mayoristaSample, CODIGO_MASTER_HASH } from '../../fixtures/test-data';

/**
 * Bug real: el banner de envío ("Envío gratis en compras superiores a
 * $80.000") se mostraba también a mayoristas, que nunca tienen envío
 * gratis — mensaje directamente falso para ese perfil.
 */

test.describe('Banner de envío según perfil @tienda @mayorista', () => {

  test('tienda.html: mayorista ve mensaje de envío sin mención de gratis', async ({ page }) => {
    await setupPage(page, {
      perfil: 'mayorista', codigoHashValido: CODIGO_MASTER_HASH, mayoristaData: mayoristaSample
    });
    const tienda = new TiendaPage(page);
    await tienda.goto();
    await expect(tienda.infoEnvio).not.toContainText(/gratis/i);
    await expect(tienda.infoEnvio).toContainText(/se suma al total/i);
  });

  test('tienda.html: minorista sigue viendo la leyenda de envío gratis', async ({ page }) => {
    await setupPage(page, { perfil: 'minorista', provincia: 'Buenos Aires', localidad: 'Bahía Blanca', zonaStatus: 'libre' });
    const tienda = new TiendaPage(page);
    await tienda.goto();
    await expect(tienda.infoEnvio).toContainText(/gratis/i);
  });

  test('producto.html: mayorista ve mensaje de envío sin mención de gratis', async ({ page }) => {
    await setupPage(page, {
      perfil: 'mayorista', codigoHashValido: CODIGO_MASTER_HASH, mayoristaData: mayoristaSample
    });
    const producto = new ProductoPage(page);
    await producto.goto(1);
    await producto.esperarCarga();
    await expect(page.locator('#envio-info')).not.toContainText(/gratis/i);
  });
});
