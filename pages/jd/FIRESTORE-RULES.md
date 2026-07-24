# JD — Configuración Firebase

> ✅ **Configurado** — proyecto `jdantas-53617` (región `southamerica-east1`).
> `FIREBASE_CONFIG` real en: `tienda.html`, `producto.html`, `seguimiento.html`, `pedidos.html`.
> El modo demo (localStorage `jd_demo_pedidos`) queda inactivo automáticamente.

## Checklist de configuración (hecho 2026-07-23)

1. ✅ Proyecto `jdantas-53617` en https://console.firebase.google.com (plan Spark).
2. ✅ App web registrada → `firebaseConfig` copiado a los 4 HTML.
3. ✅ Firestore Database (modo producción, `southamerica-east1`).
4. ✅ Authentication → Anonymous habilitado (la usa `pedidos.html`).
5. ✅ Dominios autorizados: `jdmuebles.github.io` + `juliancarroccio.github.io`.
6. ✅ Reglas publicadas (abajo).

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
