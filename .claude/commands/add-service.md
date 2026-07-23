# agregar servicio

Inyecta una feature nueva en una página existente de PushCommerce.
Cada feature es un módulo independiente — se agrega sin romper lo existente.

## Modo de uso
```
/add-service
> Cliente: cincomentario
> Feature: reseñas
```

## Features disponibles

---

### `oferta` — Oferta de la semana
Sección en `index.html` antes del footer. Controlada por `productos.json`.

Agrega en `productos.json`:
```json
"oferta": {
  "activa": true,
  "titulo": "Oferta de la semana",
  "producto": "Tabla Especial",
  "descripcion": "6-8 personas · incluye selección premium",
  "precio_original": 20000,
  "precio_oferta": 16000,
  "vigencia": "Hasta el domingo"
}
```

La sección se renderiza desde el JSON, se actualiza sin tocar el HTML.

---

### `reseñas` — Reseñas Google
Sección en `index.html` con el rating y opiniones reales (hardcoded — Google no tiene API pública gratuita).

Requiere del usuario:
- Rating (ej: 4.7)
- Total de reseñas (ej: 34)
- Al menos 3 reseñas reales con nombre y texto

Diseño: fondo oscuro, estrellas amber, card por reseña con nombre y texto.

---

### `qr` — QR imprimible
Genera una página `qr.html` con el QR de la landing, lista para imprimir y pegar en el local.

Usa la librería `qrcode.js` via CDN. El QR apunta a la URL del cliente (GitHub Pages o dominio).

Requiere del usuario: URL final del sitio.

---

### `mercadopago` — Pago con MercadoPago
Agrega botón "Pagar con MercadoPago" en el carrito de `tienda.html`.

Flujo: genera un link de pago de MercadoPago Checkout Pro con el total del carrito.
Requiere credenciales del cliente (Public Key de MP).

Para el demo: muestra el botón deshabilitado con tooltip "requiere configuración".

---

### `horarios` — Horarios de atención
Card en la sección de contacto de `index.html` con los horarios del local.
Requiere del usuario: horarios por día.

---

### `galeria` — Galería de fotos
Sección en `index.html` con grid de fotos del local.
Requiere del usuario: fotos (las pega en el chat).

---

## Reglas
- Leer el archivo destino completo antes de editar
- Agregar la sección en el lugar correcto del HTML (antes del footer, después de contacto, etc.)
- Agregar la animación GSAP correspondiente en el bloque `<script>`
- Actualizar el nav si la sección tiene anchor link
- Una feature por invocación
