# PushCommerce — Playbook de Negocio
**Julian Carroccio · Desarrollador Senior · Las Flores, Buenos Aires**

---

## 1. Filosofía del negocio

### La propuesta central
Llegar a un negocio local con su página **ya hecha y subida online**, mostrarles el alcance que pueden tener, y recién ahí cobrar. El cliente no imagina nada — lo ve.

### El diferenciador técnico
> "Tu página no tiene costo mensual. El hosting es gratis para siempre. Pagás una vez, y yo te mantengo el sitio actualizado."

Esto es **técnicamente verdad** y ninguna agencia puede decirlo:

| Tecnología | Costo mensual |
|---|---|
| GitHub Pages (hosting) | $0 para siempre |
| Tailwind CSS (CDN) | $0 |
| GSAP animaciones (CDN) | $0 |
| Formspree (formulario) | $0 (hasta 50 envíos/mes) |
| URL .github.io | $0 |
| Dominio propio (.com.ar) | ~$1,25 USD/mes (opcional) |

Comparado con WordPress ($15-50/mes), Wix ($15-30/mes) o Tiendanube ($20-40/mes), el argumento se vende solo.

---

## 2. El modelo de negocio

### Precio base: X = $80 USD

La landing page es la puerta de entrada. Todo lo demás es upsell.

**El argumento de cierre:**
> "Un solo pedido extra por semana, o una sola mesa nueva por mes, paga los $80 USD el primer mes. De ahí en más, es pura ganancia."

---

## 3. Planes

| | Plan Presencia | Plan Comercio | Plan Completo |
|---|---|---|---|
| **Precio** | **$80 USD** | **$150 USD** | **$200 USD** |
| Landing page profesional | ✅ | ✅ | ✅ |
| Hosting gratuito para siempre | ✅ | ✅ | ✅ |
| URL propia (negocio.github.io) | ✅ | ✅ | ✅ |
| 1 actualización/mes gratis | ✅ | ✅ | ✅ |
| Paleta de colores de su marca | ✅ | ✅ | ✅ |
| SEO básico + indexado en Google | ❌ | ✅ | ✅ |
| Tienda + carrito → WhatsApp | ❌ | ✅ | ✅ |
| Google Business Profile setup | ❌ | ❌ | ✅ |
| QR code para el local físico | ❌ | ❌ | ✅ |
| Sección reseñas Google | ❌ | ❌ | ✅ |

---

## 4. Servicios adicionales (extras)

| Servicio | Precio | Notas |
|---|---|---|
| Dominio propio (.com.ar) | +$15 USD/año | ~$1,25/mes. Lo gestionás vos. |
| Tienda + carrito WhatsApp | +$80 USD | Si no viene en el plan |
| MercadoPago en tienda | +$50 USD | Links de pago por producto, sin backend |
| Segunda página (menú, portfolio) | +$40 USD | Misma estética, nueva sección |
| Galería de fotos | +$25 USD | El cliente provee las fotos |
| Sección de reseñas Google | +$20 USD | 3-4 reseñas reales, diseñadas |
| Google Business Profile | +$30 USD | Alta palanca para búsquedas locales |
| QR code imprimible | +$10 USD | PNG/PDF listo para imprimir |
| Actualización extra (fuera del mes) | +$10 USD/cambio | Fuera de la cuota mensual |

---

## 5. Por qué la actualización mensual gratis es estratégica

No es generosidad — es retención y upsell.

**Para el cliente:**
- Elimina el miedo de "me hacen la página y me abandonan"
- El sitio siempre está vigente (precios, horarios, fotos nuevas)
- Cero fricción para decir que sí

**Para Julian:**
- Mantiene el canal abierto con cada cliente activo
- Cada "cambiame el horario" es contacto directo → oportunidad de ofrecer más
- Con el pipeline automatizado: un cambio lleva ~10-15 minutos
- 20 clientes × 15 min = **5 horas/mes** para mantener toda la cartera activa

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

Soy Julian Carroccio, desarrollador de Las Flores. Trabajo ayudando a negocios locales a tener presencia online sin costos mensuales.

Te preparé una página para [Nombre del negocio] y ya está online:
👉 [URL de la demo]

La construí con tu información pública (dirección, teléfono, lo que encontré) y tu identidad visual. Si algo no está bien o querés ajustar algo, lo cambiamos.

Lo que incluye:
- Página profesional con tu marca
- Botón de pedidos por WhatsApp
- Hosting gratuito para siempre (sin cuota mensual)
- 1 actualización por mes, gratis

El costo único es $80 USD. Sin sorpresas, sin mensualidades.

¿Te interesa? Podemos hablar cuando quieras.

Julian Carroccio
PushCommerce
[Teléfono/WhatsApp]
```

---

### Mensaje de WhatsApp (versión corta)

```
Hola [Nombre]! Soy Julian, de Las Flores. 
Trabajo haciendo páginas web para negocios locales.

Te hice una para [Nombre del negocio], ya está online:
👉 [URL de la demo]

Sin costo mensual, $80 USD único. 
¿Les interesa verla?
```

---

### Acercamiento en persona (guión)

1. **Apertura:** "Hola, soy Julian Carroccio, trabajo en desarrollo web acá en Las Flores."
2. **Demo inmediata:** Abrir el celular con la página ya cargada. "Les hice esto para el negocio."
3. **Silencio.** Dejar que lo vean. No explicar nada todavía.
4. **Pregunta:** "¿Qué les parece? ¿Cambiarían algo?"
5. **Precio solo si preguntan:** "$80 USD, una sola vez. Sin cuota mensual, hosting gratis para siempre."
6. **Objeción más común:** "¿Y qué pasa si quiero cambiar algo?" → "Me mandás un WhatsApp y lo cambio. Eso está incluido."

---

## 9. Manejo de objeciones

| Objeción | Respuesta |
|---|---|
| "No tengo presupuesto ahora" | "Te lo dejo publicado de todas formas. Cuando puedas, me avisás." |
| "¿Qué pasa si quiero hacer cambios?" | "Un cambio por mes está incluido, para siempre. Extra son $10 USD." |
| "¿Y el hosting cuánto me cuesta?" | "Cero. GitHub Pages es gratuito. No hay cuota mensual." |
| "No sé si mis clientes compran por internet" | "No vendés por internet — usás WhatsApp como siempre. Solo tenés más alcance." |
| "Tenemos Instagram y nos alcanza" | "Instagram depende del algoritmo. La página es tuya, siempre aparece en Google." |
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
