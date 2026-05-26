# PushCommerce — Playbook de Negocio
**Julian Carroccio · Desarrollador Senior · Las Flores, Buenos Aires**

---

## 1. Filosofía del negocio

### La propuesta central
Llegar a un negocio local con su página **ya hecha y subida online**, mostrarles el alcance que pueden tener, y recién ahí cobrar. El cliente no imagina nada — lo ve.

### Objetivo de negocio actualizado
Soluciones digitales para que los negocios de **Las Flores** crezcan: vendé fuera de la ciudad, digitalizá tu menú con QR para tu café o restaurante, y agilizá pedidos con ticketing y cola de atención.

Todo con **pago único** — sin membresías como Menuya, Pency o Milocal.

### El diferenciador técnico
> "Pago único. Sin membresías. El hosting es gratis para siempre — ningún Wix ni WordPress puede decir lo mismo."

Esto es **técnicamente verdad** y ninguna agencia puede decirlo:

| Tecnología | Costo mensual |
|---|---|
| GitHub Pages (hosting) | $0 para siempre |
| Tailwind CSS (CDN) | $0 |
| GSAP animaciones (CDN) | $0 |
| Formspree (formulario) | $0 (hasta 50 envíos/mes) |
| URL .github.io | $0 |
| Dominio propio (.com.ar) | ~$1,25 USD/mes (opcional) |

Comparado con Menuya, Pency o Milocal (membresías mensuales) o WordPress/Wix ($15-50/mes), el argumento de pago único se vende solo.

---

## 2. El modelo de negocio

### Precio base: $80 USD — pago único

La landing es la puerta de entrada. Todo lo demás es upsell. El diferenciador central es el **pago único**: sin cuotas, sin sorpresas.

**El argumento de cierre:**
> "Un solo pedido extra por semana, o una sola mesa nueva por mes, paga los $80 USD el primer mes. De ahí en más, es pura ganancia."

---

## 3. Planes

Todos los planes son **pago único**. Sin membresías. Hosting GitHub Pages: **$0 por mes, para siempre.**

### Incluidos gratis en todos los planes
- SEO básico + indexado en Google
- Google Analytics
- Código QR (para el local o el menú)

---

| | Landing | Tienda | Landing + Tienda | Landing + Tienda + Panel ⭐ |
|---|---|---|---|---|
| **Precio** | **$80 USD** | **$80 USD** | **$130 USD** | **$150 USD** |
| Landing page profesional | ✅ | ❌ | ✅ | ✅ |
| Diseño con logo y colores | ✅ | ✅ | ✅ | ✅ |
| Tienda carrito → WhatsApp | ❌ | ✅ | ✅ | ✅ |
| Catálogo de productos con precios | ❌ | ✅ | ✅ | ✅ |
| Panel de autoadministración | ❌ | ❌ | ❌ | ✅ |
| Hosting gratuito para siempre | ✅ | ✅ | ✅ | ✅ |
| URL propia (negocio.github.io) | ✅ | ✅ | ✅ | ✅ |
| Optimizado para mobile | ✅ | ✅ | ✅ | ✅ |
| 1 cambio gratis por mes | ❌ | ✅ | ✅ | ❌ |

> El plan **Landing + Tienda + Panel** es el más completo: el cliente puede editar precios, horarios, ofertas y catálogo sin depender de vos.

---

## 4. Servicios adicionales (extras)

### Precio fijo (por servicio)

| Servicio | Precio |
|---|---|
| Cambio extra de mantenimiento | $10 USD |
| Tickera o cola de pedidos (Firebase) | $20 USD |

### A medida (variable)

| Servicio | Precio |
|---|---|
| Funcionalidad personalizada | $5–$20 USD según complejidad |
| Dominio personalizado | desarrollo gratis — dominio se paga anualmente (costo real) |

---

## 5. Por qué el cambio mensual gratis en los planes con tienda es estratégico

No es generosidad — es retención y upsell.

**Para el cliente:**
- Elimina el miedo de "me hacen la página y me abandonan"
- El catálogo siempre está vigente (precios, stock, ofertas nuevas)
- Cero fricción para decir que sí

**Para Julian:**
- Mantiene el canal abierto con cada cliente activo
- Cada "cambiame el precio" es contacto directo → oportunidad de ofrecer más
- Con el pipeline automatizado: un cambio lleva ~10-15 minutos
- 20 clientes × 15 min = **5 horas/mes** para mantener toda la cartera activa
- El plan Panel elimina incluso ese trabajo — el cliente se autogestiona

---

## 6. Proyección de escala

| Clientes activos | Revenue inicial | Upsells estimados (año 1) | Total año 1 |
|---|---|---|---|
| 5 | $400-1.000 USD | $200 | ~$1.200 USD |
| 10 | $800-2.000 USD | $500 | ~$2.500 USD |
| 20 | $1.600-4.000 USD | $1.200 | ~$5.200 USD |

**Año 2 en adelante:** con 20 clientes activos, los upsells (tienda, MercadoPago, dominio, páginas extra) se vuelven ingresos recurrentes sin costo de adquisición.

---

## 7. Pipeline de construcción de una página

```
1. INVESTIGACIÓN (Claude hace el 80%)
   └── Buscar en web: nombre, dirección, teléfono, email, redes
   └── Overpass API: verificar si está en Google Maps
   └── Buscar Instagram/Facebook del negocio

2. IDENTIDAD VISUAL
   └── Pedirle al negocio: logo o foto del local/cartel
   └── ColorThief extrae paleta dominante automáticamente
   └── Se definen: color primario, acento, fondo, tipografía

3. GENERACIÓN DE PÁGINA
   └── index.html (landing) con GSAP + Tailwind CDN
   └── tienda.html (carrito WhatsApp) si aplica
   └── Todo estático, sin backend, listo para GitHub Pages

4. DEPLOY DE DEMO
   └── Subir a GitHub Pages de cuenta de Julian
   └── URL demo: juliancarroccio.github.io/pushcommerce/pages/negocio

5. CONTACTO
   └── Email o WhatsApp con el link de la demo
   └── "Ya te hice la página. Mirala acá."

6. CIERRE
   └── Si pagan: crear cuenta GitHub nueva para el negocio
   └── Repo: nombre-negocio/nombre-negocio.github.io
   └── Transferir repo → URL definitiva: nombre-negocio.github.io
   └── Dominio propio opcional: apuntar DNS a GitHub Pages
```

---

## 8. Scripts de contacto

### Email de presentación

```
Asunto: [Nombre del negocio] — Te hicimos una página web

Hola [Nombre],

Soy Julian Carroccio, desarrollador de Las Flores. Ayudo a negocios locales 
a tener presencia online con pago único — sin membresías ni cuotas mensuales.

Te preparé una página para [Nombre del negocio] y ya está online:
👉 [URL de la demo]

La construí con tu información pública y tu identidad visual. Si algo no está 
bien o querés ajustar algo, lo cambiamos.

Lo que incluye:
- Página profesional con tu marca
- [Tienda con carrito directo a WhatsApp / Menú digital con QR] (según caso)
- SEO básico + Google Analytics
- Hosting gratuito para siempre — sin cuota mensual

El precio es $80 USD — pago único. Sin sorpresas, sin Menuya, sin Pency.

¿Te interesa? Podemos hablar cuando quieras.

Julian Carroccio
PushCommerce
[Teléfono/WhatsApp]
```

---

### Mensaje de WhatsApp (versión corta)

```
Hola [Nombre]! Soy Julian, de Las Flores. 
Hago páginas web para negocios locales, pago único sin mensualidades.

Te hice una para [Nombre del negocio], ya está en vivo:
👉 [URL de la demo]

$80 USD único, hosting gratis para siempre.
¿Les interesa verla?
```

---

### Acercamiento en persona (guión)

1. **Apertura:** "Hola, soy Julian Carroccio, trabajo en desarrollo web acá en Las Flores."
2. **Demo inmediata:** Abrir el celular con la página ya cargada. "Les hice esto para el negocio."
3. **Silencio.** Dejar que lo vean. No explicar nada todavía.
4. **Pregunta:** "¿Qué les parece? ¿Cambiarían algo?"
5. **Precio solo si preguntan:** "$80 USD, una sola vez. Sin cuota mensual, hosting gratis para siempre. No es Menuya, no es Pency — no hay suscripción."
6. **Objeción más común:** "¿Y qué pasa si quiero cambiar algo?" → "Me mandás un WhatsApp y lo cambio. O si preferís manejarlo vos, hay un panel para editarlo desde el celular."

---

## 9. Manejo de objeciones

| Objeción | Respuesta |
|---|---|
| "No tengo presupuesto ahora" | "Te lo dejo publicado de todas formas. Cuando puedas, me avisás." |
| "¿Qué pasa si quiero hacer cambios?" | "Un cambio por mes está incluido en los planes con tienda. Extra son $10 USD. O tomás el plan con panel y lo editás vos." |
| "¿Y el hosting cuánto me cuesta?" | "Cero. GitHub Pages es gratuito. No hay cuota mensual, a diferencia de Menuya o Pency." |
| "No sé si mis clientes compran por internet" | "No vendés por internet — usás WhatsApp como siempre. Solo tenés más alcance y el pedido llega organizado." |
| "Tenemos Instagram y nos alcanza" | "Instagram depende del algoritmo. La página es tuya, siempre aparece en Google." |
| "Ya usamos Menuya / Pency / Milocal" | "Está bien. Cuando te cansen las cuotas mensuales, esto existe. Un pago, para siempre." |
| "¿Y si cierro el negocio?" | "La página simplemente deja de existir. No hay contrato, no hay multa." |

---

## 10. Candidatos identificados — Las Flores

### Tier 1 — Atacar primero

| Negocio | Rubro | Contacto | Redes | Web |
|---|---|---|---|---|
| **Bodegón 1856** | Restó / parrilla | (02244) 15 46-7028 | Facebook @bodegon1856 | ❌ |
| **Bar Vieja Estación** | Bar | 2244438023 | IG @bar.vieja.estacion + FB | ❌ |
| **Gran Hotel Avenida** | Hotel | — | FB @GranHotelAvenida.LasFlores | ❌ propia |

### Tier 2 — Segunda ronda

| Negocio | Rubro | Contacto | Redes | Web |
|---|---|---|---|---|
| **Cautiva Cervecería** | Cervecería/café | 2244401610 | IG @cautiva.cerveceria | ❌ |
| **Cultura Cervecera** | Cervecería | — | Directorios | ❌ |
| **Gepetto Carpintería** | Artesano | — | — | ❌ |

### Tier 3 — Largo plazo

| Negocio | Rubro | Contacto |
|---|---|---|
| **El Terreno, Asador Criollo** | Parrilla | (02244) 15 422818 |
| **Lo de la Ñata** | Restó | (02244) 44 2735 |
| **El Despacho Bar** | Bar | (02244) 15 44 7030 |
| **Amadeo Café** | Café | (02244) 15 48 5082 |

---

## 11. Stack técnico (referencia)

```
Hosting:      GitHub Pages (gratis)
CSS:          Tailwind CSS via CDN (sin build step)
Animaciones:  GSAP + ScrollTrigger via CDN
Fuentes:      Google Fonts (gratis)
Formularios:  Formspree free tier (50 envíos/mes)
Carrito:      Vanilla JS → mensaje WhatsApp estructurado
Colores:      ColorThief (Python, pip3) → extracción automática de logo
Dominio:      Namecheap o NIC.ar para .com.ar (~$15 USD/año)
```

**Por cliente:**
- `pages/nombre-negocio/index.html` — landing
- `pages/nombre-negocio/tienda.html` — tienda (si aplica)
- `pages/nombre-negocio/logo.*` — assets del cliente

**Cuando pagan:**
1. Crear cuenta GitHub: `nombre-negocio`
2. Crear repo: `nombre-negocio.github.io`
3. GitHub → Transfer repository
4. URL final: `nombre-negocio.github.io`
5. Dominio opcional: configurar DNS en GitHub Pages

---

## 12. Marca

**Nombre:** PushCommerce  
**Tagline:** *Presencia digital para negocios locales. Sin cuotas, sin complicaciones.*  
**Contacto público:** Julian Carroccio — Desarrollador Senior  
**Nota:** No usar el título "Ingeniero" (título protegido legalmente en Argentina sin matrícula).
