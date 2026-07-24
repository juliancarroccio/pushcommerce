# JD — Configuración Firebase (pendiente)

> El proyecto Firebase **todavía no existe**. Todos los HTML tienen `FIREBASE_CONFIG` en
> placeholder (`TU_API_KEY`, `TU_PROYECTO`, etc.). Mientras tanto, la tienda funciona en
> **modo demo**: los pedidos se guardan en `localStorage` (`jd_demo_pedidos`) y el
> seguimiento los lee de ahí, así el flujo completo es navegable para mostrar al cliente.

## Pasos cuando se cree la cuenta

1. Crear proyecto en https://console.firebase.google.com (plan Spark, gratis).
2. Agregar app web → copiar el objeto `firebaseConfig`.
3. Reemplazar `FIREBASE_CONFIG` en estos 4 archivos:
   - `tienda.html`
   - `seguimiento.html`
   - `pedidos.html`
4. Habilitar **Firestore Database** (modo producción, región `southamerica-east1`).
5. Habilitar **Authentication → Anonymous** (la usa `pedidos.html`).
6. Publicar las reglas de abajo.

## Reglas Firestore

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /pedidos/{pedidoId} {
      // Cualquiera puede crear un pedido (checkout de la tienda),
      // pero con forma validada y estado inicial fijo.
      allow create: if request.resource.data.keys().hasAll(
          ['codigo','cliente','items','modalidad','subtotal','envio','total','estado']
        )
        && request.resource.data.estado == 'esperando_pago'
        && request.resource.data.codigo is string
        && request.resource.data.codigo.size() == 5
        && request.resource.data.items is list
        && request.resource.data.items.size() > 0
        && request.resource.data.items.size() <= 40
        && request.resource.data.cliente.nombre is string
        && request.resource.data.cliente.nombre.size() > 0
        && request.resource.data.cliente.nombre.size() <= 80
        && request.resource.data.cliente.telefono is string
        && request.resource.data.cliente.telefono.size() >= 6
        && request.resource.data.nota.size() <= 400;

      // Lectura pública: el seguimiento busca por campo `codigo`
      // (el código de 5 chars actúa como capability token).
      allow read: if true;

      // Solo el negocio (auth anónima desde pedidos.html) actualiza estado o borra.
      allow update: if request.auth != null
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['estado'])
        && request.resource.data.estado in
           ['esperando_pago','pago_recibido','en_fabricacion','terminado','enviado','cancelado'];
      allow delete: if request.auth != null;
    }
  }
}
```

> Nota: los pedidos manuales de `pedidos.html` se crean con auth anónima activa, por lo
> que si se quiere permitir crear con estado distinto se puede agregar:
> `allow create: if request.auth != null;` como cláusula adicional.

## Estados del pedido (contrato entre tienda / seguimiento / cola)

| Estado | Cliente ve | Columna en pedidos.html |
|---|---|---|
| `esperando_pago` | Esperando seña (30%) | Esperando seña |
| `pago_recibido` | Seña recibida | Seña recibida |
| `en_fabricacion` | En fabricación | En fabricación |
| `terminado` | Terminado / Listo para retirar | Terminado |
| `enviado` | Enviado / Entregado | (pasa a Historial) |
| `cancelado` | Cancelado | (pasa a Historial) |
