# Especificación de Requisitos de Software (ERS)

## GameHub Store — Tienda de comercio electrónico gamer

| Campo | Valor |
| --- | --- |
| **Producto** | GameHub Store — aplicación web SPA |
| **Versión del documento** | 3.0 |
| **Fecha** | 12 de noviembre de 2026 |
| **Asignatura** | Desarrollo FullStack II (DSY1104) |
| **Entrega** | Evaluación Parcial 3 |
| **Equipo** | 3 integrantes (ver historial de *commits* del repositorio) |
| **Repositorio frontend** | https://github.com/LordLitox/GameHubStoreFullstack |
| **Repositorio backend** | https://github.com/LordLitox/GameHubStoreFullstack-Backend |
| **Estado** | Aprobado para la entrega EP3 |

---

## 1. Introducción

### 1.1 Propósito

Este documento especifica los requisitos de software de **GameHub Store**, una
tienda en línea de hardware, periféricos y accesorios gamer. Su objetivo es
servir como contrato de referencia entre el equipo de desarrollo y la evaluación
del curso: define **qué** debe hacer el sistema, bajo **qué restricciones** y
**cómo se verifica** cada requisito.

El documento describe la aplicación React + Vite **integrada con el backend de
microservicios** en la Evaluación Parcial 3. La migración del sitio HTML/CSS/JS
vanilla de la Evaluación Parcial 1 a React queda registrada en `MIGRACION.md`.
El catálogo de endpoints y el contrato de datos entre frontend y backend se
documentan en los anexos de la entrega de la EP3 (Documentación de APIs e
Integración).

### 1.2 Alcance

El sistema es una **aplicación de una sola página (SPA)** que cubre el flujo
completo de compra de productos gamer. A partir de la **Evaluación Parcial 3
(EP3)** el frontend React deja de usar datos simulados y **se integra con un
backend de microservicios Spring Boot** a través de un API Gateway:

1. Navegar la portada y el catálogo de productos (datos reales del backend).
2. Filtrar y ordenar el catálogo.
3. Consultar la ficha de un producto, con sus reseñas aprobadas.
4. Armar y editar un carrito de compras.
5. Validar y aplicar cupones contra el servidor y calcular totales.
6. Iniciar sesión o registrarse; la sesión persiste y define los permisos.
7. Completar un checkout con validación en tiempo real que **crea la orden real**.
8. Revisar el historial de pedidos propios y solicitar una garantía post-venta.
9. Administrar el catálogo, las categorías y las promociones desde el panel
   `/admin` (rol Administrador), con persistencia en el backend.
10. Gestionar pedidos, pagos, despachos e inventario desde el panel `/vendedor`
    (rol Vendedor).

El **estado del carrito y la sesión** se persisten en el navegador con
`localStorage`; los **datos de negocio** (productos, stock, órdenes, usuarios)
viven en el backend.

**Fuera de alcance (EP3):** pasarela de pago real (el pago sigue siendo
simulado), correos transaccionales, despliegue en la nube del backend y buscador
de texto libre. Se detallan en el anexo C.

### 1.3 Definiciones y acrónimos

| Término | Definición |
| --- | --- |
| **SPA** | *Single Page Application*: una sola página HTML cuyo contenido cambia sin recargar el navegador. |
| **Carrito** | Conjunto de líneas (producto + cantidad) que el usuario pretende comprar. |
| **Línea de carrito** | Registro con `id`, `nombre`, `precio` unitario y `cantidad` de un producto agregado. |
| **Precio final** | Precio del producto con su descuento de catálogo ya aplicado. |
| **Subtotal** | Suma de `precio × cantidad` de todas las líneas del carrito. |
| **Cupón** | Código que aplica un porcentaje de descuento con un tope máximo en pesos. |
| **Total** | Subtotal menos el descuento del cupón; nunca inferior a 0. |
| **Unidad mínima de prueba** | Componente, página o función pura verificada por al menos una prueba automatizada. |
| **Ruta** | Dirección de la aplicación gestionada por React Router (p. ej. `/catalogo`). |

### 1.4 Referencias

| Documento | Ubicación |
| --- | --- |
| Código fuente de la aplicación | `src/` |
| Guía de migración (proceso EP1 → EP2, histórica) | [`MIGRACION.md`](MIGRACION.md) |
| Documento de cobertura de pruebas | [`COBERTURA.md`](COBERTURA.md) |
| Configuración de pruebas | `karma.conf.cjs` |
| WCAG 2.1 — nivel AA | https://www.w3.org/TR/WCAG21/ |
| Bootstrap 5.3 | https://getbootstrap.com/docs/5.3/ |

---

## 2. Descripción general

### 2.1 Perspectiva del producto

GameHub Store es un producto **independiente y autocontenido**: no se integra
con sistemas externos ni consume servicios de terceros en tiempo de ejecución.
Se compila como un sitio estático (`npm run build` → `dist/`) y se ejecuta
íntegramente en el navegador del usuario.

| Capa | Tecnología | Responsabilidad |
| --- | --- | --- |
| Presentación | React 18 + JSX | Componentes y páginas declarativas. |
| Navegación | React Router 6 | 8 rutas (7 vistas + ruta comodín 404), sin recargas. |
| Estado global | React Context + `useReducer` | Carrito y cupón activo compartidos por todas las vistas. |
| Lógica de negocio | Módulos puros en `src/lib/` | Stock, precios, cupones, totales y validaciones (sin React ni DOM). |
| Datos | Módulos estáticos en `src/data/` | Productos y cupones simulados. |
| Estilos | Bootstrap 5.3 + `src/styles.css` | Sistema de rejilla responsivo y tema de marca propio. |
| Pruebas | Karma + Jasmine + Testing Library | 116 pruebas sobre lógica, componentes, páginas y CRUD de datos. |

### 2.2 Funciones del producto

| Módulo | Descripción | Requisitos |
| --- | --- | --- |
| **M1. Interfaz general y navegación** | Layout común, menú, contador de carrito y ruta 404. | RF-01 – RF-06 |
| **M2. Inicio** | Portada con video, categorías, destacados y beneficios. | RF-07 – RF-10 |
| **M3. Catálogo** | Listado de productos con filtros y ordenamiento. | RF-11 – RF-17 |
| **M4. Detalle de producto** | Ficha comercial, stock, especificaciones, reseñas y modal técnico. | RF-18 – RF-26 |
| **M5. Carrito de compras** | Edición de líneas, cupones y totales. | RF-27 – RF-36 |
| **M6. Checkout** | Datos de despacho, validación y confirmación. | RF-37 – RF-44 |
| **M7. Post-venta** | Historial de pedidos y solicitud de garantía. | RF-45 – RF-49 |
| **M8. Persistencia** | Estado del carrito y del cupón en `localStorage`. | RF-50 – RF-53 |
| **M9. Gestión de datos (CRUD)** | Panel `/admin` y operaciones Crear, Leer, Actualizar y Eliminar sobre los productos y cupones del backend. | RF-54 – RF-59 |
| **M10. Integración con el backend** | Capa de servicios HTTP única hacia el API Gateway; las vistas consumen datos reales. | RF-60 – RF-66 |
| **M11. Autenticación y permisos** | Sesión con JWT, login/registro, restricción de rutas y menú por rol. | RF-67 – RF-71 |
| **M12. Panel del vendedor** | Gestión de órdenes, pagos, despachos e inventario (rol OPERADOR). | RF-72 – RF-75 |

### 2.3 Características de los usuarios

El sistema tiene un **único tipo de usuario** (comprador anónimo), que asume
distintos roles según el momento del flujo:

| Rol | Necesidad principal | Vistas que utiliza |
| --- | --- | --- |
| Visitante | Descubrir productos y comparar precios. | Inicio, Catálogo, Detalle |
| Comprador | Armar el pedido, aplicar descuentos y pagar. | Carrito, Checkout |
| Cliente post-venta | Revisar pedidos y ejercer la garantía legal. | Mis pedidos |
| Administrador (demo) | Gestionar el catálogo y los cupones con operaciones CRUD. | Administración (`/admin`) |

No existe registro, inicio de sesión ni perfil de usuario en esta entrega. El
acceso al panel de administración es público (no implementa autenticación).

### 2.4 Restricciones

- **RC-01.** Frontend obligatorio con **React** y empaquetado con **Vite 5**.
- **RC-02.** Diseño responsivo obligatorio con **Bootstrap 5.3** (tema oscuro).
- **RC-03.** Pruebas unitarias con **Jasmine** ejecutadas por **Karma** en
  Chrome Headless.
- **RC-04.** Sin backend ni base de datos: los datos son estáticos y el estado
  se guarda en el navegador.
- **RC-05.** La lógica de negocio debe vivir en módulos puros y testeables
  (`src/lib/`), separada de los componentes.
- **RC-06.** Idioma de la interfaz: español de Chile; montos en pesos chilenos
  (CLP) sin decimales.

### 2.5 Supuestos y dependencias

- **SU-01.** El usuario accede con un navegador moderno con JavaScript y
  `localStorage` habilitados (Chrome, Edge, Firefox o Safari actuales).
- **SU-02.** Las imágenes y el video de `public/assets/` están disponibles en
  el servidor de despliegue.
- **SU-03.** El catálogo se entrega con 8 productos de demostración suficientes
  para representar las 4 categorías, descuentos y caso de stock agotado.
- **SU-04.** La fecha del sistema del cliente es confiable para evaluar
  vencimiento de cupones y plazos de garantía.

---

## 3. Requisitos específicos

### 3.1 Casos de uso principales

| ID | Caso de uso | Actor | Requisitos involucrados |
| --- | --- | --- | --- |
| CU-01 | Explorar y filtrar el catálogo | Visitante | RF-12, RF-13, RF-14, RF-16, RF-17 |
| CU-02 | Consultar la ficha de un producto | Visitante | RF-18 – RF-25 |
| CU-03 | Comprar un producto | Visitante → Comprador | RF-03, RF-21, RF-22, RF-27 – RF-36, RF-37 – RF-44 |
| CU-04 | Aplicar un cupón de descuento | Comprador | RF-32, RF-33, RF-34, RF-35 |
| CU-05 | Solicitar garantía post-venta | Cliente post-venta | RF-45 – RF-49 |

### 3.2 Requisitos funcionales

Prioridad: **A** = imprescindible, **M** = importante, **B** = deseable.

#### M1 — Interfaz general y navegación

| ID | Requisito | Prioridad |
| --- | --- | --- |
| RF-01 | Todas las vistas comparten un layout con cabecera, contenido principal y pie de página, más un enlace "Saltar al contenido principal". | A |
| RF-02 | La cabecera ofrece un menú con Inicio, Catálogo, Carrito, Checkout y Mis pedidos, resaltando la ruta activa (`aria-current="page"`). | A |
| RF-03 | La cabecera muestra un contador con la cantidad total de unidades del carrito que se actualiza en tiempo real. | A |
| RF-04 | En pantallas menores al breakpoint `lg`, el menú se colapsa en un botón desplegable con estado accesible (`aria-expanded`, `aria-controls`). | A |
| RF-05 | Cualquier ruta desconocida muestra una página 404 con un enlace de retorno al inicio. | M |
| RF-06 | El título del documento (`<title>`) se actualiza según la vista activa. | B |

#### M2 — Inicio

| ID | Requisito | Prioridad |
| --- | --- | --- |
| RF-07 | La portada presenta un bloque principal con video de demostración (póster y subtítulos en español) y accesos directos al catálogo y a los destacados. | M |
| RF-08 | La portada ofrece cuatro accesos por categoría (Consolas, Periféricos, Sillas, Accesorios) que llevan al catálogo. | M |
| RF-09 | La portada lista los productos marcados como destacados. | A |
| RF-10 | La portada muestra una sección informativa de beneficios (despacho, garantía, pago seguro). | B |

#### M3 — Catálogo

| ID | Requisito | Prioridad |
| --- | --- | --- |
| RF-11 | El catálogo lista todos los productos en tarjetas con imagen, categoría, nombre enlazado al detalle, disponibilidad, precio final y precio original tachado cuando hay descuento. | A |
| RF-12 | Permite filtrar por categoría (todas o una de las cuatro categorías). | A |
| RF-13 | Permite filtrar por marca (todas o una de las ocho marcas del catálogo). | A |
| RF-14 | Permite filtrar por rango de precio en CLP mediante campos de mínimo y máximo. | A |
| RF-15 | Si el mínimo informado supera el máximo, se muestra un mensaje de error visible (`role="alert"`) y no se listan resultados. | A |
| RF-16 | Permite ordenar los resultados por destacados/defecto, precio ascendente, precio descendente o nombre A–Z. | M |
| RF-17 | Cuando ningún producto coincide con los filtros, se muestra un aviso informativo en lugar de una lista vacía. | M |

#### M4 — Detalle de producto

| ID | Requisito | Prioridad |
| --- | --- | --- |
| RF-18 | La vista de detalle resuelve el producto a partir del identificador de la ruta (`/detalle/:id`). | A |
| RF-19 | Muestra el precio final del producto y, si el descuento está activo, el precio original tachado. | A |
| RF-20 | Indica el stock disponible o el estado "agotado" cuando el stock es 0. | A |
| RF-21 | Permite elegir la cantidad a comprar, acotada entre 1 y el stock disponible; el control se deshabilita si no hay stock. | A |
| RF-22 | Agrega el producto al carrito validando cantidad y stock, y entrega retroalimentación del resultado. | A |
| RF-23 | Muestra la tabla de especificaciones técnicas del producto. | M |
| RF-24 | Ofrece un modal "Ver ficha técnica ampliada" con las especificaciones completas. | B |
| RF-25 | Muestra reseñas de clientes simuladas con su puntaje. | B |
| RF-26 | Si el identificador no corresponde a ningún producto, se muestra un mensaje y un enlace de retorno al catálogo. | M |

#### M5 — Carrito de compras

| ID | Requisito | Prioridad |
| --- | --- | --- |
| RF-27 | El carrito lista sus líneas en una tabla con imagen, nombre, marca, precio unitario, cantidad, subtotal y acciones. | A |
| RF-28 | Cada línea permite aumentar o disminuir la cantidad con botones `−`/`+`; llegar a 0 elimina la línea. | A |
| RF-29 | Cada línea puede eliminarse individualmente. | A |
| RF-30 | Existe una acción para vaciar el carrito completo. | M |
| RF-31 | Si el carrito está vacío se muestra un estado explícito con acceso al catálogo. | A |
| RF-32 | Permite ingresar un código de cupón y aplicarlo; los códigos se normalizan (mayúsculas, sin espacios). | A |
| RF-33 | Informa el resultado del cupón: aplicado, inexistente, expirado o campo vacío, distinguiendo éxito de error. | A |
| RF-34 | Permite quitar el cupón aplicado y recalcular los totales. | M |
| RF-35 | Muestra subtotal, descuento aplicado y total a pagar, con el tope máximo del cupón respetado y total nunca negativo. | A |
| RF-36 | Ofrece un acceso directo a la vista de checkout. | A |

#### M6 — Checkout

| ID | Requisito | Prioridad |
| --- | --- | --- |
| RF-37 | El checkout muestra un resumen del pedido con las líneas, el subtotal, el descuento y el total. | A |
| RF-38 | El formulario de despacho exige siete campos: nombre y apellido, correo electrónico, teléfono móvil, región, comuna, dirección y método de pago. | A |
| RF-39 | Cada campo se valida al perder el foco (`blur`) y muestra un mensaje de error asociado cuando es inválido. | A |
| RF-40 | Un campo que ya mostraba error se revalida en vivo mientras el usuario escribe. | M |
| RF-41 | Al enviar el formulario se validan todos los campos; si hay errores, el foco se mueve al primer campo inválido y no se genera la orden. | A |
| RF-42 | Si el carrito está vacío, el checkout lo advierte y el botón de confirmación permanece deshabilitado. | A |
| RF-43 | Con el formulario válido se confirma la orden mostrando un número generado (formato `GH-XXXXXX`) y el total pagado. | A |
| RF-44 | Tras confirmar, el carrito se vacía y el usuario es redirigido a la vista de pedidos. | A |

#### M7 — Post-venta

| ID | Requisito | Prioridad |
| --- | --- | --- |
| RF-45 | La vista de pedidos lista órdenes simuladas con número, fecha, estado, producto, seguimiento, total y medio de pago. | M |
| RF-46 | Ofrece un formulario de solicitud de garantía con fecha de recepción, motivo y descripción de la falla. | M |
| RF-47 | Valida que la fecha de recepción no sea futura y que no hayan transcurrido más de 180 días corridos. | A |
| RF-48 | Exige seleccionar un motivo de la lista de opciones. | A |
| RF-49 | Exige una descripción de al menos 20 caracteres y, al enviar correctamente, confirma la recepción de la solicitud y limpia el formulario. | A |

#### M8 — Persistencia

| ID | Requisito | Prioridad |
| --- | --- | --- |
| RF-50 | Al iniciar la aplicación se restauran el carrito y el cupón activo desde `localStorage` (claves `gh_carrito_v1` y `gh_cupon_activo_v1`). | A |
| RF-51 | Todo cambio en el carrito se persiste automáticamente. | A |
| RF-52 | El cupón activo se guarda al aplicarse y se elimina del almacenamiento al quitarse o vaciar el carrito. | M |
| RF-53 | Si el contenido almacenado está corrupto o no es JSON válido, la aplicación parte con el carrito vacío sin fallar. | M |

#### M10 — Integración con el backend

| ID | Requisito | Prioridad |
| --- | --- | --- |
| RF-60 | Todo el acceso a datos pasa por una capa de servicios única (`src/services/`) que habla con el API Gateway en la URL base versionada `/api/v1`, configurable con `VITE_API_URL`. | A |
| RF-61 | El cliente HTTP adjunta la cabecera `Authorization: Bearer <token>` en las peticiones autenticadas y la omite en las públicas. | A |
| RF-62 | Las respuestas de error del backend `{ mensaje, errores }` se normalizan a un objeto con `estado`, `errores`, `esSinSesion` y `esSinPermiso`. | A |
| RF-63 | El catálogo, la ficha del producto, las reseñas, el stock y las categorías que muestran las vistas provienen del backend, no de datos simulados. | A |
| RF-64 | La validación de cupón se realiza contra el servidor; un cupón inexistente o vencido informa el motivo sin lanzar una excepción no controlada. | A |
| RF-65 | El checkout crea una orden real en el backend (con su pago simulado) y muestra el número y el estado de pago que devuelve el servidor. | A |
| RF-66 | Las vistas muestran estados de **carga** y de **error con reintento** mientras esperan la respuesta del backend. | M |

#### M11 — Autenticación y permisos

| ID | Requisito | Prioridad |
| --- | --- | --- |
| RF-67 | El usuario puede iniciar sesión con correo y contraseña; el sistema guarda el token y el usuario de la sesión. | A |
| RF-68 | El usuario puede registrarse como cliente; al registrarse queda con sesión iniciada. | M |
| RF-69 | La sesión sobrevive a recargar la página (rehidratación desde `localStorage`) y se cierra sola si el backend responde 401. | A |
| RF-70 | Las rutas `/checkout` y `/ordenes` exigen rol CLIENTE; `/admin`, rol ADMIN; `/vendedor`, roles OPERADOR o ADMIN. | A |
| RF-71 | El menú de la cabecera se filtra por rol y permite cerrar la sesión. | M |

#### M12 — Panel del vendedor

| ID | Requisito | Prioridad |
| --- | --- | --- |
| RF-72 | El vendedor ve una bandeja de órdenes con su estado de pago y de despacho, filtrable por estado. | M |
| RF-73 | El vendedor puede confirmar o anular un pago pendiente. | M |
| RF-74 | El vendedor puede generar un despacho y avanzar su estado (despachado, en tránsito, entregado). | M |
| RF-75 | El vendedor puede consultar el stock y registrar movimientos de inventario (ingreso, salida, ajuste). | B |

### 3.3 Reglas de negocio

| ID | Regla | Requisito relacionado |
| --- | --- | --- |
| RN-01 | Precio final = `precio × (1 − porcentaje/100)` redondeado al peso, solo si el descuento vigente está activo. | RF-19, RF-11 |
| RN-02 | No se puede agregar un producto sin stock ni superar el stock disponible sumando la cantidad ya presente en el carrito. | RF-21, RF-22, RF-28 |
| RN-03 | Descuento del cupón = `min(round(subtotal × porcentaje/100), topeMaximo)`; total = `max(0, subtotal − descuento)`. | RF-35 |
| RN-04 | Un cupón está vigente mientras la fecha actual no supere su fecha de expiración a las 23:59:59. | RF-32, RF-33 |
| RN-05 | Los códigos de cupón no distinguen mayúsculas ni espacios laterales. | RF-32 |
| RN-06 | El nombre completo debe tener al menos 5 caracteres e incluir al menos un espacio (nombre y apellido). | RF-38, RF-39 |
| RN-07 | El correo debe cumplir el patrón `texto@dominio.extensión`. | RF-38, RF-39 |
| RN-08 | El teléfono debe ser un móvil chileno: 9 dígitos que comienzan con 9 (`/^9\d{8}$/`). | RF-38, RF-39 |
| RN-09 | Región y método de pago son listas obligatorias; comuna y dirección requieren al menos 4 caracteres. | RF-38, RF-39 |
| RN-10 | La garantía legal cubre hasta 180 días corridos desde la recepción, sin fechas futuras. | RF-47 |
| RN-11 | La descripción de la falla requiere al menos 20 caracteres. | RF-49 |
| RN-12 | El descuento visible de un producto se deriva de `precioNormal` y `precio` del backend (porcentaje = `round((1 − precio/precioNormal) × 100)`). | RF-63 |
| RN-13 | El nombre del rol se muestra según la pauta: `ADMIN`=Administrador, `OPERADOR`=Vendedor, `CLIENTE`=Cliente. El enum del backend no se renombra. | RF-71 |
| RN-14 | Los medios de pago del formulario se traducen al enum del backend: `webpay`/`mach` → `DEBITO`, `transferencia` → `TRANSFERENCIA`. | RF-65 |
| RN-15 | La protección real de un endpoint la aplica el backend por rol; ocultar un enlace en el frontend es solo usabilidad. | RF-70 |

### 3.4 Requisitos no funcionales

| ID | Categoría | Requisito | Criterio de verificación |
| --- | --- | --- | --- |
| RNF-01 | Accesibilidad | Cumplir WCAG 2.1 nivel AA: HTML semántico, contraste ≥ 4.5:1, navegación por teclado, etiquetas asociadas y regiones anunciadas. | Revisión con marcado semántico y variables de contraste del tema. |
| RNF-02 | Usabilidad responsiva | Adaptarse a móvil, tablet y escritorio con la rejilla de Bootstrap 5.3, sin desplazamiento horizontal. | Verificación en 375 px y 1280 px de ancho. |
| RNF-03 | Compatibilidad | Ejecutarse en las versiones actuales de Chrome, Edge, Firefox y Safari. | Ejecución en Chrome Headless (pruebas) y navegadores de escritorio. |
| RNF-04 | Rendimiento | El catálogo y los filtros se resuelven en el cliente sin recargar la página; las imágenes de tarjeta usan carga diferida. | Filtrado con `useMemo`; atributo `loading="lazy"`. |
| RNF-05 | Mantenibilidad | La lógica de negocio reside en módulos puros de `src/lib/`, separada de los componentes de React. | Estructura de `src/` y ausencia de lógica duplicada en las vistas. |
| RNF-06 | Testeabilidad | Toda función de negocio y los flujos principales deben tener pruebas automatizadas que superen el 80 % de cobertura en los módulos instrumentados. | `npm test` (116/116 en verde) y `npm run test:coverage`. |
| RNF-07 | Privacidad | Los datos del formulario y del carrito nunca salen del navegador; no se envían a servidores externos. | Ausencia de llamadas de red en tiempo de ejecución. |
| RNF-08 | Localización | Interfaz en español de Chile y montos formateados como CLP sin decimales. | Uso de `Intl.NumberFormat("es-CL")`. |
| RNF-09 | Retroalimentación | Toda acción relevante entrega respuesta visual o textual (éxito, error o estado vacío) con `role="alert"` o `role="status"`. | Inspección de las vistas y de las pruebas de páginas. |
| RNF-10 | Portabilidad | El build debe ser un sitio estático desplegable en cualquier hosting. | `npm run build` genera `dist/`. |
| RNF-11 | Tolerancia a fallos de red | Si el backend no responde, la interfaz muestra un aviso con reintento en lugar de quedar en blanco; el carrito sigue usable con datos locales de respaldo. | Revisión de los estados de error y del respaldo de catálogo. |
| RNF-12 | Seguridad | La sesión usa JWT en `localStorage`; el frontend nunca decide la autorización por sí solo. | Humo HTTP: 401 sin token y 403 por rol en endpoints protegidos. |

### 3.5 Interfaces externas

| Interfaz | Descripción |
| --- | --- |
| **Usuario (UI)** | Interfaz web en español, tema oscuro "Vitrina Oscura", componentes Bootstrap (navbar, card, table, form, alert, modal) sobre variables de marca. |
| **Navegador** | Persistencia mediante `localStorage` del dominio (carrito y sesión); usa `window.alert` como retroalimentación de acciones puntuales. |
| **API (HTTP/JSON)** | El frontend consume el **API Gateway** de microservicios en `http://localhost:8080/api/v1` (configurable con `VITE_API_URL`), con autenticación por JWT. |
| **Red** | Requiere el backend en ejecución para los datos de negocio; las imágenes se sirven localmente desde `public/assets/`. |
| **Sistema de archivos** | Solo en tiempo de desarrollo: `npm run build` produce `dist/`. |

### 3.6 Modelo de datos

| Entidad | Campos | Origen |
| --- | --- | --- |
| **Producto** | `id`, `nombre`, `marca`, `categoria`, `precio`, `descuentoVigente {activo, porcentaje}`, `stockDisponible`, `destacado`, `imagen`, `descripcion`, `especificaciones` | `product-service` + `inventory-service` vía el Gateway (adaptado por `adaptadores.js`) |
| **Cupón** | `codigo`, `porcentaje`, `topeMaximo`, `expira` | `promotion-service` |
| **Línea de carrito** | `id`, `nombre`, `marca`, `categoria`, `precio` (final), `precioOriginal`, `imagen`, `stockDisponible`, `cantidad` | Derivada por `agregarAlCarrito()` |
| **Cupón activo** | Copia del cupón aplicado | Estado global + `localStorage` |
| **Usuario / sesión** | `id`, `nombre`, `email`, `rol`, `token` | `auth-service` + `localStorage` |
| **Orden** | `numero`, `estado`, `subtotal`, `descuento`, `total`, `lineas`, `pago`, `despacho` | `order-service` |
| **Reseña** | `id`, `autor`, `puntuacion`, `comentario`, `fecha`, `estado` | `review-service` |

**Almacenamiento local**

| Clave | Contenido | Ciclo de vida |
| --- | --- | --- |
| `gh_carrito_v1` | Arreglo JSON de líneas de carrito. | Se escribe en cada cambio; se vacía al confirmar la compra o vaciar. |
| `gh_cupon_activo_v1` | Objeto JSON del cupón aplicado. | Se escribe al aplicar; se elimina al quitar o vaciar. |
| `gh_sesion_v1` | `{ token, usuario }` de la sesión. | Se escribe al entrar; se elimina al cerrar sesión o al recibir un 401. |

### 3.7 Vistas y rutas

| Vista | Ruta | Requisitos |
| --- | --- | --- |
| Inicio | `/` | RF-07 – RF-10, RF-63 |
| Catálogo | `/catalogo` | RF-11 – RF-17, RF-63 |
| Detalle de producto | `/detalle/:id` | RF-18 – RF-26, RF-63 |
| Carrito | `/carrito` | RF-27 – RF-36, RF-64 |
| Checkout | `/checkout` (CLIENTE) | RF-37 – RF-44, RF-65, RF-70 |
| Mis pedidos / Post-venta | `/ordenes` (CLIENTE) | RF-45 – RF-49, RF-65, RF-70 |
| Ingreso / Registro | `/ingresar` | RF-67 – RF-69 |
| Panel del vendedor | `/vendedor` (OPERADOR/ADMIN) | RF-72 – RF-75, RF-70 |
| Administración | `/admin` (ADMIN) | RF-54 – RF-59, RF-66, RF-70 |
| Página no encontrada | `*` | RF-05 |

Las rutas con paréntesis exigen el rol indicado (guardia `RutaProtegida`); el
backend vuelve a validar el rol en cada endpoint.

---

## 4. Verificación y validación

### 4.1 Estrategia de pruebas

| Nivel | Alcance | Herramientas |
| --- | --- | --- |
| **Unitario (lógica pura)** | `src/lib/`: `carrito.js`, `cupones.js`, `validaciones.js`, `formato.js`. | Jasmine |
| **Unitario (estado global)** | `CarritoContext`: reductor, persistencia, cupones y guarda de `useCarrito`. | Jasmine + Testing Library |
| **Componentes** | `TarjetaProducto` (render por props, descuento, sin stock) y `Cabecera` (contador, menú móvil, ruta activa). | Testing Library (DOM real) |
| **Páginas / integración** | `Carrito` (tabla, cantidades, cupón, estado vacío), `Checkout` (validación en `blur`/`input`, bloqueo y confirmación) y `Admin` (alta, edición, borrado con confirmación, validación de duplicados). | Testing Library + React Router |
| **Mocks** | `localStorage` en memoria, `window.alert` y `Math.random` (número de orden determinista). | Jasmine spies |

| **Servicios (HTTP)** | `src/services/`: cliente, adaptadores, productos, órdenes, cupones, reseñas y caché de catálogo, con el Gateway simulado. | Jasmine + doble de `fetch` |
| **Humo HTTP** | Flujo completo contra el backend real por el Gateway (login, catálogo, orden, roles). | `scripts/verificar-flujo-ep3.mjs` (Node) |
| **Humo de navegador** | Recorrido de la app en vivo por CDP sobre Chrome headless. | `scripts/verificar-navegador-ep3.mjs` |

Las pruebas se ejecutan con **Karma + Jasmine** en **Chrome Headless** y el JSX
se transforma con **karma-vite**, por lo que el código se ejerce tal como se
ejecuta en el navegador, sin necesidad de un DOM simulado.

### 4.2 Comandos

```bash
npm install            # instalar dependencias
npm test               # 157 pruebas (Karma + Jasmine)
npm run test:coverage  # pruebas + reporte de cobertura en coverage/
npm run build          # build de producción en dist/

# Con el backend y el dev server arriba:
node scripts/verificar-flujo-ep3.mjs       # humo HTTP contra el Gateway (21 comprobaciones)
node scripts/verificar-navegador-ep3.mjs   # humo de navegador (14 comprobaciones) + capturas
```

### 4.3 Resultados

| Métrica | Valor |
| --- | --- |
| Pruebas ejecutadas | **157 (157 en verde)** |
| Archivos de prueba | 14 |
| Cobertura de sentencias | 82,57 % |
| Cobertura de ramas | 70,21 % |
| Cobertura de funciones | 78,91 % |
| Cobertura de líneas | 84,06 % |
| Humo HTTP contra el backend real | **21/21** |
| Humo de navegador (CDP) | **14/14** |

La cobertura bajó respecto de la EP2 porque ahora incluye `src/services/**`
(el cliente HTTP y las vistas conectadas al backend) y varias ramas de manejo de
error que se ejercen en el humo, no en las pruebas unitarias. El detalle está en
[`COBERTURA.md`](COBERTURA.md).

### 4.4 Matriz de trazabilidad

| Requisitos | Implementación | Pruebas |
| --- | --- | --- |
| RF-01 – RF-06 | `components/Layout.jsx`, `components/Cabecera.jsx`, `components/PieSitio.jsx`, `hooks/useTitulo.js`, `App.jsx` | `components/__tests__/Cabecera.test.jsx` |
| RF-07 – RF-10 | `pages/Inicio.jsx`, `components/TarjetaProducto.jsx` | `components/__tests__/TarjetaProducto.test.jsx` |
| RF-11 – RF-17 | `pages/Catalogo.jsx` | Humo de navegador (`verificar-navegador-ep3.mjs`) |
| RF-18 – RF-26 | `pages/Detalle.jsx`, `lib/carrito.js` | `lib/__tests__/carrito.test.js`, humo de navegador |
| RF-27 – RF-36 | `pages/Carrito.jsx`, `context/CarritoContext.jsx`, `lib/carrito.js`, `lib/cupones.js` | `pages/__tests__/Carrito.test.jsx`, `context/__tests__/CarritoContext.test.jsx`, `lib/__tests__/cupones.test.js` |
| RF-37 – RF-44 | `pages/Checkout.jsx`, `lib/validaciones.js` | `pages/__tests__/Checkout.test.jsx`, `lib/__tests__/validaciones.test.js` |
| RF-45 – RF-49 | `pages/Ordenes.jsx`, `lib/validaciones.js` | `lib/__tests__/validaciones.test.js` |
| RF-50 – RF-53 | `context/CarritoContext.jsx` | `context/__tests__/CarritoContext.test.jsx` |
| RF-54 – RF-59 | `pages/Admin.jsx`, `services/admin.js` | `pages/__tests__/Admin.test.jsx` |
| RF-60 – RF-66 | `services/cliente.js`, `services/adaptadores.js`, `services/catalogoCache.js`, `hooks/useDatos.js`, `components/EstadoCarga.jsx` | `services/__tests__/cliente.test.js`, `services/__tests__/catalogo.test.js`, humo HTTP |
| RF-67 – RF-71 | `context/SesionContext.jsx`, `services/sesion.js`, `services/autenticacion.js`, `components/RutaProtegida.jsx`, `pages/Ingresar.jsx` | `pages/__tests__/Sesion.test.jsx`, humo de navegador |
| RF-72 – RF-75 | `pages/Vendedor.jsx`, `services/operador.js` | Humo HTTP y de navegador |
| RN-01 – RN-05 | `lib/carrito.js`, `lib/cupones.js` | `lib/__tests__/carrito.test.js`, `lib/__tests__/cupones.test.js` |
| RN-06 – RN-11 | `lib/validaciones.js` | `lib/__tests__/validaciones.test.js` |
| RN-12 – RN-15 | `services/adaptadores.js`, `services/cliente.js` | `services/__tests__/adaptadores.test.js`, humo HTTP (401/403) |
| RNF-01, RNF-02, RNF-09 | `src/styles.css`, páginas y componentes con Bootstrap | Inspección en 375 px y 1280 px |
| RNF-06, RNF-11 | `karma.conf.cjs`, `components/EstadoCarga.jsx` | `npm test`, `npm run test:coverage`, humo de navegador |
| RNF-12 | `services/cliente.js`, `components/RutaProtegida.jsx` | Humo HTTP (401 sin token, 403 por rol) |

---

## Anexo A — Estructura del proyecto

```
GameHubStoreFullstack/            # frontend (React + Vite)
├── index.html               # Entrada de la SPA (Vite)
├── src/
│   ├── main.jsx             # Bootstrap, estilos, Router, SesionProvider y CarritoProvider
│   ├── App.jsx              # Definición de las rutas (con guardias por rol)
│   ├── pages/               # 9 vistas (Inicio, Catálogo, Detalle, Carrito,
│   │                        #   Checkout, Órdenes, Ingresar, Vendedor, Admin) + 404
│   ├── components/          # Layout, Cabecera, PieSitio, TarjetaProducto,
│   │                        #   RutaProtegida, EstadoCarga
│   ├── context/             # SesionContext y CarritoContext (useReducer + localStorage)
│   ├── services/            # Capa HTTP: cliente, adaptadores, módulos por recurso, caché
│   ├── lib/                 # Lógica de negocio pura + pruebas unitarias
│   ├── data/                # Semilla local (respaldo del carrito)
│   ├── hooks/               # useTitulo, useDatos
│   └── styles.css           # Tema de marca sobre Bootstrap
├── public/assets/           # Imágenes y video
├── scripts/                 # Humo HTTP y de navegador (EP3)
├── ERS.md                   # Este documento
├── COBERTURA.md             # Documento de cobertura de pruebas
└── README.md                # Descripción e instrucciones del proyecto

Duoc-Fullstack2-GameHubStore-BackEnd-main/   # backend (14 módulos Maven)
└── (auth, product, category, inventory, promotion, order, payment,
     shipping, review, user, warranty, api-gateway, eureka-server, comun)
```

## Anexo B — Trabajo futuro

| Elemento | Descripción |
| --- | --- |
| Cobertura de las vistas conectadas | Ampliar las pruebas de render de las páginas que hoy se verifican con humo (`Catálogo`, `Detalle`, `Órdenes`, `Vendedor`). |
| Renovación proactiva del token | Renovar el JWT antes de que venza en el frontend, sin esperar a un 401. |
| Despliegue del backend | Publicar los microservicios en la nube y apuntar `VITE_API_URL` al Gateway remoto. |
| Video de demostración | Publicar `gamehub-setup-demo.mp4` y sus subtítulos `.es.vtt`. |

## Anexo C — Fuera de alcance

Pasarela de pago real (el pago sigue siendo simulado), envío de correos
transaccionales, cálculo de costo de despacho por zona, búsqueda de texto libre,
despliegue del backend en la nube y auditoría de pedidos. La autenticación,
el control de acceso por rol y la persistencia del panel de administración, que
estaban fuera de alcance en la EP2, **ya están implementados** en la EP3.

## Anexo D — Historial de cambios

| Versión | Fecha | Cambio |
| --- | --- | --- |
| 1.0 | 2026-10-13 | Versión inicial para la Evaluación Parcial 2: requisitos de la aplicación React + Bootstrap, modelo de datos, reglas de negocio y matriz de trazabilidad. |
| 2.0 | 2026-10-19 | Se incorpora el panel de administración (`/admin`) con CRUD de productos y cupones (M9, RF-54 – RF-59); se actualizan rutas (8), módulos y las cifras de pruebas y cobertura (116 pruebas). |
| 3.0 | 2026-11-12 | **Evaluación Parcial 3 — integración con el backend.** El frontend deja de usar datos simulados y consume el API Gateway (`/api/v1`). Nuevos módulos M10 (integración, RF-60 – RF-66), M11 (autenticación y permisos, RF-67 – RF-71) y M12 (panel del vendedor, RF-72 – RF-75); nuevas reglas RN-12 – RN-15 y RNF-11 – RNF-12; rutas `/ingresar` y `/vendedor`, guardias por rol y sesión JWT persistente. Pruebas: 157/157, humo HTTP 21/21 y de navegador 14/14; cobertura 82,6 % sentencias. |
