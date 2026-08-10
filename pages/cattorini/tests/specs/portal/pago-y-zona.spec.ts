import { test, expect } from '@playwright/test';
import { setupPage, getGithubPuts } from '../../helpers/setup';
import { PortalPage } from '../../pages/portal.page';
import { solicitudPendienteSample } from '../../fixtures/test-data';

function base64ToJson(b64: string) {
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
}

test.describe('Portal — Datos de pago @portal @pago', () => {

  test('cargar titular y banco, publicar, persiste en config.pago @critical', async ({ page }) => {
    await setupPage(page, { portalSession: true });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('pago');

    await page.locator('[data-field="config.pago.titular"]').fill('Juan Cattorini');
    await page.locator('[data-field="config.pago.banco"]').fill('Banco Galicia');
    await expect(portal.saveBar).toBeVisible();
    await portal.publishBtn.click();
    await expect(portal.saveStatus).toHaveText('Publicado ✓');

    const puts = getGithubPuts(page);
    const published = base64ToJson(puts[0].content);
    expect(published.config.pago.titular).toBe('Juan Cattorini');
    expect(published.config.pago.banco).toBe('Banco Galicia');
  });
});

test.describe('Portal — Solicitudes: aviso de zona con mayorista activo @portal @solicitudes', () => {

  test('sin mayoristas activos en la zona, no muestra ningún aviso', async ({ page }) => {
    await setupPage(page, {
      portalSession: true,
      firebase: {
        collections: {
          solicitudes_mayoristas: { 'MAY-ABCD': solicitudPendienteSample },
          mayoristas_activos: {}
        }
      }
    });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('mayoristas');
    await portal.abrirSubtab('solicitudes');
    await expect(page.getByText('Ya hay')).not.toBeVisible();
  });

  test('con un mayorista activo en la misma localidad, avisa antes de resolver @critical', async ({ page }) => {
    // solicitudPendienteSample.solicitante vive en La Plata, Buenos Aires
    await setupPage(page, {
      portalSession: true,
      firebase: {
        collections: {
          solicitudes_mayoristas: { 'MAY-ABCD': solicitudPendienteSample },
          mayoristas_activos: {
            'hash-existente': { nombre: 'Otro Comercio', negocio: 'Textiles del Sur', localidad: 'La Plata', provincia: 'Buenos Aires' }
          }
        }
      }
    });
    const portal = new PortalPage(page);
    await portal.entrarComoAdmin();
    await portal.abrirTab('mayoristas');
    await portal.abrirSubtab('solicitudes');

    const warning = page.getByText(/Ya hay un mayorista activo en La Plata/);
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('Textiles del Sur');
  });
});
