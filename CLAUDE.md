# PushCommerce — Contexto del Proyecto

> Este archivo se carga automáticamente. Leelo completo antes de hacer cualquier cosa.

## Qué es PushCommerce

Servicio de landing pages + e-commerce para pequeños negocios de **Las Flores, Buenos Aires, Argentina** (pueblo de ~27.000 habitantes). El modelo: llegar al negocio con la página **ya hecha y subida online**, mostrarles el alcance posible, y recién ahí cobrar.

**Dueño:** Julian Carroccio — Desarrollador Senior (7 años experiencia, casi ing. informático).
**Marca:** PushCommerce by Julian Carroccio.
**Nota legal:** NO usar el título "Ingeniero" — está protegido por colegios profesionales en Argentina sin matrícula.

---

## Modelo de negocio — modular, por servicio (ver `PLAYBOOK.md` para el detalle completo)

El cliente ya no compra "un plan" cerrado — compra uno o más **servicios**
(Landing, E-commerce, Hotel, Turnos, Entradas/Eventos, Consulta de precios),
cada uno configurable. Dos formas de pago, por servicio:

| Modalidad | Precio | Para quién |
|---|---|---|
| Pago único | $70 USD/servicio + $8 USD canon por cambio post-entrega | Negocios ya funcionando que quieren escalar |
| SaaS mensual | $8 USD/mes | Emprendimientos que recién arrancan o quieren probar |

**Adicional de E-commerce — integración de pago online (MercadoPago):**
+$20 USD en pago único / +$2 USD/mes en SaaS. Es un canon por mantenimiento:
nuestro costo de infraestructura es $0 (Cloudflare Workers gratis), y la
comisión de MercadoPago la paga el comercio a MP.

**Siempre gratis en cualquier servicio:** SEO básico, Google Analytics, QR code, hosting GitHub Pages $0 para siempre.
**Diferenciador central:** costo $0 de hosting para siempre. Sin Menuya, Pency ni Milocal.

**Pitch de cierre:** "Un solo pedido extra por semana paga los $70 USD el primer mes. De ahí en más, es pura ganancia."

El catálogo técnico completo de servicios/módulos vive en
`~/.claude/skills/new_client/` (skill `new_client`, v3.0 — pregunta
rubro y servicios ANTES de crear nada, delega la construcción a agentes
especializados `~/.claude/agents/pushcommerce-*.md`). Ver playbook de
negocio completo en `PLAYBOOK.md`.

---

## Stack técnico — COSTO CERO

```
Hosting:      GitHub Pages (gratis, para siempre)
CSS:          Tailwind CSS via CDN (sin build step)
Animaciones:  GSAP + ScrollTrigger via CDN
Fuentes:      Google Fonts
Formularios:  Formspree free tier
Carrito:      Vanilla JS → mensaje WhatsApp estructurado
Colores:      ColorThief (Python/pip3, ya instalado) desde logo/foto
Dominio:      NIC.ar ~$15 USD/año (opcional, pass-through)
```

**Regla de oro:** todo estático, sin backend, sin build step. Funciona directo en GitHub Pages.

---

## Estructura del proyecto

```
pushcommerce/
├── CLAUDE.md              ← este archivo
├── PLAYBOOK.md            ← modelo de negocio, precios, scripts, candidatos
└── pages/
    └── {nombre-cliente}/
        ├── index.html     ← landing page
        ├── tienda.html    ← carrito WhatsApp (si aplica)
        └── logo.*         ← assets del cliente
```

**Demo URL:** `juliancarroccio.github.io/pushcommerce/pages/{cliente}`
**Producción:** crear cuenta GitHub `{nombre-negocio}` → repo `{nombre}.github.io` → transferir

---

## ⚠️ Clientes REALES vendidos — NUNCA tocar sin pedido explícito

- **El Sabor de Mamá** → repo `elsabordemama/elsabordemama.github.io`
- **Cattorini** → repo `cattorini/cattorini.github.io` (dominio `cattorinioriginal.com`)

Viven en sus propios repos, no en `pages/` (las copias viejas que había
acá se borraron el 2026-10-27). Son negocios reales que ya pagaron y
están en producción. **No les
apliques ninguna refactorización, módulo nuevo, migración de skill ni
"mejora" general** — ni siquiera si parece una mejora objetiva (ej. no
migrarlos al flujo modular de `new_client` v3.0). Tocalos únicamente
cuando Julian lo pida explícitamente PARA ESE cliente puntual.

Todo `pages/*` son demos: sí es terreno normal para iterar, probar y
aplicar el flujo nuevo.

**Demos de negocios reales que no compraron:** se convierten en negocios
ficticios antes de mostrarlos. Llevan nombre y logo de fantasía, sin
dirección, teléfono, redes, fotos ni reseñas reales, con `noindex` y la
leyenda "Sitio de demostración · negocio ficticio" en el pie. Así quedaron
`almacen_del_pago` (ex Cincomentario) y `hotel_los_aromos` (ex Balo). No
volver a usar los nombres ni los datos reales de esos negocios. (Distinto de los clientes
de prueba descartables tipo `pages/*_de_prueba/` que se crean y borran
dentro de una misma sesión para validar la skill — esos ni siquiera son
negocio real, son puramente técnicos.)

## Clientes actuales

Clientes en producción: Cattorini y El Sabor de Mamá (ver arriba). Los
demás sitios de `pages/` son demos.

---

## Candidatos próximos (Las Flores)

### Tier 1
| Negocio | Rubro | Contacto | Redes | Por qué |
|---|---|---|---|---|
| **Bodegón 1856** | Restó/parrilla | (02244) 15 46-7028 | FB @bodegon1856 | 4.5★, nombre con identidad histórica, sin web |
| **Bar Vieja Estación** | Bar | 2244438023 | IG @bar.vieja.estacion | Nombre brutal para diseño ferroviario/vintage |
| **Gran Hotel Avenida** | Hotel | — | FB @GranHotelAvenida.LasFlores | Sin web propia → pierde % a Booking. Pitch: "ahorrá comisión" |

### Tier 2
| Negocio | Rubro | Contacto |
|---|---|---|
| Cautiva Cervecería | Café/cervecería | 2244401610 · IG @cautiva.cerveceria |
| Cultura Cervecera | Cervecería artesanal | Alcorta y Harosteguy |
| Gepetto Carpintería | Artesano | Av. General Paz (Néstor Martino) |

---

## Pipeline para nuevo cliente

```
1. INVESTIGAR     → WebSearch + Overpass API + WebFetch del negocio
2. LOGO/COLORES   → pedirle logo o foto; ColorThief extrae paleta
3. GENERAR        → index.html (landing) + tienda.html (si aplica)
4. DEPLOY DEMO    → GitHub Pages en cuenta de Julian
5. CONTACTAR      → email/WhatsApp/presencial con el link ya listo
6. CERRAR         → nueva cuenta GH para el negocio, transferir repo
```

---

## ⚠️ PENDIENTE AL FINAL DE TODO — no olvidar (decidido por Julian, 2026-10-25)

Estas tareas van **últimas** en la lista, después de todo lo demás. Tocan a
clientes reales (Cattorini, El Sabor de Mamá), y cualquier cambio ahí hay
que explicárselo al cliente desde cero antes de aplicarlo.

**Antes de tocar cualquier cliente productivo:**
- **Producción NO es `pages/` de este repo.** Cada uno vive en su propio repo:
  `cattorini/cattorini.github.io` y `elsabordemama/elsabordemama.github.io`.
  Las copias que había en `pages/` se borraron el 2026-10-27. El
  `MANUAL_CATTORINI.md`, que tiene credenciales y no se versiona, quedó en
  `~/Documents/repos/cattorini-backups/`.
- Trabajar sobre un clon del repo de producción, y **re-verificar ahí** el
  diagnóstico de seguridad, que se hizo sobre las copias locales.
- **Acceso:** Julian tiene las cuentas de GitHub de cada cliente (las crea
  él al pasar a producción). La cuenta `juliancarroccio` hoy solo tiene
  permiso de lectura sobre esos repos.
  - **Procedimiento acordado:** Julian entra a cada cuenta de cliente →
    Settings → Collaborators → agrega `juliancarroccio`, y se publica con su
    sesión de `gh`.
  - **NUNCA** guardar ni usar contraseñas o PATs de clientes en archivos del
    repo, memoria o commits.
- **Rotar credenciales después del trabajo:** el 2026-10-25 se compartieron
  en el chat contraseñas de las cuentas de ambos clientes y el PAT del portal
  de El Sabor de Mamá.
  - Regenerar ese PAT como fine-grained: solo ese repo, permiso Contents, con
    vencimiento. Volver a cargarlo en el portal.
  - Cambiar las contraseñas. Cattorini usa la misma para GitHub y para el mail
    de Firebase.
  - Activar la verificación en dos pasos en las cuentas.
- Incluir en el deploy de cada cliente el **`sw.js` estándar**
  (`~/.claude/skills/new_client/assets/sw-template.js`) y los `fetch` de JSON
  con `{ cache: 'no-cache' }`. Es lo que evita pedirle a la gente que borre la
  caché. El Sabor de Mamá hoy sirve el HTML cache-first con caché fija
  `esm-v1`: sus visitantes ven versiones viejas.

1. **Cattorini — dominio propio `cattorinioriginal.com`** desde el 2026-10-26.
   `cattorini.github.io` redirige al dominio nuevo, HTTPS forzado, alta en
   Google Search Console con sitemap enviado. **Seguridad PUBLICADA el 2026-10-26** (commits `078e671` y
   `51ed357` en `cattorini/cattorini.github.io`; reglas desplegadas con
   `firebase deploy`). Detalle en engram (`cliente/cattorini/seguridad-pagos-2026-10`).
   Verificado en vivo: el público no puede listar ni tocar stock, y no se
   pueden crear usuarios anónimos. Queda pendiente:
   - ✅ **Prueba manual** hecha por Julian el 2026-10-27, todo OK. Pasos que se probaron:
     - Login del portal: PAT + email/contraseña.
     - Pedido real chico → aparece en `pedidos.html` → "Cancelar pedido"
       devuelve el stock.
     - Solicitud mayorista → aprobar → el código se ve una vez → entra con
       ese código en la tienda.
     - Mirar la consola del navegador por errores de CSP.
   - ✅ **Datos legales** cargados el 2026-10-27 (ORIGINAL 59 S.A.). **Falta del cliente:** QR "Data Fiscal" de ARCA y 3 dudas: IVA en precios mayoristas, si sigue el pago en el local, cómo cobra las 3 cuotas. Antes decía: reemplazar los marcadores `[RAZÓN
     SOCIAL]`, `[CUIT]`, `[CONDICIÓN IVA]`, `[DOMICILIO]`, `[EMAIL DE
     CONTACTO]` y `[POLÍTICA DE CAMBIOS]`.
   - **Errores de carga para el cliente:** `~/Desktop/ERRORES_CARGA_CATTORINI.md`.
     El portal no deja publicar hasta corregir los precios de los productos
     #1 y #12.
   - **Explicarle al dueño:**
     - El login nuevo.
     - El código de cada mayorista se ve una sola vez.
     - "Cancelar pedido" devuelve stock y "Eliminar" no.
     - Los pedidos con más de 12 combinaciones talle/color de una misma prenda
       van por WhatsApp.
2. **Seguridad de El Sabor de Mamá — CRÍTICO, peor que Cattorini**.
   Diagnóstico en engram (`pushcommerce/seguridad-sabor-de-mama`).
   - `pedidos` sin ningún tipo de auth: el código necesita reglas abiertas
     para leer, modificar y borrar → cualquiera descarga los datos de los
     clientes, borra la cola o mete spam.
   - XSS en `pedidos.html:459-492, 550-559, 633`, que puede llegar al PAT y
     al repo de producción.
   - El acceso a la cola se saltea con `sessionStorage['pc_cola']`.
   - Fix: login del dueño con email y contraseña en `pedidos.html`, escapar
     el `innerHTML` y reglas con `create` público validado y el resto solo
     dueño. Desplegar primero el código y después las reglas.
   - Producción vive en otro repo: `elsabordemama/elsabordemama.github.io`.
   - **Necesito de Julian:** las reglas reales del proyecto
     `elsabordemama-dec44` y confirmar que ese repo tiene el mismo código.
   - Preparar la explicación para el cliente.
3. **Medios de pago: MercadoPago, Stripe, etc.**, como **servicio nuevo de
   e-commerce** para ofrecer, más los que hagan falta.
   - ✅ **Diseño hecho:** `~/.claude/skills/new_client/references/module-pagos-mercadopago.md`.
     - Checkout Pro + Worker de Cloudflare (gratis), nunca Vercel Hobby.
     - Stripe no opera en Argentina.
     - Transferencia y QR siguen manuales, con 0% de comisión.
     - Mayoristas también pagan online, validando su código en el Worker.
     - Cattorini: máximo 3 cuotas, interés a cargo del comprador.
     - El Worker también se hace cargo del descuento de stock, y eso levanta
       el tope de 12 variantes por producto.
   - ✅ **Precio:** adicional de e-commerce, US$20 pago único / US$2 por mes.
   - **Falta implementar.** Julian tiene que crear la app de prueba en
     MercadoPago Developers con su cuenta y una cuenta de Cloudflare (pasos en
     el doc, §10). Cattorini es el primer cliente.

## Tasks pendientes (ver también el task tracker)

**Skills:**
- [x] `new_client` — pipeline modular completo, v3.0, delega a 6 agentes
      especializados (`~/.claude/agents/pushcommerce-*.md`)
- [~] `/edit-section`, `/update-products`, `/add-service`: existen en `.claude/commands/` pero están DESACTUALIZADOS (ejemplos con Cincomentario, no saben que los clientes reales viven en sus propios repos, ni del modelo de seguridad, el sw.js estándar o la marca Las Flores Software). Actualizarlos antes de usarlos.

---

## Notas técnicas importantes

- **Overpass API:** solo funciona vía `WebFetch`, NO con `curl` (devuelve 406)
- **Instagram:** bloquea scraping — siempre pedir logo/screenshot al usuario
- **ColorThief:** instalado vía pip3, funciona para extraer paleta de cualquier imagen
- **GSAP ScrollTrigger:** CDN gratuito, no requiere licencia para uso básico
- **Formspree:** free tier = 50 envíos/mes por formulario, suficiente para MVP
- La paleta de colores SIEMPRE debe venir del logo real, nunca inventada
