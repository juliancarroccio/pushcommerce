/**
 * Helper para inyectar el mock de Firebase en cada test antes de que
 * la página cargue el SDK real. También precarga localStorage/sessionStorage
 * con perfiles pre-configurados si el test lo pide.
 */
import { Page } from '@playwright/test';
import { firebaseMockScript, FirebaseMockState } from '../fixtures/firebase-mock';
import { CODIGO_MASTER_HASH, CODIGO_MAYO_INDIVIDUAL_HASH, productosJsonSample } from '../fixtures/test-data';

export interface SetupOptions {
  firebase?: FirebaseMockState;
  /** Perfil pre-configurado del cliente al abrir la página */
  perfil?: 'minorista' | 'mayorista' | null;
  /** Solo aplica si perfil = minorista */
  localidad?: string;
  provincia?: string;
  zonaStatus?: 'libre' | 'bloqueada';
  /** Solo aplica si perfil = mayorista con código individual */
  mayoristaData?: any;
  /** Solo aplica si perfil = mayorista */
  codigoHashValido?: string;
  /** Items pre-cargados en el carrito */
  cart?: Array<{ id: number; nombre: string; categoria: string; talle: string; qty: number; precio: number; imagen?: string }>;
  /** Códigos guardados en catt_mis_pedidos */
  misPedidos?: Array<{ code: string; docId: string | null; ts: number }>;
  /** Códigos guardados en catt_mis_solicitudes */
  misSolicitudes?: Array<{ code: string; docId: string | null; ts: number }>;
  /** Sesión activa del portal (PAT + password ya configurados) */
  portalSession?: boolean;
  /**
   * Datos que debe devolver el mock de la GitHub Contents API (ghGet de
   * portal.html) al hacer loadRemote(). Por default se sirve productosJsonSample
   * — pasar `false` explícito para dejar la API real sin mockear (no recomendado).
   */
  githubData?: any | false;
}

/**
 * Inicializa la página con el estado deseado.
 * DEBE llamarse antes de page.goto().
 */
export async function setupPage(page: Page, opts: SetupOptions = {}) {
  const firebase = opts.firebase || {};
  const script = firebaseMockScript(firebase);

  // 1a) Bloquear la carga del SDK real de Firebase para que no pise nuestro mock
  await page.route(/gstatic\.com\/firebasejs\//, route => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: '/* firebase SDK bloqueado por tests */'
  }));
  // Y también cualquier request a Firebase (por si algo se escapa)
  await page.route(/googleapis\.com/, route => route.fulfill({ status: 200, body: '{}' }));
  // Bloquear el Service Worker en tests para evitar cache stale y comportamientos inconsistentes
  await page.route('**/sw.js', route => route.fulfill({
    status: 200,
    contentType: 'text/javascript',
    body: '/* sw disabled in tests */'
  }));

  // 1c) Mockear la GitHub Contents API (ghGet/ghPut de portal.html) para que
  // loadRemote()/publishChanges() no peguen a la red real de api.github.com.
  // Los PUT (Publicar cambios / subir imagen) quedan en (page as any).__ghPuts
  // — ver getGithubPuts() más abajo — para que un test inspeccione qué se publicó.
  if (opts.githubData !== false) {
    const remoteData = opts.githubData !== undefined ? opts.githubData : productosJsonSample;
    const remoteContentB64 = Buffer.from(JSON.stringify(remoteData), 'utf-8').toString('base64');
    (page as any).__ghPuts = [];
    let putCount = 0;
    await page.route(/api\.github\.com\/repos\/.+\/contents\//, async route => {
      const req = route.request();
      if (req.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ content: remoteContentB64, sha: 'fake-sha-test', encoding: 'base64' })
        });
      } else if (req.method() === 'PUT') {
        putCount += 1;
        (page as any).__ghPuts.push(req.postDataJSON());
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ content: { sha: 'fake-sha-test-' + putCount } })
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
    });
  }

  // 1b) Inyectar mock de Firebase antes de que cargue nada
  await page.addInitScript({ content: script });

  // 2) Pre-configurar localStorage si viene el perfil
  const perfilCfg = {
    perfil: opts.perfil || null,
    localidad: opts.localidad || '',
    provincia: opts.provincia || '',
    zonaStatus: opts.zonaStatus || null,
    mayoristaData: opts.mayoristaData || null,
    codigoHashValido: opts.codigoHashValido || null,
    cart: opts.cart || null,
    misPedidos: opts.misPedidos || null,
    misSolicitudes: opts.misSolicitudes || null,
    portalSession: !!opts.portalSession
  };

  await page.addInitScript((cfg) => {
    try {
      if (cfg.perfil) {
        localStorage.setItem('catt_perfil', cfg.perfil);
        if (cfg.perfil === 'minorista') {
          if (cfg.localidad || cfg.provincia) {
            localStorage.setItem('catt_localidad', (cfg.localidad || '') + ', ' + (cfg.provincia || ''));
          }
          if (cfg.zonaStatus) localStorage.setItem('catt_zona_status', cfg.zonaStatus);
        }
        if (cfg.perfil === 'mayorista') {
          /* catt_codigo_valido_hash vive en localStorage (no sessionStorage):
             si quedaba en sessionStorage, el perfil se invalidaba solo con
             cerrar y reabrir el navegador (bug real, ya arreglado en el
             código — este fixture tiene que reflejar el storage correcto). */
          if (cfg.codigoHashValido) localStorage.setItem('catt_codigo_valido_hash', cfg.codigoHashValido);
          if (cfg.mayoristaData) localStorage.setItem('catt_mayorista_data', JSON.stringify(cfg.mayoristaData));
        }
      }
      if (cfg.cart) localStorage.setItem('catt_cart_v2', JSON.stringify(cfg.cart));
      if (cfg.misPedidos) localStorage.setItem('catt_mis_pedidos', JSON.stringify(cfg.misPedidos));
      if (cfg.misSolicitudes) localStorage.setItem('catt_mis_solicitudes', JSON.stringify(cfg.misSolicitudes));
      if (cfg.portalSession) {
        sessionStorage.setItem('catt_pat_session', 'ghp_fake_test_token_for_playwright');
        sessionStorage.setItem('catt_pedidos_session', 'ok');
      }
    } catch (e) { console.warn('setup init script error', e); }
  }, perfilCfg);
}

/** Helper para setear una colección de Firestore desde un test */
export async function setCollection(page: Page, name: string, docs: Record<string, any>) {
  await page.evaluate(({ n, d }) => (window as any).__firebaseMock.setCollection(n, d), { n: name, d: docs });
}

/** Helper para leer el estado actual de una colección */
export async function getCollection(page: Page, name: string) {
  return page.evaluate((n) => (window as any).__firebaseMock.getCollection(n), name);
}

/** Helper para leer los PUT hechos contra el mock de la GitHub Contents API */
export function getGithubPuts(page: Page): any[] {
  return (page as any).__ghPuts || [];
}

/** Helper: espera a que se complete cualquier animación en curso */
export async function waitAnimations(page: Page, ms = 300) {
  await page.waitForTimeout(ms);
}
