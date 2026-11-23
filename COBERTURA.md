# Documento de cobertura de pruebas — GameHub Store

**Asignatura:** Desarrollo FullStack II (DSY1104) · **Entrega:** Evaluación Parcial 3

Este documento describe cómo se mide la cobertura de la batería de pruebas del
proyecto React, resume los resultados obtenidos y deja explícito el alcance real
de esa medición (qué módulos sí se ejercitan y cuáles todavía no).

> **Actualización EP3 (12 de noviembre de 2026).** Con la integración con el
> backend, el patrón de cobertura pasó a incluir `src/services/**`. La batería
> creció a **157 pruebas** (14 archivos, incluida `src/services/__tests__/`) y las
> cifras actuales son **82,57 % sentencias · 70,21 % ramas · 78,91 % funciones ·
> 84,06 % líneas**. Parte de las ramas de manejo de error (reintentos, 401/403) se
> ejercen en los scripts de humo `scripts/verificar-flujo-ep3.mjs` (21/21) y
> `scripts/verificar-navegador-ep3.mjs` (14/14). Las cifras por módulo de las
> secciones siguientes corresponden a la medición de la EP2 y se conservan como
> referencia histórica.

## 1. Herramientas

| Componente | Rol |
| --- | --- |
| **Karma** | Runner de pruebas en un navegador real (Chrome Headless). |
| **Jasmine** | Framework de aserciones (`describe` / `it` / `expect`). |
| **karma-vite** | Transforma el código ES/JSX de `src/` con Vite antes de ejecutarlo. |
| **karma-coverage** | Reportero de cobertura; genera HTML, resumen por consola y `lcov`. |
| **vite-plugin-istanbul** | Instrumenta el código fuente. `karma-vite` lo activa solo cuando el reporter incluye `coverage`. |

La configuración vive en [`karma.conf.cjs`](../karma.conf.cjs). La instrumentación
se limita a `src/**/*.{js,jsx}` y excluye los archivos de prueba, las utilidades de
prueba (`src/__tests__/**`) y el punto de entrada (`src/main.jsx`), que no
contienen lógica de negocio.

## 2. Cómo reproducir la medición

```bash
npm install            # solo la primera vez
npm run test:coverage  # ejecuta las 116 pruebas y genera el reporte
```

El comando deja los artefactos en `coverage/`:

- `coverage/html/index.html` — reporte navegable con el detalle línea por línea.
- `coverage/lcov.info` — formato estándar consumible por otras herramientas.
- Resumen de cobertura impreso en la consola.

`npm test` sigue ejecutándose **sin** instrumentar (más rápido) porque la
instrumentación solo se activa cuando el reporter incluye `coverage`.

## 3. Resultados globales

Las 116 pruebas terminan en verde y la cobertura de los módulos ejercitados es:

| Métrica | Cobertura |
| --- | --- |
| Sentencias (Statements) | **88,81 %** (413/465) |
| Ramas (Branches) | **85,71 %** (210/245) |
| Funciones (Functions) | **88,35 %** (129/146) |
| Líneas (Lines) | **89,47 %** (357/399) |

Estas cifras **incluyen por primera vez la página `Admin.jsx`**, que se sumó al
reporte al incorporarse sus pruebas del panel de administración. Como es una
vista grande con varios formularios, su cobertura parcial arrastra el promedio
hacia abajo: los módulos de lógica pura siguen cerca del 100 %.

## 4. Cobertura por archivo

| Archivo | % Líneas | Líneas | % Ramas | Ramas | % Funciones | Funciones |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `lib/cupones.js` | 100,0 % | 22/22 | 100,0 % | 20/20 | 100,0 % | 6/6 |
| `lib/validaciones.js` | 97,5 % | 39/40 | 89,3 % | 25/28 | 100,0 % | 7/7 |
| `lib/carrito.js` | 96,7 % | 29/30 | 89,5 % | 17/19 | 100,0 % | 12/12 |
| `lib/formato.js` | 100,0 % | 1/1 | — | 0/0 | 100,0 % | 1/1 |
| `context/CarritoContext.jsx` | 97,7 % | 42/43 | 85,7 % | 12/14 | 100,0 % | 14/14 |
| `hooks/useTitulo.js` | 100,0 % | 2/2 | — | 0/0 | 100,0 % | 2/2 |
| `components/TarjetaProducto.jsx` | 100,0 % | 7/7 | 100,0 % | 8/8 | 100,0 % | 3/3 |
| `components/Cabecera.jsx` | 88,9 % | 8/9 | 100,0 % | 4/4 | 83,3 % | 5/6 |
| `pages/Carrito.jsx` | 100,0 % | 20/20 | 100,0 % | 15/15 | 100,0 % | 10/10 |
| `pages/Checkout.jsx` | 94,8 % | 55/58 | 88,9 % | 16/18 | 100,0 % | 15/15 |
| `pages/Admin.jsx` | 64,8 % | 57/88 | 77,1 % | 37/48 | 64,4 % | 29/45 |
| `data/productos.js` | 94,6 % | 35/37 | 84,6 % | 33/39 | 100,0 % | 12/12 |
| `data/cupones.js` | 95,2 % | 40/42 | 71,9 % | 23/32 | 100,0 % | 13/13 |

La lógica de negocio pura (`src/lib/`) y el estado global del carrito
(`CarritoContext`) son los módulos con mayor densidad de casos: son también los
que concentran reglas de precio, inventario, cupones y validaciones. Los
módulos de datos (`data/productos.js` y `data/cupones.js`) exponen las
operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre la colección simulada
y cuentan con su propia batería de pruebas.

## 5. Alcance real de la medición

`vite-plugin-istanbul` **solo instrumenta los módulos que las pruebas cargan**.
Un archivo que ninguna prueba importa no aparece en el reporte (ni siquiera con
0 %). Por eso, además de las cifras anteriores, es importante dejar constancia
de los módulos que hoy **no tienen cobertura**:

| Módulo sin cobertura | Descripción |
| --- | --- |
| `App.jsx` | Enrutador principal (React Router). |
| `pages/Catalogo.jsx` | Catálogo con filtros por categoría, marca, orden y precio. |
| `pages/Detalle.jsx` | Vista de detalle de producto. |
| `pages/Inicio.jsx` | Página de inicio (video y destacados). |
| `pages/Ordenes.jsx` | Historial de órdenes generadas. |
| `pages/NoEncontrada.jsx` | Página 404. |
| `components/Layout.jsx` | Layout compartido (cabecera + contenido + pie). |
| `components/PieSitio.jsx` | Pie de página. |

En total, **13 de los 21 módulos** de `src/` quedan dentro del reporte y **8
quedan fuera**. Las cifras de la sección 3 describen únicamente a los 13
módulos ejercitados; la cobertura del proyecto completo es menor y por eso el
listado anterior debe leerse junto con esa tabla.

## 6. Interpretación y próximos pasos

- El núcleo de la lógica (carrito, cupones, validaciones, formato, contexto y las
  páginas `Carrito`, `Checkout` y `Admin`) está cubierto con margen razonable; las
  métricas de `src/lib/` y `CarritoContext` superan el 85 %.
- `Admin.jsx` es hoy el módulo con menor cobertura (64,8 % de líneas): sus pruebas
  ejercitan creación, edición, borrado y validación de productos y cupones, pero
  no todos los campos y ramas del formulario.
- El trabajo pendiente para completar la cobertura es agregar pruebas de
  **renderizado (smoke tests)** para las 5 páginas y 3 componentes de estructura
  listados en la sección 5, de modo que dejen de quedar fuera del reporte.
- Los datos estáticos (`data/productos.js`, `data/cupones.js`) se incluyen porque
  son módulos de `src/` y entran al reporte al importarse desde sus pruebas de CRUD.

---

Generado con `npm run test:coverage`. Las cifras corresponden a la corrida de
**116 pruebas, 116 en verde**.
