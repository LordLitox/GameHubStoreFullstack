# GameHub Store

Plataforma web de comercio electrónico orientada a la venta de hardware,
periféricos y accesorios gamer de alto rendimiento. Proyecto desarrollado para
la asignatura **Desarrollo FullStack II (DSY1104)**.

El proyecto simula un flujo completo de adquisición de productos tecnológicos
sin APIs externas ni bases de datos: navegación entre vistas, filtrado
interactivo, cálculo comercial del carrito, cupones de descuento y
persistencia vía `localStorage`.

## Estado actual: migración a React en curso

El sitio original (HTML/CSS/JS vanilla) vive en **`legacy/`** y sigue
funcionando, mientras la nueva aplicación **React + Vite** se construye en la
raíz del repositorio, página por página. El detalle del proceso, el reparto de
tareas pendientes y las reglas de conversión HTML→JSX están en
**[MIGRACION.md](MIGRACION.md)**.

### Comandos

```bash
npm install     # instalar dependencias (primera vez)
npm run dev     # aplicación React en http://localhost:5173
npm test        # pruebas unitarias de la lógica de negocio (Vitest)
npm run build   # build de producción en dist/
```

El sitio legacy queda accesible durante el desarrollo en
`http://localhost:5173/legacy/index.html`.

### Estructura del repositorio

```
GameHubStoreFullstack/
├── index.html               # Entrada de la app React (Vite)
├── src/                     # Aplicación React
│   ├── pages/               #   6 vistas (una por ruta) + 404
│   ├── components/          #   Layout, Cabecera, PieSitio, TarjetaProducto...
│   ├── context/             #   Estado global del carrito (useReducer + localStorage)
│   ├── lib/                 #   Lógica de negocio pura + pruebas unitarias
│   ├── data/                #   PRODUCTOS, CUPONES, PERFILES_USUARIO
│   ├── hooks/               #   useTitulo
│   └── styles.css           #   Hoja de estilos del sitio original (reutilizada)
├── public/assets/           # Imágenes y video (ver LEEME.md dentro)
├── legacy/                  # Sitio vanilla original (EP1), se elimina al terminar
└── MIGRACION.md             # Guía paso a paso de la migración para el equipo
```

## Características principales

- **Estructura semántica y accesible (WCAG 2.1 AA):** marcado HTML5
  (`<main>`, `<article>`, `<section>`, `<nav>`, `<aside>`), contraste
  optimizado (mínimo 4.5:1), enlaces de salto y etiquetas accesibles.
- **Catálogo interactivo dinámico:** filtros por categoría, marca,
  ordenación y validación cruzada de rango de precios (mínimo ≤ máximo).
- **Gestión de carrito de compras:** control de inventario en tiempo real,
  bloqueo de productos agotados y persistencia entre páginas vía
  `localStorage` (claves compartidas entre la versión legacy y React).
- **Motor de cupones y totales:** descuentos por porcentaje con topes
  máximos en pesos, fechas de caducidad y totales nunca negativos, cubierto
  por 46 pruebas unitarias con Vitest.
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
