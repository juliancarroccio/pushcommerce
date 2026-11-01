import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'fs';

/**
 * Tests de "Invitame un café" (pages/invitame-cafe): index (POST al Worker),
 * gracias (estado vía onSnapshot) y panel + componente PagosPanel.
 *
 * Sin backend real: el Worker se simula con page.route y Firestore/Auth con un
 * stub del SDK compat servido en lugar del CDN de Firebase. La config
 * (pagos-config.js / firebase-init.js) trae TODO_*: se la reescribe por ruta
 * para simular "ya configurado"; sin reescribir se prueba el modo "Muy pronto".
 * Contrato: ~/Documents/repos/lfs-pagos/CONTRATO.md
 */

test.use({ serviceWorkers: 'block' }); // que el sw.js no tape page.route

const WORKER = 'https://worker.test';
const INIT_POINT = 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=PREF123';

/** Stub mínimo del SDK de Firebase (firestore + auth) sobre window.__db. */
const FIREBASE_STUB = `
(function () {
  const db = window.__db;
  const listeners = [];
  const snapDoc = (id, data) => ({ id, exists: data !== undefined, data: () => data });
  const lista = col => Object.entries(db[col] || {})
    .sort((a, b) => String(b[1].creadoEn).localeCompare(String(a[1].creadoEn)))
    .map(([id, d]) => snapDoc(id, d));
  function colRef(col) {
    return {
      orderBy() { return this; },
      limit() { return this; },
      onSnapshot(ok) {
        const l = { tipo: 'col', col, ok };
        listeners.push(l);
        setTimeout(() => ok({ docs: lista(col) }), 0);
        return () => { l.ok = () => {}; };
      },
      doc(id) {
        return {
          onSnapshot(ok) {
            const l = { tipo: 'doc', col, id, ok };
            listeners.push(l);
            setTimeout(() => ok(snapDoc(id, (db[col] || {})[id])), 0);
            return () => { l.ok = () => {}; };
          },
          collection(sub) {
            return { get: async () => ({ docs: Object.entries((db.pagos || {})[id] || {}).map(([pid, d]) => snapDoc(pid, d)) }) };
          },
        };
      },
    };
  }
  window.__emitir = (col, id, data) => {
    db[col][id] = data;
    listeners.forEach(l => {
      if (l.col !== col) return;
      if (l.tipo === 'doc' && l.id === id) l.ok(snapDoc(id, data));
      if (l.tipo === 'col') l.ok({ docs: lista(col) });
    });
  };
  let cbAuth = null;
  window.firebase = {
    initializeApp() {},
    firestore: () => ({ collection: colRef }),
    auth: () => ({
      onAuthStateChanged(cb) { cbAuth = cb; setTimeout(() => cb(window.__user || null), 0); },
      async signInWithEmailAndPassword(email, pass) {
        if (pass !== 'ok') throw new Error('bad');
        window.__user = { email }; cbAuth && cbAuth(window.__user);
      },
      async signOut() { window.__user = null; cbAuth && cbAuth(null); },
    }),
  };
})();
`;

type Datos = { aportes?: Record<string, any>; pagos?: Record<string, any>; user?: any };

async function instalarFirebase(page: Page, datos: Datos = {}) {
  await page.addInitScript((d) => {
    (window as any).__db = { aportes: d.aportes || {}, pagos: d.pagos || {} };
    (window as any).__user = d.user || null;
  }, datos);
  await page.route('**/firebase-app-compat.js', (r) => r.fulfill({ contentType: 'text/javascript', body: FIREBASE_STUB }));
  await page.route('**/firebase-firestore-compat.js', (r) => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('**/firebase-auth-compat.js', (r) => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('**/invitame-cafe/firebase-init.js', async (r) => {
    const res = await r.fetch();
    await r.fulfill({ response: res, body: (await res.text()).replace(/TODO_REEMPLAZAR/g, 'test') });
  });
}

async function workerConfigurado(page: Page) {
  await page.route('**/invitame-cafe/pagos-config.js', (r) =>
    r.fulfill({ contentType: 'text/javascript', body: `const WORKER_URL='${WORKER}'; const WORKER_LISTO=true;` }));
}

function aporte(estado: string, extra: any = {}, pago: any = {}) {
  return {
    opcion: 'cortado', titulo: 'Café con medialuna', monto: 150, nombre: 'Ana', mensaje: 'Gracias!',
    creadoEn: '2026-10-30T12:00:00Z', pago: { metodo: 'mercadopago', estado, ...pago }, ...extra,
  };
}

async function sinOverflow(page: Page) {
  const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(sw).toBeLessThanOrEqual(iw);
}

/* ═══════════════════════════ index ═══════════════════════════ */
test.describe('index', () => {
  test('sin Worker configurado muestra "Muy pronto" y no el botón', async ({ page }) => {
    await page.goto('/invitame-cafe/index.html');
    await expect(page.locator('#pronto')).toBeVisible();
    await expect(page.locator('#btn')).toBeHidden();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });

  test('4 tarjetas con montos; elegir una y el POST NO lleva monto', async ({ page }) => {
    await workerConfigurado(page);
    let body: any = null;
    await page.route(WORKER + '/v1/aportes', async (r) => {
      body = r.request().postDataJSON();
      await r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ codigo: 'K7M2QX9PAB', init_point: INIT_POINT, monto: 200 }) });
    });
    await page.route('https://www.mercadopago.com.ar/**', (r) => r.fulfill({ body: 'MP' }));
    await page.goto('/invitame-cafe/index.html');
    await expect(page.locator('.opcion')).toHaveCount(4);
    await expect(page.locator('[data-opcion="cafe"] .precio')).toHaveText('$100');
    await expect(page.locator('[data-opcion="almuerzo"] .precio')).toHaveText('$300');
    await page.locator('[data-opcion="desayuno"]').click();
    await expect(page.locator('[data-opcion="desayuno"]')).toHaveAttribute('aria-checked', 'true');
    await page.locator('#nombre').fill('Ana');
    await page.locator('#mensaje').fill('hola');
    await expect(page.locator('#cuenta')).toHaveText('4/140');
    await page.locator('#btn').click();
    await page.waitForURL(INIT_POINT);
    expect(body).toEqual({ opcion: 'desayuno', nombre: 'Ana', mensaje: 'hola' });
    expect(Object.keys(body)).not.toContain('monto');
    // código guardado antes de redirigir
    await page.goBack();
    expect(await page.evaluate(() => localStorage.getItem('lfs_cafe_codigo'))).toBe('K7M2QX9PAB');
  });

  test('error 502 muestra mensaje y permite reintentar', async ({ page }) => {
    await workerConfigurado(page);
    let n = 0;
    await page.route(WORKER + '/v1/aportes', (r) => {
      n++;
      if (n === 1) return r.fulfill({ status: 502, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{}' });
      return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ codigo: 'ABCDEFGH23', init_point: INIT_POINT, monto: 100 }) });
    });
    await page.route('https://www.mercadopago.com.ar/**', (r) => r.fulfill({ body: 'MP' }));
    await page.goto('/invitame-cafe/index.html');
    await page.locator('#btn').click();
    await expect(page.locator('#error')).toContainText('No se cobró nada');
    await expect(page.locator('#btn')).toBeEnabled();
    await page.locator('#btn').click();
    await page.waitForURL(INIT_POINT);
    expect(n).toBe(2);
  });

  test('422, 429 y error de red muestran mensajes claros', async ({ page }) => {
    await workerConfigurado(page);
    const respuestas: any[] = [{ status: 422 }, { status: 429 }, 'abort'];
    await page.route(WORKER + '/v1/aportes', (r) => {
      const x = respuestas.shift();
      if (x === 'abort') return r.abort('failed');
      return r.fulfill({ status: x.status, headers: { 'access-control-allow-origin': '*' }, body: '{}' });
    });
    await page.goto('/invitame-cafe/index.html');
    await page.locator('#btn').click();
    await expect(page.locator('#error')).toContainText('no está disponible');
    await page.locator('#btn').click();
    await expect(page.locator('#error')).toContainText('Demasiados intentos');
    await page.locator('#btn').click();
    await expect(page.locator('#error')).toContainText('conectar');
  });

  test('el botón se deshabilita con spinner mientras espera (sin doble envío)', async ({ page }) => {
    await workerConfigurado(page);
    let n = 0;
    await page.route(WORKER + '/v1/aportes', async (r) => {
      n++;
      await new Promise((ok) => setTimeout(ok, 500));
      await r.fulfill({ status: 500, headers: { 'access-control-allow-origin': '*' }, body: '{}' });
    });
    await page.goto('/invitame-cafe/index.html');
    await page.locator('#btn').click();
    await expect(page.locator('#btn')).toBeDisabled();
    await expect(page.locator('#btn .spinner')).toBeVisible();
    await page.locator('#btn').click({ force: true, trial: false }).catch(() => {});
    await expect(page.locator('#error')).toBeVisible();
    expect(n).toBe(1);
  });

  test('?opcion=almuerzo preselecciona; una opción inválida cae en la default', async ({ page }) => {
    await page.goto('/invitame-cafe/index.html?opcion=almuerzo');
    await expect(page.locator('[data-opcion="almuerzo"]')).toHaveAttribute('aria-checked', 'true');
    await page.goto('/invitame-cafe/index.html?opcion=<x>');
    await expect(page.locator('[data-opcion="cafe"]')).toHaveAttribute('aria-checked', 'true');
  });

  test('init_point que no es de MercadoPago se rechaza (no redirige)', async ({ page }) => {
    await workerConfigurado(page);
    await page.route(WORKER + '/v1/aportes', (r) => r.fulfill({ status: 200, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ codigo: 'ABCDEFGH23', init_point: 'https://evil.example/x' }) }));
    await page.goto('/invitame-cafe/index.html');
    await page.locator('#btn').click();
    await expect(page.locator('#error')).toContainText('inesperada');
    expect(page.url()).toContain('/invitame-cafe/index.html');
  });

  test('sin overflow horizontal a 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await workerConfigurado(page);
    await page.goto('/invitame-cafe/index.html');
    await sinOverflow(page);
  });
});

/* ═══════════════════════════ gracias ═══════════════════════════ */
test.describe('gracias', () => {
  test('?status=approved de MP con doc "iniciado" NO muestra pagado', async ({ page }) => {
    await instalarFirebase(page, { aportes: { ABCDEFGH23: aporte('iniciado') } });
    await page.goto('/invitame-cafe/gracias.html?code=ABCDEFGH23&status=approved&collection_status=approved&payment_id=999');
    await expect(page.locator('#estado')).toContainText('Confirmando tu pago');
    await expect(page.locator('#estado')).not.toContainText('Gracias');
    await expect(page.locator('#estado')).not.toContainText('recibido');
  });

  test('pasa de iniciado a aprobado en vivo (onSnapshot) y escapa nombre/mensaje', async ({ page }) => {
    await instalarFirebase(page, { aportes: { ABCDEFGH23: aporte('iniciado') } });
    await page.goto('/invitame-cafe/gracias.html?code=ABCDEFGH23');
    await expect(page.locator('#estado')).toContainText('Confirmando');
    await page.evaluate((a) => (window as any).__emitir('aportes', 'ABCDEFGH23', a),
      aporte('aprobado', { nombre: '<img src=x onerror=window.__xss=1>', mensaje: '<script>window.__xss=1</script>' }));
    await expect(page.locator('#estado h1')).toContainText('¡Gracias');
    await expect(page.locator('#estado')).toContainText('Pago recibido');
    expect(await page.locator('#estado img, #estado script').count()).toBe(0);
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();
    await expect(page.locator('#estado')).toContainText('<script>window.__xss=1</script>');
  });

  test('rechazado muestra motivo y "Probar de nuevo" a index con la opción', async ({ page }) => {
    await instalarFirebase(page, { aportes: { ABCDEFGH23: aporte('rechazado', {}, { mpStatusDetail: 'cc_rejected_insufficient_amount' }) } });
    await page.goto('/invitame-cafe/gracias.html?code=abcdefgh23');
    await expect(page.locator('#estado')).toContainText('Pago rechazado: fondos insuficientes');
    const a = page.locator('#estado a', { hasText: 'Probar de nuevo' });
    await expect(a).toHaveAttribute('href', './index.html?opcion=cortado');
  });

  test('cancelado y vencido ofrecen reintento; pendiente no', async ({ page }) => {
    await instalarFirebase(page, { aportes: { AAAAAAAA22: aporte('cancelado'), BBBBBBBB22: aporte('vencido'), CCCCCCCC22: aporte('pendiente') } });
    await page.goto('/invitame-cafe/gracias.html?code=AAAAAAAA22');
    await expect(page.locator('#estado')).toContainText('El pago se canceló');
    await expect(page.getByText('Probar de nuevo')).toBeVisible();
    await page.goto('/invitame-cafe/gracias.html?code=BBBBBBBB22');
    await expect(page.getByText('Probar de nuevo')).toBeVisible();
    await page.goto('/invitame-cafe/gracias.html?code=CCCCCCCC22');
    await expect(page.locator('#estado')).toContainText('pendiente de acreditación');
    await expect(page.getByText('Probar de nuevo')).toHaveCount(0);
  });

  test('a los 60 s sin confirmación avisa que se actualiza solo', async ({ page }) => {
    await page.clock.install();
    await instalarFirebase(page, { aportes: { ABCDEFGH23: aporte('iniciado') } });
    await page.goto('/invitame-cafe/gracias.html?code=ABCDEFGH23');
    await expect(page.locator('#estado')).toContainText('Confirmando');
    await page.clock.fastForward(61_000);
    await expect(page.locator('#estado')).toContainText('se actualiza solo');
  });

  test('código inexistente o ausente: mensaje y link al inicio', async ({ page }) => {
    await instalarFirebase(page, { aportes: {} });
    await page.goto('/invitame-cafe/gracias.html?code=ZZZZZZZZ22');
    await expect(page.locator('#estado')).toContainText('No encontramos ese aporte');
    await expect(page.locator('#estado a')).toHaveAttribute('href', './index.html');
    await page.goto('/invitame-cafe/gracias.html');
    await expect(page.locator('#estado')).toContainText('No encontramos ese aporte');
  });

  test('sin overflow a 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await instalarFirebase(page, { aportes: { ABCDEFGH23: aporte('aprobado', { mensaje: 'x'.repeat(140) }) } });
    await page.goto('/invitame-cafe/gracias.html?code=ABCDEFGH23');
    await expect(page.locator('#estado h1')).toContainText('Gracias');
    await sinOverflow(page);
  });
});

/* ═══════════════════════════ panel + PagosPanel ═══════════════════════════ */
const DOCS = {
  AAAAAAAA22: aporte('aprobado', { creadoEn: '2026-10-30T12:00:00Z' }, { medio: 'credit_card', cuotas: 3, paymentId: '111' }),
  BBBBBBBB22: aporte('rechazado', { creadoEn: '2026-10-30T11:00:00Z' }),
  CCCCCCCC22: aporte('en_revision', { creadoEn: '2026-10-30T10:00:00Z' }),
  DDDDDDDD22: aporte('aprobado', { monto: 300, creadoEn: '2026-10-30T09:00:00Z', nombre: '<script>window.__xss=1</script>', mensaje: '<img src=x onerror=window.__xss=1>' },
    { alerta: 'pago_duplicado', paymentId: '=HYPERLINK("x")' }),
};
const PAGOS = { AAAAAAAA22: { 111: { status: 'approved', transaction_amount: 150, net_received_amount: 143.5, fee: 6.5, installments: 3, payment_type_id: 'credit_card', payment_method_id: 'visa' } } };

test.describe('panel', () => {
  test('sin Firebase configurado no se rompe', async ({ page }) => {
    await page.goto('/invitame-cafe/panel.html');
    await expect(page.locator('#pronto')).toBeVisible();
  });

  test('login staff y lista de aportes (nombre/mensaje con HTML se escapan)', async ({ page }) => {
    await instalarFirebase(page, { aportes: DOCS, pagos: PAGOS });
    await page.goto('/invitame-cafe/panel.html');
    await expect(page.locator('#login')).toBeVisible();
    await page.locator('#email').fill('yo@x.com');
    await page.locator('#clave').fill('mala');
    await page.locator('#login-btn').click();
    await expect(page.locator('#login-error')).toBeVisible();
    await page.locator('#clave').fill('ok');
    await page.locator('#login-btn').click();
    await expect(page.locator('.pp-fila')).toHaveCount(4);
    // título del doc con <script>: texto, no HTML
    await expect(page.locator('.pp-tit').nth(3)).toContainText('<script>window.__xss=1</script>');
    await page.locator('.pp-fila').nth(3).locator('[data-pp="det"]').click();
    await expect(page.locator('.pp-det')).toContainText('<img src=x onerror=window.__xss=1>');
    expect(await page.locator('.pp img, .pp script').count()).toBe(0);
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();
    // no existe botón para marcar pagado
    await expect(page.getByText(/marcar.*pagad/i)).toHaveCount(0);
  });

  test('badges, totales, filtro y detalle con neto/comisión', async ({ page }) => {
    await instalarFirebase(page, { aportes: DOCS, pagos: PAGOS, user: { email: 'yo@x.com' } });
    await page.goto('/invitame-cafe/panel.html');
    await expect(page.locator('.pp-fila')).toHaveCount(4);
    await expect(page.locator('[data-pp="n-total"]')).toHaveText('4');
    await expect(page.locator('[data-pp="n-aprobados"]')).toHaveText('2');
    await expect(page.locator('[data-pp="suma"]')).toHaveText('$450');
    const f0 = page.locator('.pp-fila').nth(0);
    await expect(f0.locator('.pp-badge')).toContainText('Pagado');
    await expect(page.locator('.pp-fila').nth(1).locator('.pp-badge')).toContainText('Rechazado');
    await expect(page.locator('.pp-fila').nth(2).locator('.pp-badge')).toContainText('En revisión');
    await expect(page.locator('.pp-fila').nth(3)).toContainText('Duplicado');

    await page.locator('[data-pp="filtro"]').selectOption('aprobado');
    await expect(page.locator('.pp-fila')).toHaveCount(2);
    await page.locator('[data-pp="filtro"]').selectOption('');

    await f0.locator('[data-pp="det"]').click();
    await expect(f0.locator('.pp-det')).toContainText('Neto recibido');
    await expect(f0.locator('.pp-det')).toContainText('$143,5');
    await expect(f0.locator('.pp-det')).toContainText('$6,5');
    await expect(f0.locator('.pp-det a')).toHaveAttribute('href', 'https://www.mercadopago.com.ar/activities');
    // el detalle abierto sobrevive a un cambio en vivo
    await page.evaluate((a) => (window as any).__emitir('aportes', 'BBBBBBBB22', a), aporte('aprobado', { creadoEn: '2026-10-30T11:00:00Z' }));
    await expect(page.locator('[data-pp="n-aprobados"]')).toHaveText('3');
    await expect(page.locator('.pp-fila').nth(0).locator('.pp-det')).toBeVisible();
  });

  test('exporta CSV con columnas y neutraliza fórmulas', async ({ page }) => {
    await instalarFirebase(page, { aportes: DOCS, pagos: PAGOS, user: { email: 'yo@x.com' } });
    await page.goto('/invitame-cafe/panel.html');
    await expect(page.locator('.pp-fila')).toHaveCount(4);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('[data-pp="csv"]').click()]);
    const txt = readFileSync((await dl.path())!, 'utf8');
    const lineas = txt.replace('﻿', '').split('\r\n');
    expect(lineas[0]).toBe('"Fecha","Codigo","Titulo","Monto","Estado","Medio","Cuotas","PaymentId"');
    expect(lineas).toHaveLength(5);
    expect(lineas[1]).toContain('"AAAAAAAA22"');
    expect(lineas[1]).toContain('"aprobado","credit_card","3","111"');
    expect(txt).toContain(`"'=HYPERLINK(""x"")"`);
  });

  test('PagosPanel.badge suelto devuelve HTML escapado por estado', async ({ page }) => {
    await page.goto('/invitame-cafe/panel.html'); // carga pagos-panel.js aunque Firebase no esté
    const r = await page.evaluate(() => ({
      ok: (window as any).PagosPanel.badge({ estado: 'aprobado' }),
      disp: (window as any).PagosPanel.badge({ estado: 'en_disputa' }),
      raro: (window as any).PagosPanel.badge({ estado: '<b>x</b>' }),
      nada: (window as any).PagosPanel.badge(undefined),
    }));
    expect(r.ok).toContain('Pagado');
    expect(r.ok).toContain('pp-ok');
    expect(r.disp).toContain('⚠️ Disputa');
    expect(r.raro).not.toContain('<b>');
    expect(r.nada).toContain('Sin pago');
  });

  test('desmontar() corta el listener y limpia el contenedor', async ({ page }) => {
    await instalarFirebase(page, { aportes: DOCS, user: { email: 'yo@x.com' } });
    await page.goto('/invitame-cafe/panel.html');
    await expect(page.locator('.pp-fila')).toHaveCount(4);
    await page.evaluate(() => {
      // eslint-disable-next-line
      const p = (window as any).PagosPanel.montar(document.getElementById('pagos'), { db: (window as any).firebase.firestore(), coleccion: 'aportes' });
      p.desmontar();
    });
    await expect(page.locator('#pagos .pp')).toHaveCount(0);
  });

  test('sin overflow a 360px con datos', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await instalarFirebase(page, { aportes: DOCS, pagos: PAGOS, user: { email: 'yo@x.com' } });
    await page.goto('/invitame-cafe/panel.html');
    await expect(page.locator('.pp-fila')).toHaveCount(4);
    await page.locator('.pp-fila').nth(0).locator('[data-pp="det"]').click();
    await sinOverflow(page);
  });
});
