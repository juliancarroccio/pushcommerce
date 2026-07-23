# editar sección

Edita una sección puntual de una página existente de PushCommerce sin tocar el resto.

## Modo de uso
```
/edit-section
> Cliente: cincomentario
> Sección: contacto
> Cambio: actualizar el horario a "Lun-Sab 8-13 y 17-20"
```

## Pasos

1. **Identificar el archivo**: `pages/{cliente}/index.html` o `tienda.html`
2. **Leer el archivo completo** antes de editar
3. **Localizar la sección** por su comentario HTML (`<!-- ═══ NOMBRE ═══ -->`)
4. **Editar solo esa sección** — no tocar nada fuera de ella
5. **Preservar**: animaciones GSAP existentes, paleta de colores, tipografía, estructura del resto

## Secciones disponibles en index.html
- `NAV` — barra de navegación
- `HERO` — hero con logo y título animado
- `STATEMENT` — frase destacada del negocio
- `PRODUCTOS` — cards de categorías
- `STATS` — contadores animados (rating, reseñas)
- `CÓMO PEDIR` — pasos del proceso
- `CONTACTO` — dirección, teléfono, mapa
- `FOOTER` — pie de página
- `OFERTA` — oferta de la semana (si existe)
- `RESEÑAS` — reseñas Google (si existe)

## Secciones disponibles en tienda.html
- Header / pills de categoría → en `productos.json`
- Productos y precios → editar `productos.json` (usar /update-products)
- Carrito / WhatsApp → lógica JS en tienda.html

## Reglas
- Una sola sección por invocación
- Si el cambio requiere tocar más de una sección, advertir al usuario y pedir confirmación
- Si el cambio es de productos/precios, redirigir a `/update-products`
