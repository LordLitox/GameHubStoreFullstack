# Documento de APIs e Integración — GameHub Store (EP3)

**Proyecto:** GameHub Store — tienda gamer full-stack
**Asignatura:** DSY1104 Desarrollo Fullstack II — Evaluación Parcial 3
**Integrantes:** LordLitox y equipo
**Fecha:** noviembre de 2026

---

## 1. Introducción y alcance

GameHub Store es una tienda de productos gamer con **frontend React** y un
**backend de microservicios Spring Boot**. La Evaluación Parcial 3 (EP3) tiene
como objetivo integrar ambas mitades: que la aplicación web consuma datos y
servicios reales en lugar de la información simulada de la EP2.

Este documento describe:

1. la arquitectura de la integración;
2. el catálogo completo de endpoints expuestos por el API Gateway;
3. el contrato de datos entre el frontend y el backend (DTO, adaptadores,
   formato de error);
4. los mecanismos de seguridad (autenticación por token y autorización por rol);
5. el protocolo de pruebas y la evidencia de verificación.

---

## 2. Arquitectura de la integración

### 2.1 Vista general

El frontend **nunca** llama a un microservicio directamente: todo el tráfico
entra por el **API Gateway** (puerto `8080`), que enruta por ruta y valida el
token antes de reenviar la petición al servicio correspondiente. Los servicios
internos no publican puertos y solo se hablan entre ellos por `/internal/**`.

```
┌────────────────────┐        HTTPS/JSON         ┌───────────────────────┐
│  React (Vite)      │  ───────────────────────▶ │  API Gateway  :8080   │
│  src/services/**   │   /api/v1/** + Bearer     │  (Spring Cloud GW)    │
└────────────────────┘                           └───────────┬───────────┘
                                                             │  Eureka
             ┌───────────────┬───────────────┬───────────────┼───────────────┬───────────────┐
             ▼               ▼               ▼               ▼               ▼               ▼
        auth-service   product-service  category-service inventory-svc  promotion-svc   order-service
             │               │               │               │               │               │
        user-service   review-service   payment-service shipping-service  warranty-service
                                                             │
                                                    eureka-server :8761
```

### 2.2 Decisiones de diseño

| Decisión | Justificación |
|---|---|
| **Un único cliente HTTP** (`src/services/cliente.js`) | La URL base, el `Bearer` y el formato de error se cambian en un solo archivo. |
| **URL base versionada** `/api/v1` | Pauta de la EP3; permite evolucionar la API sin romper a los clientes. |
| **Adaptadores DTO → vista** (`adaptadores.js`) | El backend no coincide en todos los campos con lo que esperan las vistas; la traducción se concentra en un módulo en vez de repartirse por las páginas. |
| **Caché de catálogo** (`catalogoCache.js`) | Inicio, Catálogo y el carrito piden la misma lista; la promesa se memoiza para no duplicar llamadas. |
| **Errores normalizados** | El backend responde `{ mensaje, errores }`; el cliente lo convierte en `ErrorApi` con `estado`, `errores`, `esSinSesion` y `esSinPermiso`. |
| **Autorización en el backend** | Ocultar un enlace o una ruta en React es solo usabilidad; la seguridad real la aplica el Gateway/servicio por rol. |

---

## 3. Catálogo de endpoints

Todos los endpoints públicos y de cliente cuelgan de `/api/v1` a través del
Gateway. Los de operador y administrador exigen rol específico (ver §5).

### 3.1 Autenticación (`auth-service`)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/api/v1/auth/login` | público | Inicia sesión; devuelve `{ token, usuario }`. |
| POST | `/api/v1/auth/registro` | público | Crea una cuenta de cliente y deja la sesión iniciada. |
| POST | `/api/v1/auth/renovar` | autenticado | Emite un token nuevo antes de que venza. |

### 3.2 Productos (`product-service`)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/v1/productos` | público | Catálogo activo; filtro opcional `?categoria=`. |
| GET | `/api/v1/productos/{id}` | público | Ficha completa de un producto. |
| GET | `/api/v1/admin/productos` | ADMIN | Lista completa (activos e inactivos). |
| POST | `/api/v1/admin/productos` | ADMIN | Crea un producto. |
| PUT | `/api/v1/admin/productos/{id}` | ADMIN | Actualiza un producto. |
| PATCH | `/api/v1/admin/productos/{id}/activo` | ADMIN | Activa o desactiva la venta. |

### 3.3 Categorías (`category-service`)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/v1/categorias` | público | Categorías con su conteo de productos activos. |
| GET | `/api/v1/admin/categorias` | ADMIN | Categorías incluyendo productos inactivos. |
| POST | `/api/v1/admin/categorias` | ADMIN | Crea una categoría. |
| PUT | `/api/v1/admin/categorias/{id}` | ADMIN | Renombra una categoría. |
| DELETE | `/api/v1/admin/categorias/{id}` | ADMIN | Elimina una categoría sin productos. |

### 3.4 Inventario (`inventory-service`)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/v1/inventario/stock` | público | Stock de todos los productos (o de `?productos=1,2`). |
| GET | `/api/v1/operador/inventario` | OPERADOR | Stock para el panel del vendedor. |
| GET | `/api/v1/operador/inventario/movimientos` | OPERADOR | Historial de movimientos de bodega. |
| POST | `/api/v1/operador/inventario/movimientos` | OPERADOR | Registra un movimiento (INGRESO, SALIDA, AJUSTE). |

### 3.5 Promociones y cupones (`promotion-service`)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/v1/promociones/validar` | público | Valida un cupón (`?codigo=`). 404 si no sirve. |
| GET | `/api/v1/admin/promociones` | ADMIN | Lista de promociones. |
| POST | `/api/v1/admin/promociones` | ADMIN | Crea una promoción. |
| PUT | `/api/v1/admin/promociones/{id}` | ADMIN | Actualiza una promoción. |
| PATCH | `/api/v1/admin/promociones/{id}/activo` | ADMIN | Activa o desactiva la promoción. |

### 3.6 Carrito y órdenes (`order-service`)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/api/v1/carrito/validar` | público | Valida el carrito contra stock y precios. |
| POST | `/api/v1/ordenes` | CLIENTE | Crea la orden y registra el pago simulado. |
| GET | `/api/v1/ordenes/mias` | CLIENTE | Historial de órdenes del cliente. |
| GET | `/api/v1/ordenes/{id}` | CLIENTE | Detalle de una orden propia. |
| GET | `/api/v1/operador/resumen` | OPERADOR | Cifras del panel (pagos, despachos, en curso). |
| GET | `/api/v1/operador/ordenes` | OPERADOR | Bandeja de órdenes (`?estado=`). |
| GET | `/api/v1/operador/ordenes/{id}` | OPERADOR | Detalle completo de cualquier orden. |
| POST | `/api/v1/operador/ordenes/{id}/pago/confirmar` | OPERADOR | Confirma una transferencia pendiente y descuenta stock. |
| POST | `/api/v1/operador/ordenes/{id}/pago/anular` | OPERADOR | Anula un pago pendiente. |
| POST | `/api/v1/operador/ordenes/{id}/despacho` | OPERADOR | Genera el despacho en shipping-service. |
| PUT | `/api/v1/operador/ordenes/{id}/despacho` | OPERADOR | Avanza el despacho (DESPACHADO, EN_TRANSITO, ENTREGADO). |

### 3.7 Pagos y despachos (paneles)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/v1/operador/pagos` | OPERADOR | Pagos (`?estado=`). |
| GET | `/api/v1/operador/despachos` | OPERADOR | Despachos (`?estado=`). |

### 3.8 Reseñas (`review-service`)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/v1/productos/{id}/resenas` | público | Reseñas aprobadas de un producto. |
| GET | `/api/v1/resenas/resumen` | público | Promedio y cantidad por producto. |
| GET | `/api/v1/resenas/mias` | CLIENTE | Reseñas del cliente autenticado. |
| POST | `/api/v1/resenas` | CLIENTE | Publica una reseña de una compra (queda PENDIENTE). |
| GET | `/api/v1/admin/resenas` | ADMIN | Reseñas para moderar (`?estado=`). |
| PUT | `/api/v1/admin/resenas/{id}` | ADMIN | Aprueba (APROBADA) u oculta (OCULTA). |

### 3.9 Usuarios y garantías

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/v1/usuarios/perfil` | autenticado | Perfil del usuario con sesión. |
| PUT | `/api/v1/usuarios/perfil` | autenticado | Actualiza el perfil. |
| GET | `/api/v1/admin/usuarios` | ADMIN | Lista de cuentas. |
| PATCH | `/api/v1/admin/usuarios/{id}/activo` | ADMIN | Activa o desactiva una cuenta. |
| GET | `/api/v1/garantias` | CLIENTE | Garantías del cliente. |
| GET | `/api/v1/operador/garantias` | OPERADOR | Garantías para el vendedor. |
| PUT | `/api/v1/operador/garantias/{id}` | OPERADOR | Cambia el estado de una garantía. |

> Los endpoints `/internal/**` son de comunicación entre microservicios y **no**
> se exponen por el Gateway; quedan fuera del contrato con el frontend.

---

## 4. Contrato de datos (DTO y adaptadores)

El backend y el frontend no usan los mismos nombres en todos los campos. En vez
de retocar cada vista, la traducción vive en `src/services/adaptadores.js`:

| DTO del backend | Campo en la vista | Transformación |
|---|---|---|
| `ProductoResumenDto.precio` + `precioNormal` | `precio`, `descuentoVigente` | El descuento se deriva del porcentaje entre ambos precios. |
| `categoria` / `categoriaSlug` | `categoriaNombre` / `categoria` | El filtro usa el *slug*; el nombre visible va aparte. |
| `StockDto.stock` (otro servicio) | `stockDisponible` | El stock se pide a inventory-service y se pega al producto. |
| `EspecificacionDto[]` | `especificaciones` (`{}`) | La lista se convierte en objeto para la ficha técnica. |
| `OrdenDetalleDto.creadaEn` | `fecha` | Fecha ISO que la vista formatea. |
| `MetodoPago` (`DEBITO`, `TRANSFERENCIA`) | `metodoPago` del formulario | `webpay`/`mach` → `DEBITO`; `transferencia` → `TRANSFERENCIA`. |
| `DatosDespachoDto.correo` | `email` del formulario | Renombre simple. |
| `CuponDto.tope` / `termino` | `topeMaximo` / `expira` | El motor de cupones del frontend ya usaba esos nombres. |

El detalle campo a campo está en `docs/CONTRATO_API.md`.

### Formato de error

Toda respuesta de error del backend llega como:

```json
{ "mensaje": "Descripción legible", "errores": { "campo": "detalle" } }
```

El cliente lo normaliza a `ErrorApi` (propiedades `estado`, `errores`,
`esSinSesion`, `esSinPermiso`), de modo que las vistas muestran `mensaje` y, si
hay `errores`, los pintan junto a cada campo del formulario.

---

## 5. Seguridad: token y roles

- **Autenticación:** el login devuelve un **JWT**. El frontend lo guarda en
  `localStorage` (`gh_sesion_v1`) y lo envía en cada petición como
  `Authorization: Bearer <token>`. Si el backend responde **401**, el cliente
  cierra la sesión y la interfaz reacciona sola.
- **Autorización por rol:** el Gateway/servicio valida el rol del token en cada
  endpoint. Los roles del backend y su nombre visible en la pauta son:

| Enum del backend | Nombre en la interfaz | Alcance |
|---|---|---|
| `ADMIN` | Administrador | Todo, incluido el mantenedor `/admin`. |
| `OPERADOR` | Vendedor | Panel `/vendedor`: órdenes, pagos, despachos, inventario. |
| `CLIENTE` | Cliente | Catálogo, carrito, checkout e historial. |

- **Defensa en profundidad:** React oculta enlaces y bloquea rutas por rol
  (`RutaProtegida`), pero la comprobación que cuenta es la del backend. El humo
  verifica que CLIENTE y OPERADOR reciben **403** en `/admin/**` y sin token
  **401**.

---

## 6. Protocolo de pruebas y evidencia

| Prueba | Comando | Resultado |
|---|---|---|
| Unitarias de vistas y servicios | `npm test` | **157/157** en verde. |
| Cobertura | `npm run test:coverage` | 82,6 % sentencias · 84,1 % líneas. |
| Build de producción | `npm run build` | OK. |
| Humo HTTP contra el Gateway real | `node scripts/verificar-flujo-ep3.mjs` | **21/21**. |
| Humo de navegador (CDP) sobre la app viva | `node scripts/verificar-navegador-ep3.mjs` | **14/14** + pantallazos. |

Los pantallazos del flujo quedan en `docs/capturas/` y alimentan el Manual de
Usuario.

---

## 7. Instrucciones de ejecución

```bash
# 1. Backend (14 módulos; Eureka primero). Ver la guía de arranque local.
cd Duoc-Fullstack2-GameHubStore-BackEnd-main
./mvnw -B install -DskipTests
java -jar eureka-server/target/eureka-server.jar     # esperar a que suba :8761
for s in auth-service product-service ...; do java -jar $s/target/$s.jar & done

# 2. Frontend
cd GameHubStoreFullstack-desarrollo
npm install
npm run dev        # http://localhost:5173
```

La URL del Gateway se configura con la variable `VITE_API_URL`
(por defecto `http://localhost:8080/api/v1`).
