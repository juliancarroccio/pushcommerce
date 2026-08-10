# Cattorini — Novedades de la Iteración 2

Guía rápida de todo lo que se agregó o corrigió en esta segunda tanda de cambios, con pasos concretos para que puedas probar cada cosa vos mismo antes de darla por aprobada.

No hace falta que la leas de punta a punta de una sentada — usala como checklist: andá tildando a medida que probás cada sección.

---

## 1. Tu tienda online (lo que ven tus clientes)

### 1.1 Colores y stock reales por talle
Ahora cada producto puede tener colores distintos cargados por talle, con la cantidad disponible de cada uno. Cuando se agota un color, el sitio no deja comprarlo más — se bloquea solo.

**Cómo probarlo:**
1. Entrá a un producto que ya tenga colores cargados (pedime cuáles si no te acordás)
2. Elegí un talle y fijate que aparezcan los colores disponibles
3. Intentá pedir más cantidad de la que hay en stock de ese color — el sitio te tiene que avisar y no dejarte agregar
4. Los productos que todavía no tienen color/stock cargado se siguen vendiendo como antes, sin selector de color — no se rompió nada de lo viejo

### 1.2 "Nuestra Producción" en vez de "Fábrica", y año de fundación corregido
Se sacó cualquier mención a "fábrica" (Cattorini no fabrica en el local, vende producción propia y de otras marcas). También se corrigió el año de fundación: **1959**, no 1978 — así que ahora dice "más de 60 años" en vez de "45 años".

**Cómo probarlo:**
1. Entrá a la landing (la página principal)
2. Fijate en el hero y en la sección de historia que diga "desde 1959" y "más de 60 años"
3. Confirmá que ya no aparece la palabra "fábrica" en ningún lado del texto

### 1.3 Catálogo mayorista vs. minorista (fabricación propia)
En el portal ahora podés marcar si un producto es de fabricación propia o de otra marca. Los de otra marca **solo se venden a minoristas** en el local — nunca aparecen en el catálogo mayorista.

**Cómo probarlo:**
1. En el Portal → tab Catálogo, marcá un producto como "Fab. propia" apagado y publicá
2. Entrá a la tienda como minorista: el producto tiene que aparecer normal
3. Entrá a la tienda como mayorista: ese producto no tiene que aparecer en el catálogo
4. Intentá entrar directo al link del producto siendo mayorista (por si alguien lo comparte) — tiene que decir "Producto no encontrado", no dejarlo comprar de todos modos

### 1.4 Envío mayorista: ya no dice "gratis"
Antes el cartel de envío decía "gratis en compras superiores a $X" incluso para mayoristas, cuando en realidad el envío mayorista **nunca es gratis** — siempre se cobra aparte. Se corrigió el texto para que quede claro.

**Cómo probarlo:**
1. Entrá a la tienda como mayorista y mirá el cartel de información de envío
2. Tiene que decir algo como "el costo de envío se discrimina aparte y se suma al total", sin mencionar "gratis"
3. Como minorista, el cartel de envío gratis por monto sigue funcionando igual que siempre

### 1.5 Mínimo de compra para mayoristas
Podés definir en el Portal un monto mínimo de compra para cuentas mayoristas. Si un mayorista no llega a ese monto, ve un aviso y no puede confirmar el pedido hasta agregar más productos.

**Cómo probarlo:**
1. Portal → tab Mayoristas → Configuración → fijate el "Mínimo de compra" (o cambialo)
2. Entrá a la tienda como mayorista y armá un carrito por debajo de ese monto
3. Tiene que aparecer un cartel avisando cuánto falta, con el botón "Confirmar pedido" deshabilitado
4. Agregá más productos hasta superar el mínimo — el cartel tiene que desaparecer y el botón habilitarse
5. Como minorista, no debería aparecer nunca este cartel

### 1.6 Pago por QR con titular y banco
Cuando un pedido queda pendiente de pago (envío, o retiro con pago electrónico), además del QR ahora se muestra el **nombre del titular y el banco** de la cuenta destino — así el cliente puede confirmar que está pagando donde corresponde, incluso si el QR falla.

**Cómo probarlo:**
1. Portal → tab "Datos de pago" → subí tu QR real y completá titular y banco, si todavía no lo hiciste
2. Hacé un pedido de prueba con envío (o retiro + pago QR)
3. En la pantalla de confirmación tiene que aparecer el QR junto con titular y banco
4. Volvé más tarde a la página de seguimiento de ese pedido (sin haber pagado) — tiene que volver a mostrarte el mismo QR con los datos

### 1.7 Retiro en local: elegir cómo pagar
Al elegir "Retiro en local", ahora el cliente puede elegir entre "Pago en el local" (por default) o "Pago electrónico (QR)". Si elige pagar en el local, no se le muestra ningún QR — el pedido queda esperando a que lo confirmes vos cuando lo abone.

**Cómo probarlo:**
1. Hacé un pedido de prueba eligiendo Retiro
2. Fijate que aparezca el selector "¿Cómo vas a pagar?"
3. Probá las dos opciones y confirmá que el QR solo aparece cuando corresponde

### 1.8 Guía de talles por producto (no por categoría)
Antes, todos los productos de una misma categoría (por ejemplo "Camisas") compartían la misma guía de talles. Ahora cada producto puede tener su propia guía — útil para diferenciar, por ejemplo, "camisa corte clásico" de "camisa slim fit" dentro de la misma categoría.

**Cómo probarlo:**
1. Entrá a dos productos de la misma categoría que sepas que tienen cortes distintos
2. Abrí "Ver guía de talles" en cada uno y confirmá que las tablas de medidas corresponden a cada producto

### 1.9 Selector de color más claro en la ficha de producto
Al elegir un talle en la ficha de un producto, si ese talle tiene colores cargados, aparece un selector visual de colores con la cantidad disponible de cada uno.

**Cómo probarlo:**
1. Entrá a un producto con colores cargados
2. Elegí un talle y confirmá que se ve claro cuáles colores hay y cuántas unidades quedan de cada uno

### 1.10 Seguimiento de pedido accesible desde la tienda y la landing
Se agregó un link "Mis pedidos" / "Seguir mi pedido" tanto en la tienda como en la landing, para que el cliente pueda consultar el estado de un pedido anterior sin tener que guardar el link a mano.

**Cómo probarlo:**
1. Entrá a la landing y a la tienda, buscá el link de seguimiento en el menú/footer
2. Hacé click y confirmá que te lleva a la página de seguimiento con el buscador de código

### 1.11 QR de la página de seguimiento, mejor ubicado
El QR que se muestra en la página de seguimiento (cuando el pedido sigue pendiente de pago) se veía chico y corrido hacia la izquierda. Ahora se muestra centrado y más grande.

**Cómo probarlo:**
1. Entrá al seguimiento de un pedido pendiente de pago
2. Confirmá que el QR se ve centrado y con buen tamaño, fácil de escanear

### 1.12 Foto del negocio al pedir cuenta mayorista
El formulario público de "Solicitar cuenta mayorista" ahora tiene un campo opcional para subir una foto del negocio — te da una idea de dónde se va a vender el producto antes de aprobar la cuenta.

**Cómo probarlo:**
1. Entrá a la landing → "Solicitar cuenta mayorista"
2. Completá el formulario con una foto y enviala
3. En el Portal → Solicitudes, confirmá que podés ver (y agrandar con un click) la foto adjunta

---

## 2. Tu panel de administración (Portal)

### 2.1 Catálogo con buscador y productos plegables
La lista de productos en el tab Catálogo ahora tiene un buscador arriba, y cada producto aparece colapsado por default (solo el nombre) — hacés click para desplegar y editar sus datos. Mucho más fácil de navegar cuando hay muchos productos.

**Cómo probarlo:**
1. Portal → tab Catálogo → escribí algo en el buscador y confirmá que filtra por nombre
2. Hacé click en un producto y confirmá que se despliega mostrando todos sus campos
3. Cargá color y stock de un producto directamente ahí, sin cambiar de tab

### 2.2 Tab Stock con el mismo buscador
El tab Stock, que antes tenía un menú desplegable gigante para elegir producto, ahora funciona igual que Catálogo: buscador + lista plegable.

**Cómo probarlo:**
1. Portal → tab Stock → sub-tab Editar → probá el buscador
2. Hacé click en un producto para desplegarlo y cargar o editar su stock

### 2.3 Tab nueva "Datos de pago"
Se creó una tab dedicada donde subís tu QR de cobro y completás titular y banco de la cuenta destino (antes el QR vivía mezclado en la tab Imágenes).

**Cómo probarlo:**
1. Portal → tab "Datos de pago" → confirmá que ahí está tu QR y los campos de titular/banco
2. Editá algo, publicá, y confirmá que se refleja en un pedido de prueba (ver ítem 1.6)

### 2.4 Aviso cuando ya hay un mayorista activo en la misma zona
Al revisar una solicitud pendiente, si ya existe un mayorista activo en esa misma localidad, ahora ves un cartel amarillo de aviso con su nombre — para que decidas a criterio si conviene aceptarla igual. No te bloquea nada, es solo informativo.

**Cómo probarlo:**
1. Con un mayorista activo ya cargado en una localidad, generá (o simulá) una solicitud nueva de esa misma localidad
2. Portal → Mayoristas → Solicitudes → confirmá que aparece el cartel de aviso apenas entrás a la tab (no hace falta recargar ni esperar)

---

## 3. Cola de pedidos

### 3.1 Carga manual con buscador, color y control de stock
Al cargar un pedido manual (venta por teléfono o mostrador), ahora podés buscar el producto por nombre, elegir color si el producto lo tiene cargado, y el sitio controla que no cargues más cantidad de la que hay en stock. Al confirmar, descuenta el stock real — igual que una venta online.

**Cómo probarlo:**
1. Cola de pedidos → "+ Manual"
2. Buscá un producto por nombre, elegí talle y color
3. Intentá cargar más cantidad de la disponible — tiene que avisarte y no dejarte
4. Confirmá el pedido y anda a chequear en Portal → Stock que la cantidad bajó

### 3.2 Código de pedido consistente en todos lados
Antes, el código que veía el cliente y el que se mostraba en la tarjeta, el detalle, el historial y el CSV exportado a veces no coincidían — imposible saber de qué pedido hablaba alguien que llamaba. Ya está corregido: es siempre el mismo código en los 4 lugares.

**Cómo probarlo:**
1. Tomá el código de un pedido de prueba (el que le llega al cliente)
2. Buscalo en la tarjeta del kanban, en el modal de detalle, en el historial y en el CSV exportado
3. Confirmá que es el mismo código en los 4 lugares

### 3.3 Columna "Pendiente de pago" con indicador visual
La primera columna de la cola ahora se llama "Pendiente de pago" y cada tarjeta muestra un chip: 💳 si el pedido espera pago electrónico, o 🏬 si el cliente va a pagar en el local. Así distinguís de un vistazo qué pedidos necesitan que confirmes el pago recibido.

**Cómo probarlo:**
1. Generá un pedido con pago QR y otro con "pago en el local"
2. Confirmá que las tarjetas muestran el chip correspondiente a cada uno

---

## 4. Correcciones internas (no se ven, pero importan)

Estas son cosas que se rompían silenciosamente y que ya quedaron resueltas — no necesitan que pruebes nada puntual, pero te las dejo anotadas para que sepas qué se arregló:

- **"Publicar cambios" avisaba éxito sin publicar nada realmente** en algunos casos (aparecía "0 file changed" en GitHub). Ahora, si no hay cambios reales para publicar, te avisa explícitamente en vez de decir "Publicado" sin haber pasado nada.
- **El chip de cantidad de mayoristas activos** quedaba en cero hasta entrar puntualmente a esa sub-tab. Ahora se carga apenas entrás al portal.
- **El autocompletado de datos del mayorista** en el checkout de envío a veces no persistía. Ya quedó estable.
- **El "scroll" de la guía de talles** saltaba de posición al abrirla. Corregido.

---

## Resumen para revisar rápido

Si tenés poco tiempo, priorizá probar estos 5, que son los cambios más grandes:

1. Colores y stock por talle (1.1)
2. Mínimo de compra mayorista (1.5)
3. Pago QR con titular y banco (1.6 + 2.3)
4. Carga manual con buscador/color/stock (3.1)
5. Aviso de zona duplicada en Solicitudes (2.4)

Cualquier cosa que no se comporte como está descripto acá, avisame con captura y te lo reviso.
