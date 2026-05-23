# Comandos del proyecto PushCommerce

## Servidor local

El JSON y las imágenes no funcionan abriéndolos directo como archivo (`file://`).
Hay que levantar un servidor HTTP primero.

### Iniciar
```bash
cd /Users/juliancarroccio/Documents/repos/pushcommerce
python3 -m http.server 8000
```
Dejalo corriendo en la terminal. Abrí el browser en:
- **Landing:** http://localhost:8000/pages/cincomentario/index.html
- **Tienda:** http://localhost:8000/pages/cincomentario/tienda.html
- **QR imprimible:** http://localhost:8000/pages/cincomentario/qr.html

### Ver cambios en el JSON
Con el servidor corriendo, refrescá con `Cmd+Shift+R` (hard refresh, ignora caché).
Si sigue sin verse: abrí en ventana incógnito (`Cmd+Shift+N`).
El fetch ya tiene `cache: 'no-cache'` así que después del primer hard refresh siempre va a buscar la versión nueva.

### Ver cambios en el HTML/CSS
Igual, solo `Cmd+R`. Si no se actualizan: `Cmd+Shift+R` (fuerza sin caché).

### Detener el servidor
`Ctrl+C` en la terminal donde lo iniciaste.

O si no sabés cuál terminal es:
```bash
lsof -ti :8000 | xargs kill
```

### Reiniciar (puerto ocupado / cambios que no se ven)
```bash
lsof -ti :8000 | xargs kill
cd /Users/juliancarroccio/Documents/repos/pushcommerce
python3 -m http.server 8000
```
Después `Cmd+Shift+R` en el browser.

### Múltiples clientes — mismo servidor
Un solo servidor sirve todos los proyectos. No hace falta levantar uno por cliente:
```
http://localhost:8000/pages/cincomentario/
http://localhost:8000/pages/bodegon1856/
http://localhost:8000/pages/bar-vieja-estacion/
```
Cada carpeta dentro de `pages/` es un sitio independiente.

### Ver si ya hay un servidor corriendo
```bash
lsof -i :8000
```
Si muestra resultados, ya está corriendo en ese puerto. No hay que levantar otro.

---

## Cambios rápidos al catálogo

El archivo a editar es siempre:
```
pages/cincomentario/productos.json
```

### Cambiar un precio
Buscar el producto por nombre y cambiar `"precio": XXXX`.

### Activar/desactivar oferta de la semana
```json
"oferta": {
  "activa": true,   ← cambiar a false para ocultarla en todo el sitio
  ...
}
```

### Agregar un producto
Copiar un objeto existente dentro de la categoría correspondiente,
cambiar `id` (tiene que ser el número más alto + 1), nombre, unidad y precio.
Si tiene imagen: guardarla en `pages/cincomentario/img/productos/nombre.jpg`.

---

## Git (cuando el repo esté configurado)

```bash
# Ver qué cambió
git status
git diff

# Subir un cambio de productos/precios
git add pages/cincomentario/productos.json
git commit -m "feat: actualizar precios semana X"
git push

# Subir cambio de imagen
git add pages/cincomentario/img/productos/
git commit -m "feat: agregar imagen producto X"
git push
```

---

## Activar Google Analytics GA4

1. Ir a [analytics.google.com](https://analytics.google.com) → crear cuenta → crear propiedad → "Web"
2. Copiar el **Measurement ID** (formato `G-XXXXXXXXXX`)
3. Pegarlo en `productos.json`:
   ```json
   "negocio": {
     ...
     "analytics_id": "G-XXXXXXXXXX"
   }
   ```
4. Listo. El sitio carga GA4 automáticamente si el campo no está vacío.
   No hace falta tocar el HTML.

---

## Extraer paleta de un logo nuevo

```bash
python3 -c "
from colorthief import ColorThief
ct = ColorThief('pages/CLIENTE/logo.jpg')
print('Dominante:', ct.get_color(quality=1))
print('Paleta:', ct.get_palette(color_count=6, quality=1))
"
```

---

## Descargar una imagen de producto

```bash
curl -L -o pages/CLIENTE/img/productos/nombre-producto.jpg "URL_DE_LA_IMAGEN"
```

---

## Carpeta del proyecto

```
pushcommerce/
├── CLAUDE.md          ← contexto automático para Claude Code
├── COMANDOS.md        ← este archivo
├── PLAYBOOK.md        ← modelo de negocio y precios
└── pages/
    └── cincomentario/
        ├── index.html         ← landing
        ├── tienda.html        ← catálogo con carrito
        ├── qr.html            ← QR imprimible
        ├── productos.json     ← TODO el catálogo y la oferta (editar acá)
        └── img/
            └── productos/     ← fotos de productos
```
