# PushCommerce — Contexto del Proyecto

> Este archivo se carga automáticamente. Leelo completo antes de hacer cualquier cosa.

## Qué es PushCommerce

Servicio de landing pages + e-commerce para pequeños negocios de **Las Flores, Buenos Aires, Argentina** (pueblo de ~27.000 habitantes). El modelo: llegar al negocio con la página **ya hecha y subida online**, mostrarles el alcance posible, y recién ahí cobrar.

**Dueño:** Julian Carroccio — Desarrollador Senior (7 años experiencia, casi ing. informático).
**Marca:** PushCommerce by Julian Carroccio.
**Nota legal:** NO usar el título "Ingeniero" — está protegido por colegios profesionales en Argentina sin matrícula.

---

## Modelo de negocio — pago único, sin membresías

| Plan | Precio | Incluye |
|---|---|---|
| Landing | $80 USD | Landing profesional + hosting + URL + mobile |
| Tienda | $80 USD | Tienda → WhatsApp + catálogo + 1 cambio/mes |
| Landing + Tienda | $130 USD | Ambos + 1 cambio/mes |
| Landing + Tienda + Panel ⭐ | $150 USD | Todo + panel de autoadministración |

**Siempre gratis:** SEO básico, Google Analytics, QR code.
**Extras fijos:** cambio extra $10 USD · tickera/cola $20 USD.
**Diferenciador central:** pago único. Sin Menuya, Pency ni Milocal. GitHub Pages = $0/mes para siempre.

**Pitch de cierre:** "Un solo pedido extra por semana paga los $80 USD el primer mes. De ahí en más, es pura ganancia."

Ver playbook completo en `PLAYBOOK.md`.

El playbook completo está en `PLAYBOOK.md`.

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

## Clientes actuales

### Cincomentario (demo completa ✅)
- **Tipo:** Fiambrería y Quesería
- **Dirección:** Av. San Martín 862, Las Flores (B7200)
- **Tel:** 02244 44-4777
- **Email:** RegionalesCincomentario@hotmail.com
- **Facebook:** @RegionalesCincomentario
- **Rating:** 4.7★ (34 reseñas Google)
- **Logo:** `pages/cincomentario/494509243_18122239129446348_7279241484691807032_n.jpg`
- **Paleta:** wood `#1A1008`, amber `#C8822E`, parchment `#F2E8D5`, tan `#C9A87C`
- **Tipografía:** Oswald (display) + Cormorant Garamond (serif)
- **Estado:** landing + tienda construidas, pendiente subir a GH Pages
- **Pendiente:** reseñas, QR, oferta semanal, MercadoPago

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

## Tasks pendientes (ver también el task tracker)

**Skills a construir:**
- [ ] `new-client` — pipeline completo automatizado
- [ ] `edit-section` — editar sección puntual de página existente
- [ ] `update-products` — editar catálogo en tienda.html
- [ ] `add-service` — inyectar features nuevas (reseñas, QR, MP, etc.)

**Cincomentario pendiente:**
- [ ] Subir a GitHub Pages (URL demo real)
- [ ] Sección "Oferta de la semana"
- [ ] Sección de reseñas Google (tiene 34, 4.7★)
- [ ] QR code imprimible
- [ ] MercadoPago en tienda

---

## Notas técnicas importantes

- **Overpass API:** solo funciona vía `WebFetch`, NO con `curl` (devuelve 406)
- **Instagram:** bloquea scraping — siempre pedir logo/screenshot al usuario
- **ColorThief:** instalado vía pip3, funciona para extraer paleta de cualquier imagen
- **GSAP ScrollTrigger:** CDN gratuito, no requiere licencia para uso básico
- **Formspree:** free tier = 50 envíos/mes por formulario, suficiente para MVP
- La paleta de colores SIEMPRE debe venir del logo real, nunca inventada
