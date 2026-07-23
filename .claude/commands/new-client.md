# nuevo cliente PushCommerce

Pipeline completo para crear una landing page + tienda para un nuevo negocio local de Las Flores.

## Pasos obligatorios (en orden)

### 1. Investigar el negocio
- Buscar con WebSearch: nombre del negocio + "Las Flores Buenos Aires"
- Buscar en Overpass API (via WebFetch, NO curl): negocios del tipo en Las Flores
  - Endpoint: `https://overpass-api.de/api/interpreter?data=[out:json];...`
- Extraer: dirección, teléfono, redes sociales, rating Google, horarios
- Si tiene Instagram: NO intentar scrapear, pedir screenshot/logo al usuario
- Si tiene Facebook: intentar WebFetch para extraer datos públicos

### 2. Logo y paleta de colores
- Pedir al usuario que pegue el logo o una foto del local en el chat
- Usar ColorThief para extraer la paleta dominante:
  ```
  python3 -c "
  from colorthief import ColorThief
  ct = ColorThief('path/al/logo.jpg')
  palette = ct.get_palette(color_count=6, quality=1)
  print(palette)
  "
  ```
- Construir la paleta con: fondo oscuro, color primario, color acento, texto claro
- NUNCA inventar colores — siempre del logo real

### 3. Crear estructura de carpetas
```
pages/{nombre-cliente}/
├── img/
│   └── productos/   (si tiene tienda)
├── index.html
├── tienda.html      (si aplica)
└── productos.json   (si tiene tienda)
```

### 4. Generar index.html (landing)
- Usar el mismo stack que Cincomentario como base:
  - Tailwind via CDN, GSAP + ScrollTrigger via CDN
  - Fuentes Google: Oswald (display) + Cormorant Garamond (serif)
- Secciones obligatorias:
  - Nav (transparente → blur on scroll)
  - Hero (logo + título letra x letra + parallax)
  - Statement (frase del negocio)
  - Productos/Servicios (cards con stagger)
  - Stats (si tiene rating Google, con count-up)
  - Cómo pedir / Cómo funciona (alternating steps)
  - Contacto (split columns + mapa embed)
  - Footer
- Grain texture animada (obligatoria)
- Paleta: siempre del logo real del cliente

### 5. Generar tienda.html + productos.json (si aplica)
- Solo si el negocio vende productos con precios claros
- Usar la misma estructura que `pages/cincomentario/tienda.html`
- Productos van en `productos.json`, NO hardcodeados en el HTML
- Buscar imágenes provisorias en Unsplash/Pexels/Wikimedia para cada producto
- WhatsApp del negocio en `productos.json > negocio.whatsapp`

### 6. Verificar localmente
- El servidor HTTP ya corre en puerto 8000
- Dar URL: `http://localhost:8000/pages/{cliente}/index.html`

## Restricciones
- Costo = $0 (sin APIs pagas, sin servicios de pago)
- Sin build steps — todo CDN
- La paleta SIEMPRE del logo real
- No inventar datos del negocio — solo lo que se pudo verificar
