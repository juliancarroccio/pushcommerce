# actualizar productos

Actualiza el catálogo de productos de un cliente editando solo `productos.json`.
No toca el HTML. Los cambios se reflejan automáticamente en la tienda.

## Modo de uso
```
/update-products
> Cliente: cincomentario
> Cambio: subir el precio del Queso Cremoso a $3200, agregar "Ricotta Casera" 250g $2400 en quesos
```

## Operaciones disponibles

### Cambiar precio
```json
{ "precio": 3200 }
```

### Cambiar nombre o unidad
```json
{ "nombre": "Queso Cremoso Premium", "unidad": "500g" }
```

### Agregar producto
Agregar al array `productos` de la categoría correspondiente:
```json
{ "id": 20, "nombre": "Ricotta Casera", "unidad": "250g", "precio": 2400, "imagen": "img/productos/ricotta-casera.jpg" }
```
- El `id` debe ser único en todo el archivo — usar el mayor existente + 1
- Buscar imagen provisoria en Unsplash/Pexels y descargarla en `img/productos/`
- Si no hay imagen disponible, omitir el campo `imagen` (el sistema muestra el emoji de la categoría)

### Eliminar producto
Remover el objeto del array de la categoría.

### Agregar categoría
Agregar al array `categorias`:
```json
{
  "id": "nuevacategoria",
  "label": "Nueva Categoría",
  "emoji": "🫙",
  "cols": 4,
  "productos": []
}
```

### Eliminar categoría
Remover el objeto completo de `categorias`.

### Cambiar datos del negocio
Editar `negocio.whatsapp`, `negocio.nombre` o `negocio.saludo`.

## Estructura del archivo
```
pages/{cliente}/productos.json
```

## Reglas
- Siempre leer el JSON completo antes de editar
- Validar que el JSON resultante sea válido (sin trailing commas, comillas correctas)
- Los `id` de productos son globalmente únicos dentro del archivo
- Los `id` de categorías son strings únicos (no números)
- Si se agrega un producto con imagen nueva: descargar la imagen en `img/productos/`
- `cols` solo acepta 3 o 4
