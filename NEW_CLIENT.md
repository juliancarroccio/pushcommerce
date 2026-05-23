# PushCommerce — Procedimiento para nuevo cliente

> Referencia completa. Cada cliente nuevo sigue este flujo de principio a fin.

---

## 1. Setup inicial (lo hace Julian)

```
pages/
└── {slug-del-negocio}/
    └── img/
        ├── logo.png         ← obligatorio
        ├── hero.jpg         ← foto principal (fachada, producto estrella, ambiente)
        ├── nosotros.jpg     ← foto secundaria (interior, proceso, equipo)
        └── ...              ← cualquier extra (producto, ambiente, etc.)
```

El slug es el nombre del negocio en minúsculas sin espacios ni acentos (ej: `bodegon1856`, `bar_vieja_estacion`).

---

## 2. Investigación (lo hace Claude)

Antes de escribir una línea de código:

1. **WebSearch** del negocio → nombre exacto, dirección, teléfono, horarios, redes sociales
2. **Google Maps / Overpass API** → coordenadas, categoría, reseñas recientes, rating
3. **ColorThief / PIL** sobre `logo.png` → extraer paleta de 3–5 colores
4. **Revisar assets en `img/`** → entender la identidad visual antes de elegir tipografía y estilo

Solo cuando tengo toda la info real empiezo a construir.

---

## 3. Decisiones de diseño (una por cliente)

Cada página tiene que verse distinta de las anteriores. Differenciadores a variar:

| Variable | Opciones / notas |
|---|---|
| **Paleta** | Siempre del logo. No inventar colores. |
| **Tipografía** | Par serif + sans diferente en cada cliente. Ver Google Fonts. |
| **Hero layout** | Full screen / Split / Texto superpuesto / Carrusel manual |
| **Animaciones** | Ken Burns / parallax / slide-in / fade-up / clip-path wipe / stagger |
| **Sección Nosotros** | Split horizontal / vertical / texto + quote grande / timeline |
| **Cards de producto** | 4 columnas / 3 columnas / lista / masonry |
| **Estilo general** | Minimalista / Orgánico / Editorial / Bold / Artesanal |

Clientes anteriores para NO repetir:
- **Cincomentario**: wood oscuro, Oswald + Cormorant, grain overlay, amber
- **San Martín**: charcoal, Playfair + DM Sans, wheat/cream, Ken Burns

---

## 4. Archivos a crear

```
pages/{slug}/
├── index.html       ← landing completa
├── tienda.html      ← catálogo + carrito WhatsApp
├── qr.html          ← QR imprimible
├── 404.html         ← página de error
├── productos.json   ← fuente de verdad de datos
├── manifest.json    ← PWA
├── sw.js            ← Service Worker (cache first)
├── robots.txt       ← SEO
├── sitemap.xml      ← SEO
└── img/
    ├── logo.png
    ├── hero.jpg
    ├── nosotros.jpg
    └── ...
```

---

## 5. `productos.json` — estructura

```json
{
  "negocio": {
    "nombre": "Nombre completo del negocio",
    "whatsapp": "549XXXXXXXXXX",
    "direccion": "Calle 123, Las Flores",
    "telefono": "02244 XX-XXXX",
    "analytics_id": ""
  },
  "oferta": {
    "activa": true,
    "producto_id": 5,
    "texto": "Oferta de la semana",
    "precio_oferta": 1400
  },
  "horarios": {
    "lunes":     [{"abre": "09:00", "cierra": "18:00"}],
    "martes":    [{"abre": "09:00", "cierra": "18:00"}],
    "miércoles": [{"abre": "09:00", "cierra": "18:00"}],
    "jueves":    [{"abre": "09:00", "cierra": "18:00"}],
    "viernes":   [{"abre": "09:00", "cierra": "18:00"}],
    "sábado":    [{"abre": "09:00", "cierra": "13:00"}],
    "domingo":   []
  },
  "categorias": [
    {
      "id": "slug-categoria",
      "nombre": "Nombre Categoría",
      "emoji": "🧀",
      "productos": [
        {
          "id": 1,
          "nombre": "Nombre producto",
          "descripcion": "Descripción breve del producto",
          "precio": 2500,
          "imagen": "producto-foto.jpg"
        }
      ]
    }
  ],
  "resenas": []
}
```

**Notas sobre horarios:**
- Cada día es un array de turnos: `[{"abre": "HH:MM", "cierra": "HH:MM"}]`
- Si el local abre en dos turnos (siesta): dos objetos en el array
- Si el local cierra ese día: array vacío `[]` o se omite la clave

**Notas sobre productos:**
- `imagen` es opcional — si no existe, se muestra el emoji de la categoría
- Si `imagen` existe, debe estar en `img/` y referenciarse como nombre de archivo solo (sin path)
- La oferta modifica el precio en tienda y muestra el original tachado + badge `-XX%`

---

## 6. `index.html` — secciones en orden

### Siempre presentes:
1. **Scroll progress bar** (fija, 2–3px, color acento)
2. **Navbar** sticky con logo + badge Abierto/Cerrado + links + CTA
3. **Hero** full screen: imagen de fondo + overlay + título + subtítulo + 2 CTAs + scroll indicator
4. **Divider** decorativo
5. **Nosotros** split 2 columnas: texto narrativo + foto
6. **Divider** con pattern
7. **Productos** preview: tabs por categoría + grid 4 columnas + cards con imagen + CTA "Ver catálogo completo"
8. **Oferta de la semana** (condicional: solo si `oferta.activa === true`) — precio original tachado + badge `-XX%` + precio oferta + botón pedir
9. **Horarios** con badge Abierto/Cerrado en tiempo real
10. **Reseñas** (condicional: solo si rating ≥ 4★) — 3 cards hardcodeadas en HTML (no del JSON)
11. **Contacto** split: info + mapa Google Maps embed
12. **Footer** logo + nombre + dirección + links
13. **Botón flotante WhatsApp** (aparece después de hacer scroll del hero)
14. **Botón volver arriba** (aparece después de 300px)

### JS en `index.html`:
- `_FALLBACK` const inline con el mismo JSON que `productos.json` (para `file://`)
- `fetch('./productos.json')` → `.catch(() => initPage(_FALLBACK))`
- `buildHorarios(data)` → calcula abierto/cerrado + setea badge nav + badge sección
- `buildProducts(data)` → tabs + grid animado por categoría
- `buildOferta(data)` → solo si `data.oferta.activa === true`
- GSAP ScrollTrigger para reveals, hero entrance, nosotros slide-in, contact columns

---

## 7. `tienda.html` — funcionalidades

### Header sticky:
- ← Volver (link a index.html)
- Logo + nombre del negocio
- Botón "Pedido" con badge de cantidad

### Debajo del header:
- **Pills de categoría** scrollable: "Todos" + una por categoría
- **Buscador** con botón limpiar (X)

### Banners (debajo del header):
- **Status banner**: Abierto (verde, muestra hora de cierre) / Cerrado (rojo, muestra próxima apertura)
- **Oferta banner**: si activa, muestra precio tachado + nuevo precio + badge -XX% + botón Agregar

### Catálogo:
- **Skeleton loader** mientras carga el JSON
- Todas las categorías visibles por defecto, separadas por sección con título
- Filtro por categoría: muestra/oculta secciones sin recargar
- Búsqueda: filtra cards por nombre en tiempo real
- **Product card**: imagen (o emoji placeholder) aspect-[4/3] + nombre + descripción + precio + botón "+ Agregar"
- Oferta: badge "Oferta" en la card + precio original tachado + precio especial

### Carrito drawer:
- Slide desde la derecha con backdrop blur
- Lista de items con qty control (+ / − / eliminar)
- Total estimado
- Textarea para nota de pedido
- Botón "Enviar pedido por WhatsApp" → genera mensaje estructurado por categoría
- Botón "Vaciar carrito"
- Persistencia en `localStorage`

### Otros:
- Scroll progress bar
- FAB carrito flotante en mobile
- Botón volver arriba
- GSAP entrada del catálogo
- Service Worker

---

## 8. `qr.html`

QR imprimible del link a `tienda.html` de producción. Usa `qrcodejs@1.0.0`.
Incluye: logo, nombre, tagline, QR, divider, CTA texto, URL, dirección, marca PushCommerce.
Tiene `@media print` para impresión limpia.

---

## 9. `404.html`

Dark, logo centrado, "404", "Esta página no existe.", botón volver al inicio.

---

## 10. Stack técnico

```
Tailwind CSS    via CDN (sin build step)
GSAP 3.12.5     via CDN (animaciones + ScrollTrigger)
Google Fonts    preconnect + link
qrcodejs 1.0.0  solo en qr.html
```

**Regla:** todo estático, GitHub Pages, sin build step obligatorio.
Si en el futuro se necesita algo más sofisticado (Astro, Vite) que siga siendo deployable en GH Pages sin costo, es válido — pero el default es CDN + HTML puro.

---

## 11. Paleta y tipografía (template mental)

```
color-dark:    fondo principal oscuro (del logo)
color-mid:     fondo de secciones alternadas
color-accent:  color principal de acento (del logo)
color-text:    texto principal
color-muted:   texto secundario / borders
color-light:   fondo claro / tarjetas
```

Tipografías recomendadas (usar pares distintos por cliente):
- Playfair Display + DM Sans (San Martín) — elegante clásico
- Oswald + Cormorant Garamond (Cincomentario) — bold artesanal  
- Libre Baskerville + Nunito — cálido accesible
- Fraunces + Inter — editorial moderno
- DM Serif Display + Outfit — sofisticado limpio
- Syne + Manrope — contemporáneo geométrico

---

## 12. URLs de producción

- Demo: `juliancarroccio.github.io/pushcommerce/pages/{slug}/`
- Producción: nueva cuenta GitHub `{slug}.github.io` → transferir repo

El QR siempre apunta a la URL de producción.

---

## 13. Checklist de entrega

- [ ] `productos.json` con datos reales (precios, horarios, productos de muestra)
- [ ] Paleta extraída del logo real
- [ ] `index.html` completo con todas las secciones
- [ ] `tienda.html` con buscador, filtros, carrito, WhatsApp checkout
- [ ] `qr.html` apuntando a URL de producción
- [ ] `404.html`
- [ ] `manifest.json` + `sw.js` + `robots.txt` + `sitemap.xml`
- [ ] Todas las imágenes en `img/` con nombres descriptivos
- [ ] `_FALLBACK` en index y tienda sincronizado con `productos.json`
- [ ] Probado en Chrome desktop y mobile (responsive)
- [ ] Abierto/Cerrado funciona según horario real
- [ ] Oferta muestra precio tachado + badge %
- [ ] Reseñas: 3 hardcodeadas, solo si rating ≥ 4★
- [ ] WhatsApp link con número correcto
- [ ] Google Maps embed con dirección correcta
