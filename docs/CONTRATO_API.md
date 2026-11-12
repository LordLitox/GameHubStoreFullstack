# Contrato frontend ↔ backend (EP3 · Parte 2)

Este documento fija **qué endpoint del backend consume cada vista del frontend** y **qué
desajustes de forma aparecen entre las dos partes**, con la decisión tomada para cada uno.
Es el insumo directo de `src/services/` (Parte 3) y del *Documento de APIs e Integración*
(Parte 8).

- **Backend:** ecosistema de microservicios Spring Boot (`Duoc-Fullstack2-GameHubStore-BackEnd-main`).
- **Punto de entrada único:** el API Gateway en `http://localhost:8080`.
- **Prefijo versionado:** `http://localhost:8080/api/v1` (el backend ya no expone `/api/...` sin versión: responde 404).
- **Swagger:** `http://localhost:8080/swagger-ui.html` · **Eureka:** `http://localhost:8761`.

## 1. Mapa vista → endpoint

| Vista (ruta React) | Qué necesita | Endpoint | Auth / rol |
| --- | --- | --- | --- |
| `Inicio` (`/`) | Productos destacados | `GET /api/v1/productos` | pública |
| `Catalogo` (`/catalogo`) | Listado + filtros | `GET /api/v1/productos` (filtro por `?categoria=slug`), `GET /api/v1/categorias` | pública |
| `Catalogo` / `Detalle` | Stock por producto | `GET /api/v1/inventario/stock?productos=1,2,3` | pública |
| `Catalogo` | Estrellas promedio | `GET /api/v1/resenas/resumen?productos=1,2,3` | pública |
| `Detalle` (`/detalle/:id`) | Ficha completa | `GET /api/v1/productos/{id}` | pública |
| `Detalle` | Reseñas aprobadas | `GET /api/v1/productos/{id}/resenas` | pública |
| `Carrito` (`/carrito`) | Validar stock/precios/cupón | `POST /api/v1/carrito/validar` | pública |
| `Carrito` | Aplicar cupón | `GET /api/v1/promociones/validar?codigo=XXX` | pública |
| `Checkout` (`/checkout`) | Crear la orden y pagar | `POST /api/v1/ordenes` | **CLIENTE** |
| `Ordenes` (`/ordenes`) | Historial del cliente | `GET /api/v1/ordenes/mias`, `GET /api/v1/ordenes/{id}` | **CLIENTE** |
| `Ordenes` | Garantía post-venta | `POST /api/v1/garantias`, `GET /api/v1/garantias/mias` | **CLIENTE** |
| `Admin` (`/admin`) | CRUD productos | `GET|POST /api/v1/admin/productos`, `PUT|PATCH /api/v1/admin/productos/{id}` | **ADMIN** |
| `Admin` | CRUD categorías | `GET|POST /api/v1/admin/categorias`, `PUT|DELETE /api/v1/admin/categorias/{id}` | **ADMIN** |
| `Admin` | CRUD promociones (cupones) | `GET|POST /api/v1/admin/promociones`, `PUT|PATCH /api/v1/admin/promociones/{id}` | **ADMIN** |
| `Admin` | Moderar reseñas | `GET /api/v1/admin/resenas`, `PUT /api/v1/admin/resenas/{id}` | **ADMIN** |
| `Admin` | Cuentas de usuario | `GET /api/v1/admin/usuarios`, `PATCH /api/v1/admin/usuarios/{id}/activo` | **ADMIN** |
| `Admin` / panel de vendedor | Stock y movimientos | `GET /api/v1/operador/inventario`, `GET|POST /api/v1/operador/inventario/movimientos` | **OPERADOR** |
| Panel de vendedor | Órdenes y despachos | `GET /api/v1/operador/resumen`, `GET /api/v1/operador/ordenes`, `POST /api/v1/operador/ordenes/{id}/pago/confirmar`, `POST /api/v1/operador/ordenes/{id}/despacho` | **OPERADOR** |
| Login / registro | Sesión | `POST /api/v1/auth/login`, `POST /api/v1/auth/registro`, `POST /api/v1/auth/renovar` | pública / token |
| Perfil | Datos del cliente | `GET|PUT /api/v1/usuarios/perfil` | **CLIENTE** |

Los endpoints `/internal/**` **no** pasan por el Gateway: son llamadas servicio-a-servicio y el
frontend no las usa.

## 2. Desajustes detectados y decisión tomada

El frontend viene de la EP2 con datos simulados (`src/data/productos.js`, `src/data/cupones.js`)
y el backend tiene su propio catálogo semilla (13 productos: Kairo, Voltra, Nimbo, Tectra…).
El contrato se resuelve **con adaptadores en el frontend**, sin tocar el backend salvo lo ya
hecho en la Parte 1.

| # | Dato | Frontend (EP2) | Backend | Decisión |
| --- | --- | --- | --- | --- |
| 1 | `categoria` | slug (`"consolas"`) | `categoria` (nombre `"Consolas"`) + `categoriaSlug` (`"consolas"`) | El adaptador usa **`categoriaSlug`** en `producto.categoria` (los filtros comparan slugs) y guarda el nombre visible en `categoriaNombre`. |
| 2 | Descuento | `descuentoVigente: { activo, porcentaje }` | `precio` (vigente) + `precioNormal` (tachado, `null` si no hay oferta) | Se **deriva**: `precio` pasa a ser el de lista (`precioNormal ?? precio`) y `descuentoVigente.porcentaje = round((1 - vigente/lista)·100)`. Así `precioFinalProducto()` de `src/lib/carrito.js` sigue mostrando el mismo número y los componentes no cambian. |
| 3 | `stockDisponible` | dentro del producto | **otro servicio** (`inventory-service`) | El adaptador recibe el stock como segundo argumento; `productos.listarConStock()` junta las dos llamadas. |
| 4 | `destacado` | campo explícito | no existe | Se define **destacado = producto en oferta** (`precioNormal != null`). Sin cambios en el backend. |
| 5 | `especificaciones` | objeto `{ clave: valor }` | lista `[{ clave, valor }]` | El adaptador convierte la lista en objeto. |
| 6 | `imagen` | ruta local `/assets/img/producto-*.jpg` | clave corta (`"gpu"`, `"notebook"`, `"teclado"`…) | El adaptador mapea clave → imagen local, con respaldo por categoría. El catálogo semilla tiene productos que no tienen foto propia en `public/assets/img/`. |
| 7 | Correo del checkout | campo `email` | `correo` (`DatosDespachoDto`) | El adaptador renombra al armar el cuerpo de `POST /api/v1/ordenes`. |
| 8 | Método de pago | `webpay` / `transferencia` / `mach` | enum `DEBITO` / `CREDITO` / `TRANSFERENCIA` | El adaptador traduce: `webpay → DEBITO`, `mach → DEBITO`, `transferencia → TRANSFERENCIA`. |
| 9 | Cupón | `{ codigo, porcentaje, topeMaximo, expira }` | `{ codigo, porcentaje, tope, inicio, termino }` | El adaptador renombra `tope→topeMaximo` y `termino→expira`. |
| 10 | Fechas | textos largos ya formateados | ISO-8601 (`2026-11-12T14:05:00`) | El formateo pasa a `src/lib/formato.js` en la Parte 6. |
| 11 | Errores | no existía manejo | `{ mensaje, errores: { campo: texto } }` (401/403 también con `mensaje`) | El cliente HTTP normaliza todo a `ErrorApi` (ver `src/services/cliente.js`). |
| 12 | Roles | no existían | `ADMIN` / `OPERADOR` / `CLIENTE` | Se conserva el valor del enum (viaja en el JWT) y la interfaz muestra el nombre de la pauta: `ADMIN→Administrador`, `OPERADOR→Vendedor`, `CLIENTE→Cliente`. |

## 3. Formato de error de la API

Todas las respuestas de error del backend tienen la misma forma:

```json
{ "mensaje": "El correo ya está registrado.", "errores": { "email": "Ya existe" } }
```

`errores` solo aparece en los errores de validación (400). El cliente del frontend lo expone
como `ErrorApi.errores` para que los formularios puedan pintar el mensaje junto al campo.

## 4. Cuentas de prueba

Contraseña `clave123` para todas (se cargan solas al arrancar el backend en perfil local):

| Correo | Rol |
| --- | --- |
| `ana@gamehub.test` | ADMIN (Administrador) |
| `luis@gamehub.test` | OPERADOR (Vendedor) |
| `camila@gamehub.test` | CLIENTE |
| `pedro@gamehub.test` | CLIENTE desactivada → `403` |
