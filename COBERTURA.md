# Documento de cobertura de pruebas — GameHub Store

**Asignatura:** Desarrollo FullStack II (DSY1104) · **Entrega:** Evaluación Parcial 2

Este documento describe cómo se mide la cobertura de la batería de pruebas del
proyecto React, resume los resultados obtenidos y deja explícito el alcance real
de esa medición (qué módulos sí se ejercitan y cuáles todavía no).

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
npm run test:coverage  # ejecuta las 81 pruebas y genera el reporte
```

El comando deja los artefactos en `coverage/`:

- `coverage/html/index.html` — reporte navegable con el detalle línea por línea.
- `coverage/lcov.info` — formato estándar consumible por otras herramientas.
- Resumen de cobertura impreso en la consola.

`npm test` sigue ejecutándose **sin** instrumentar (más rápido) porque la
instrumentación solo se activa cuando el reporter incluye `coverage`.

## 3. Resultados globales

Las 81 pruebas terminan en verde y la cobertura de los módulos ejercitados es:

| Métrica | Cobertura |
| --- | --- |
| Sentencias (Statements) | **97,39 %** (262/269) |
| Ramas (Branches) | **92,85 %** (117/126) |
| Funciones (Functions) | **98,68 %** (75/76) |
| Líneas (Lines) | **97,00 %** (227/234) |

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
| `pages/Carrito.jsx` | 100,0 % | 20/20 | 100,0 % | 13/13 | 100,0 % | 10/10 |
| `pages/Checkout.jsx` | 94,8 % | 55/58 | 90,0 % | 18/20 | 100,0 % | 15/15 |
| `data/productos.js` | 100,0 % | 1/1 | — | 0/0 | — | 0/0 |
| `data/cupones.js` | 100,0 % | 1/1 | — | 0/0 | — | 0/0 |

La lógica de negocio pura (`src/lib/`) y el estado global del carrito
(`CarritoContext`) son los módulos con mayor densidad de casos: son también los
que concentran reglas de precio, inventario, cupones y validaciones.

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
| `components/PaginaEnMigracion.jsx` | Marcador de páginas en migración. |
| `data/perfiles.js` | Perfiles de usuario (dato heredado, sin uso en la app React). |

En total, **12 de los 22 módulos** de `src/` quedan dentro del reporte y **10
quedan fuera**. Las cifras de la sección 3 describen únicamente a los 12
módulos ejercitados; la cobertura del proyecto completo es menor y por eso el
listado anterior debe leerse junto con esa tabla.

## 6. Interpretación y próximos pasos

- El núcleo de la lógica (carrito, cupones, validaciones, formato, contexto y las
  páginas `Carrito` y `Checkout`) está cubierto con margen: todas las métricas
  superan el 85 % en esos módulos.
- El trabajo pendiente para completar la cobertura es agregar pruebas de
  **renderizado (smoke tests)** para las 5 páginas y 3 componentes de estructura
  listados en la sección 5, de modo que dejen de quedar fuera del reporte.
- Los datos estáticos (`data/productos.js`, `data/cupones.js`) se incluyen porque
  son módulos de `src/`; su cobertura es del 100 % al importarse.

---

Generado con `npm run test:coverage`. Las cifras corresponden a la corrida de
**81 pruebas, 81 en verde**.
