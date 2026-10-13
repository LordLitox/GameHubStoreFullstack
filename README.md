# GameHub Store

Plataforma web de comercio electrónico orientada a la venta de hardware,
periféricos y accesorios gamer de alto rendimiento. Proyecto desarrollado para
la asignatura **Desarrollo FullStack II (DSY1104)**.

El proyecto simula un flujo completo de adquisición de productos tecnológicos
sin APIs externas ni bases de datos: navegación entre vistas, filtrado
interactivo, cálculo comercial del carrito, cupones de descuento y
persistencia vía `localStorage`.

## Estado actual: aplicación React (migración completada)

La versión vigente del sitio es la aplicación **React 18 + Vite 5**: las 6
vistas del sitio original ya están migradas, con diseño responsivo sobre
**Bootstrap 5.3** y 81 pruebas automatizadas en verde. El sitio HTML/CSS/JS
vanilla de la EP1 se conserva en **`legacy/`** solo como referencia y queda
pendiente de eliminar; el proceso seguido está documentado en
**[MIGRACION.md](MIGRACION.md)**.

### Documentación

| Documento | Contenido |
| --- | --- |
| **[ERS.md](ERS.md)** | Especificación de requisitos de software: funcionales, no funcionales, reglas de negocio y matriz de trazabilidad. |
| **[COBERTURA.md](COBERTURA.md)** | Cómo se mide la cobertura de las pruebas y los resultados obtenidos. |
| **[MIGRACION.md](MIGRACION.md)** | Guía histórica de la migración HTML→React. |

### Comandos

```bash
npm install            # instalar dependencias (primera vez)
npm run dev            # servidor de desarrollo en http://localhost:5173
npm test               # 81 pruebas de lógica, componentes y páginas (Karma + Jasmine)
npm run test:coverage  # pruebas + reporte de cobertura en coverage/
npm run build          # build de producción en dist/
```

El sitio legacy de la EP1 sigue accesible en
`http://localhost:5173/legacy/index.html` mientras no se elimine la carpeta.

### Estructura del repositorio

```
GameHubStoreFullstack/
├── index.html               # Entrada de la SPA (Vite)
├── src/                     # Aplicación React
│   ├── pages/               #   6 vistas (una por ruta) + 404
│   ├── components/          #   Layout, Cabecera, PieSitio, TarjetaProducto...
│   ├── context/             #   Estado global del carrito (useReducer + localStorage)
│   ├── lib/                 #   Lógica de negocio pura + pruebas unitarias
│   ├── __tests__/           #   Utilidades de prueba (render con providers, mocks)
│   ├── data/                #   PRODUCTOS, CUPONES, PERFILES_USUARIO
│   ├── hooks/               #   useTitulo
│   └── styles.css           #   Tema de marca sobre Bootstrap (paleta y componentes)
├── public/assets/           # Imágenes y video (ver LEEME.md dentro)
├── legacy/                  # Sitio vanilla de la EP1 (referencia, se elimina)
├── ERS.md                   # Especificación de requisitos de software
├── COBERTURA.md             # Documento de cobertura de la batería de pruebas
└── MIGRACION.md             # Guía paso a paso de la migración para el equipo
```

## Características principales

- **Estructura semántica y accesible (WCAG 2.1 AA):** marcado HTML5
  (`<main>`, `<article>`, `<section>`, `<nav>`, `<aside>`), contraste
  optimizado (mínimo 4.5:1), enlaces de salto y etiquetas accesibles.
- **Diseño responsivo con Bootstrap 5.3:** rejilla `container`/`row`/`col-*`
  por breakpoint, navbar colapsable, tarjetas, tablas, formularios, alertas y
  modal de ficha técnica, sobre un tema oscuro de marca que sobrescribe las
  variables `--bs-*` de Bootstrap.
- **Catálogo interactivo dinámico:** filtros por categoría, marca,
  ordenación y validación cruzada de rango de precios (mínimo ≤ máximo).
- **Gestión de carrito de compras:** control de inventario en tiempo real,
  bloqueo de productos agotados y persistencia entre páginas vía
  `localStorage` (claves `gh_carrito_v1` y `gh_cupon_activo_v1`).
- **Motor de cupones y totales:** descuentos por porcentaje con topes
  máximos en pesos, fechas de caducidad y totales nunca negativos, cubierto
  por 81 pruebas con Jasmine y Karma: lógica de negocio, componentes
  (`TarjetaProducto`, `Cabecera`), contexto del carrito y páginas
  (`Carrito`, `Checkout`) con mocks de `localStorage`, `alert` y `Math.random`.
- **Formularios con validación en tiempo real:** validación nativa en
  `blur`, `input` y `submit` en checkout y solicitud de garantías
  post-venta, con retroalimentación visual e iconográfica.

## Paleta de Diseño: Vitrina Oscura

La interfaz implementa un esquema de colores centralizado mediante variables
en el `:root` de `src/styles.css`:

| Variable CSS | Código HEX | Uso en la interfaz |
| --- | --- | --- |
| `--color-fondo` | `#171A21` | Fondo general del sitio web |
| `--color-superficie` | `#1B2838` | Fondo de tarjetas, tablas y bloques secundarios |
| `--color-primario` | `#66C0F4` | Botones de acción, enlaces y componentes activos |
| `--color-acento` | `#ACD550` | Precios en descuento, stock disponible y confirmaciones |
| `--color-texto` | `#C7D5E0` | Texto regular de lectura con ratio de contraste legible |
| `--color-error` | `#FF6B6B` | Mensajes de advertencia, errores de validación y stock agotado |
