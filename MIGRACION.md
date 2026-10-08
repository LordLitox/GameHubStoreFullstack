# Guía de migración a React — GameHub Store

Este documento explica cómo estamos migrando el sitio de HTML/CSS/JS vanilla
(carpeta `legacy/`) a una aplicación React, **página por página y en ramas
`feature/` separadas**, para que el avance quede reflejado en el historial
de commits del repositorio.

## Estado del plan

| Fase | Estado | Detalle |
| --- | --- | --- |
| 0. Sitio vanilla movido a `legacy/` | ✅ Listo | El sitio original sigue funcionando en `/legacy/*.html` |
| 1. Scaffold Vite + React + Router | ✅ Listo | 6 rutas + 404, layout compartido, CSS original reutilizado |
| 2. Lógica extraída a módulos puros | ✅ Listo | `src/lib/` + `src/data/`, 46 tests con Vitest |
| 3. Migración de páginas | 🔄 En curso | **Inicio ya está migrada** (sirve de patrón). Quedan 5 |
| 4. Limpieza final | ⏳ Pendiente | Borrar `legacy/` cuando las 6 páginas estén migradas |

## Cómo trabajar

```bash
npm install        # solo la primera vez
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm test           # pruebas unitarias (Vitest)
npm run build      # build de producción
```

Flujo de ramas (igual que acordamos como equipo):

```bash
git checkout desarrollo
git pull origin desarrollo
git checkout -b feature/migrar-catalogo     # una rama POR página/cambio
# ... trabajar, hacer commits pequeños ...
git push -u origin feature/migrar-catalogo
# abrir Pull Request a "desarrollo" y pedir revisión a un compañero
```

**Regla de oro:** nunca borrar `legacy/<pagina>.html` hasta que su versión
React esté migrada, verificada y fusionada. Así el sitio queda 100% usable
durante toda la migración.

## Estructura del proyecto React

```
src/
├── main.jsx                  # Punto de entrada (Router + CarritoProvider + CSS)
├── App.jsx                   # Definición de las 6 rutas + 404
├── styles.css                # CSS del sitio original (reutilizado tal cual)
├── data/                     # Datos simulados (PRODUCTOS, CUPONES, PERFILES)
├── lib/                      # Lógica de negocio PURA (sin DOM ni React)
│   ├── carrito.js            #   stock, agregar/quitar, cantidades
│   ├── cupones.js            #   vigencia, topes, totales
│   ├── validaciones.js       #   reglas de formularios (checkout/garantía)
│   ├── formato.js            #   formatearPesosCLP
│   └── __tests__/            #   pruebas Vitest (46 tests)
├── context/
│   └── CarritoContext.jsx    # Estado global del carrito + localStorage
├── hooks/
│   └── useTitulo.js          # Sincroniza el <title> por página
├── components/               # Componentes reutilizables
│   ├── Layout.jsx            #   cabecera + <Outlet> + pie
│   ├── Cabecera.jsx          #   menú, marca, contador de carrito
│   ├── PieSitio.jsx
│   ├── TarjetaProducto.jsx   #   PATRÓN DE REFERENCIA para migrar
│   └── PaginaEnMigracion.jsx #   placeholder mientras una página no está lista
└── pages/                    # Una página por ruta
```

## Cómo migrar una página (paso a paso)

La página **Inicio** (`src/pages/Inicio.jsx`) ya está migrada: úsenla como
referencia. El proceso para cada página es:

1. **Leer el HTML legacy** de la página (`legacy/<pagina>.html`) e identificar
   su sección `<main>` y su script (inline o en `legacy/js/`).
2. **Reemplazar el placeholder** en `src/pages/<Pagina>.jsx` por el marcado
   real, aplicando las reglas de conversión (tabla de abajo).
3. **Convertir la lógica**: cada `document.getElementById` + `addEventListener`
   se vuelve estado con `useState` y eventos JSX (`onChange`, `onBlur`,
   `onSubmit`). Las funciones de negocio NO se reescriben: se importan de
   `src/lib/`. El carrito SIEMPRE se maneja con `useCarrito()`.
4. **Verificar en el navegador** contra la versión legacy (comparar lado a
   lado: `/carrito` React vs `/legacy/carrito.html`).
5. **Commits pequeños** durante el proceso y PR a `desarrollo`.
6. **Commit final de cierre:** `chore: eliminar legacy/<pagina>.html` una vez
   aprobado el PR (y quitar el enlace del placeholder si quedara).

### Reglas de conversión HTML → JSX

| HTML | React/JSX |
| --- | --- |
| `class="..."` | `className="..."` |
| `for="id-campo"` | `htmlFor="id-campo"` |
| `style="color: red; font-size: 2rem"` | `style={{ color: "red", fontSize: "2rem" }}` |
| `<a href="carrito.html">` | `<Link to="/carrito">` (importar de react-router-dom) |
| `detalle.html?id=5` | `/detalle/5` (ruta con parámetro, se lee con `useParams()`) |
| `<script>` inline | Lógica en el componente con `useState` / `useEffect` |
| `onclick="..."` | `onClick={...}` |
| Leer/escribir localStorage directo | Usar `useCarrito()` (ya persiste solo) |

Las clases CSS se mantienen **idénticas**: el `styles.css` original ya está
global en la app, no hay que escribir estilos nuevos.

## Reparto de páginas pendientes (Fase 3)

| Integrante | Página | Rama sugerida | Dificultad | Notas |
| --- | --- | --- | --- | --- |
| A | `Catalogo.jsx` | `feature/migrar-catalogo` | Media | Filtros con `useState` + `useMemo` (ver `inicializarFiltrosCatalogo` en `legacy/js/app.js`). Reutiliza `TarjetaProducto`. |
| B | `Detalle.jsx` | `feature/migrar-detalle` | Media | Lee `?id=X` del legacy → ahora `useParams()`. Incluye selector de cantidad, reseñas y ficha técnica (`especificaciones`). |
| A | `Carrito.jsx` | `feature/migrar-carrito` | Media-alta | Tabla + botones cantidad (`cambiarCantidad`) + cupones (`aplicarCupon`) + totales (`totales`). OJO: en el legacy `renderizarVistaCarrito` nunca existió (quedó incompleto); acá se construye completa. |
| B | `Checkout.jsx` | `feature/migrar-checkout` | Media-alta | Formulario con validación en tiempo real usando `src/lib/validaciones.js`. Resumen con `totales` y `items`. Al confirmar: `vaciar()` + navegar a `/ordenes`. |
| C | `Ordenes.jsx` | `feature/migrar-ordenes` | Media | Historial simulado + formulario de garantía (`validarFechaGarantia`, `validarDetalleGarantia`). |
| C | Assets multimedia | `feature/agregar-assets-multimedia` | Baja | Ver `public/assets/LEEME.md`: faltan las 9 imágenes, el video y los subtítulos. |

El orden recomendado respeta las dependencias: primero Catálogo y Detalle
(usan `TarjetaProducto`), luego Carrito y Checkout (comparten totales), y
Órdenes al final. Assets se puede hacer en paralelo en cualquier momento.

## Convención de commits

```
feat:     nueva funcionalidad (página migrada, componente nuevo)
fix:      corrección de un bug
refactor: cambio interno sin alterar comportamiento
test:     agregar o modificar pruebas
docs:     documentación (README, MIGRACION.md, ERS)
chore:    tareas de mantenimiento (mover archivos, configuración)
```

Ejemplos: `feat: migrar catalogo con filtros a React`,
`fix: corregir validacion de rango de precios`,
`chore: eliminar legacy/catalogo.html`.

## Criterio de "página migrada" (definition of done)

- [ ] Paridad visual con la versión legacy (mismas clases CSS)
- [ ] Toda su lógica usa funciones de `src/lib/` (nada de lógica duplicada)
- [ ] El carrito/cupones se manejan solo vía `useCarrito()`
- [ ] Funciona la navegación hacia y desde otras páginas
- [ ] `npm test` sigue en verde
- [ ] PR revisado por un compañero y fusionado a `desarrollo`
- [ ] `legacy/<pagina>.html` eliminado en un commit aparte
