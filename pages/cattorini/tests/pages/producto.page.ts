import { Page, Locator } from '@playwright/test';

export class ProductoPage {
  readonly page: Page;
  readonly loading: Locator;
  readonly notFound: Locator;
  readonly nombre: Locator;
  readonly precio: Locator;
  readonly desc: Locator;
  readonly talleSelected: Locator;
  readonly tallesGrid: Locator;
  readonly qtyInput: Locator;
  readonly addCartBtn: Locator;
  readonly guiaBtn: Locator;
  readonly modalGuia: Locator;
  readonly modalGuiaClose: Locator;
  readonly modalGuiaTabla: Locator;
  readonly galleryMain: Locator;
  readonly thumbs: Locator;
  readonly cartBtn: Locator;
  readonly cartCount: Locator;
  readonly drawer: Locator;
  readonly toast: Locator;

  // Checkout
  readonly togRetiro: Locator;
  readonly togEnvio: Locator;
  readonly togPagoLocal: Locator;
  readonly togPagoQr: Locator;
  readonly retiroPagoWrap: Locator;
  readonly inpNombre: Locator;
  readonly inpDireccion: Locator;
  readonly inpProvinciaEnvio: Locator;
  readonly inpLocalidadEnvio: Locator;
  readonly inpCp: Locator;
  readonly btnSend: Locator;
  readonly envioMayoHeader: Locator;
  readonly btnEditarDir: Locator;
  readonly mayoristaPanel: Locator;
  readonly mayoristaNombre: Locator;
  readonly mayoristaDir: Locator;
  readonly confirmModal: Locator;
  readonly confirmCode: Locator;
  readonly confirmPagoQr: Locator;
  readonly confirmMsg: Locator;
  readonly trackLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loading = page.locator('#loading');
    this.notFound = page.locator('#not-found');
    this.nombre = page.locator('#p-name');
    this.precio = page.locator('#p-price');
    this.desc = page.locator('#p-desc');
    this.talleSelected = page.locator('#talle-selected');
    this.tallesGrid = page.locator('#talles-grid');
    this.qtyInput = page.locator('#qty');
    this.addCartBtn = page.locator('#add-cart-btn');
    this.guiaBtn = page.locator('.guia-btn');
    this.modalGuia = page.locator('#modal-guia');
    this.modalGuiaClose = page.locator('#modal-guia .modal-close');
    this.modalGuiaTabla = page.locator('#guia-tabla');
    this.galleryMain = page.locator('#gallery-main');
    this.thumbs = page.locator('#gallery-thumbs .thumb');
    this.cartBtn = page.locator('.cart-btn');
    this.cartCount = page.locator('#cart-count');
    this.drawer = page.locator('#drawer');
    this.toast = page.locator('#toast');

    this.togRetiro = page.locator('#tog-retiro');
    this.togEnvio = page.locator('#tog-envio');
    this.togPagoLocal = page.locator('#tog-pago-local');
    this.togPagoQr = page.locator('#tog-pago-qr');
    this.retiroPagoWrap = page.locator('#retiro-pago-wrap');
    this.inpNombre = page.locator('#in-nombre');
    this.inpDireccion = page.locator('#in-direccion');
    this.inpProvinciaEnvio = page.locator('#in-provincia-envio');
    this.inpLocalidadEnvio = page.locator('#in-localidad-envio');
    this.inpCp = page.locator('#in-cp');
    this.btnSend = page.locator('#btn-send');
    this.envioMayoHeader = page.locator('#envio-mayo-header');
    this.btnEditarDir = page.locator('#btn-editar-dir');
    this.mayoristaPanel = page.locator('#mayorista-panel');
    this.mayoristaNombre = page.locator('#mayorista-nombre');
    this.mayoristaDir = page.locator('#mayorista-dir');
    this.confirmModal = page.locator('#confirm-modal');
    this.confirmCode = page.locator('#confirm-code');
    this.confirmPagoQr = page.locator('#confirm-pago-qr');
    this.confirmMsg = page.locator('#confirm-msg');
    this.trackLink = page.locator('#track-link');
  }

  async elegirRetiro() {
    await this.page.evaluate(() => (window as any).setEntrega('retiro'));
    await this.page.waitForTimeout(150);
  }

  async elegirEnvio() {
    await this.page.evaluate(() => (window as any).setEntrega('envio'));
    await this.page.waitForTimeout(200);
  }

  async elegirPagoLocal() {
    await this.page.evaluate(() => (window as any).setPagaEnLocal(true));
    await this.page.waitForTimeout(100);
  }

  async elegirPagoQr() {
    await this.page.evaluate(() => (window as any).setPagaEnLocal(false));
    await this.page.waitForTimeout(100);
  }

  async confirmarPedido() {
    await this.page.evaluate(() => (window as any).sendOrder());
  }

  async goto(id: number | string) {
    await this.page.goto(`/producto.html?id=${id}`);
  }

  async esperarCarga() {
    await this.nombre.waitFor({ state: 'visible' });
  }

  async elegirTalle(talle: string) {
    await this.tallesGrid.locator('button', { hasText: new RegExp(`^${talle}$`) }).click();
  }

  async setQty(n: number) {
    await this.qtyInput.fill(String(n));
  }

  async agregarAlCarrito() {
    await this.addCartBtn.click();
  }

  async abrirGuiaTalles() {
    await this.guiaBtn.click();
    await this.modalGuia.waitFor({ state: 'visible' });
  }

  async cerrarGuiaTalles() {
    await this.modalGuiaClose.click();
  }

  async abrirCarrito() {
    await this.cartBtn.click();
    await this.drawer.waitFor({ state: 'visible' });
  }
}
