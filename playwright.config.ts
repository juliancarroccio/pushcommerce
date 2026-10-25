import { defineConfig, devices } from '@playwright/test';

/**
 * Config mínima para testear landing pages estáticas de PushCommerce
 * (sin backend, sin build step).
 *
 * IMPORTANTE: NO usar file:// para abrir las páginas. Las landings usan
 * fetch() (ej. productos.json) y fetch() no soporta el scheme file://
 * en Chromium, aunque en producción (GitHub Pages, http/https) funciona
 * perfecto. Por eso levantamos un server HTTP estático local con
 * `python3 -m http.server` (ya está disponible en el proyecto, se usa
 * para ColorThief) y los tests navegan contra http://localhost:4173.
 *
 * Ver ~/.claude/skills/new_client/references/testing-playwright.md
 * para el estándar de testing que deben seguir todos los clientes nuevos.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'python3 -m http.server 4173 --directory pages',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
