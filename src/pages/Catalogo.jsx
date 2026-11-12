import { useMemo, useState } from "react";
import { useTitulo } from "../hooks/useTitulo.js";
import { useDatos } from "../hooks/useDatos.js";
import TarjetaProducto from "../components/TarjetaProducto.jsx";
import { Cargando, ErrorCarga } from "../components/EstadoCarga.jsx";
import {
  catalogo as servicioCatalogo,
  categorias as servicioCategorias,
} from "../services/index.js";

const OPCIONES_ORDEN = [
  { valor: "defecto", texto: "Destacados / Defecto" },
  { valor: "precio-asc", texto: "Precio: Menor a Mayor" },
  { valor: "precio-desc", texto: "Precio: Mayor a Menor" },
  { valor: "nombre-asc", texto: "Nombre: A a la Z" },
];

/**
 * Catálogo con filtros y ordenamiento dinámico.
 * Migrado desde legacy/catalogo.html + inicializarFiltrosCatalogo() de
 * legacy/js/app.js: los controles del formulario ahora son estado de React
 * y la lista filtrada se calcula con useMemo en cada cambio.
 *
 * EP3 · Parte 6: los productos y las categorías llegan del backend. El filtrado
 * y el ordenamiento siguen siendo locales sobre la lista ya cargada, porque el
 * catálogo es pequeño y así la respuesta al mover un control es instantánea.
 */
export default function Catalogo() {
  useTitulo("Catálogo — GameHub Store");

  const [categoria, setCategoria] = useState("todas");
  const [marca, setMarca] = useState("todas");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [orden, setOrden] = useState("defecto");

  const {
    datos: productos,
    cargando,
    error,
    recargar,
  } = useDatos(() => servicioCatalogo.obtener(), []);

  // Las categorías vienen del backend; si falla, se cae a las que aparezcan
  // en los productos cargados para no dejar el filtro vacío.
  const { datos: categoriasBackend } = useDatos(() => servicioCategorias.listar(), []);
  const opcionesCategoria = useMemo(() => {
    const base =
      categoriasBackend && categoriasBackend.length > 0
        ? categoriasBackend.map((c) => ({ valor: c.slug, texto: c.nombre }))
        : [...new Set((productos ?? []).map((p) => p.categoria))].map((slug) => ({
            valor: slug,
            texto: slug,
          }));
    return [{ valor: "todas", texto: "Todas las categorías" }, ...base];
  }, [categoriasBackend, productos]);

  // Las marcas se derivan de los productos cargados (no hay endpoint de marcas).
  const opcionesMarca = useMemo(() => {
    const marcas = [...new Set((productos ?? []).map((p) => p.marca).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b)
    );
    return [
      { valor: "todas", texto: "Todas las marcas" },
      ...marcas.map((m) => ({ valor: m.toLowerCase(), texto: m })),
    ];
  }, [productos]);

  // Validación cruzada obligatoria: el mínimo no puede superar el máximo
  const errorRangoPrecio = useMemo(() => {
    const min = precioMin === "" ? 0 : Number(precioMin);
    const max = precioMax === "" ? Infinity : Number(precioMax);
    return min > max
      ? "El precio mínimo no puede ser mayor que el precio máximo."
      : "";
  }, [precioMin, precioMax]);

  const productosFiltrados = useMemo(() => {
    if (errorRangoPrecio) return [];

    const min = precioMin === "" ? 0 : Number(precioMin);
    const max = precioMax === "" ? Infinity : Number(precioMax);

    let resultado = (productos ?? []).filter(
      (p) => p.precio >= min && p.precio <= max
    );

    if (categoria !== "todas") {
      resultado = resultado.filter((p) => p.categoria === categoria);
    }

    if (marca !== "todas") {
      resultado = resultado.filter(
        (p) => p.marca.toLowerCase() === marca.toLowerCase()
      );
    }

    if (orden === "precio-asc") resultado.sort((a, b) => a.precio - b.precio);
    if (orden === "precio-desc") resultado.sort((a, b) => b.precio - a.precio);
    if (orden === "nombre-asc")
      resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));

    return resultado;
  }, [productos, categoria, marca, precioMin, precioMax, orden, errorRangoPrecio]);

  return (
    <div className="seccion">
      <div className="container">
        <h1>Catálogo de Productos Gamer</h1>
        <p>
          Filtra por categoría, marca o rango de presupuesto para encontrar el
          componente ideal para tu setup.
        </p>

        <div className="row g-4 g-lg-5 align-items-start">
          {/* Barra lateral de Filtros y Ordenamiento */}
          <aside className="col-12 col-lg-4 col-xl-3" aria-labelledby="titulo-filtros">
            <div className="card">
              <div className="card-body">
                <h2 id="titulo-filtros" className="h5 mb-3">
                  Filtros de Búsqueda
                </h2>

                <form onSubmit={(e) => e.preventDefault()}>
                  {/* Categoría */}
                  <div className="mb-3">
                    <label className="form-label" htmlFor="filtro-categoria">Categoría</label>
                    <select
                      className="form-select"
                      id="filtro-categoria"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                    >
                      {opcionesCategoria.map((op) => (
                        <option key={op.valor} value={op.valor}>{op.texto}</option>
                      ))}
                    </select>
                  </div>

                  {/* Marca */}
                  <div className="mb-3">
                    <label className="form-label" htmlFor="filtro-marca">Marca</label>
                    <select
                      className="form-select"
                      id="filtro-marca"
                      value={marca}
                      onChange={(e) => setMarca(e.target.value)}
                    >
                      {opcionesMarca.map((op) => (
                        <option key={op.valor} value={op.valor}>{op.texto}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rango de Precios */}
                  <fieldset className="border rounded-3 p-3 mb-3">
                    <legend className="float-none w-auto px-1 fs-6 text-body-emphasis fw-semibold">
                      Rango de Precio ($ CLP)
                    </legend>

                    <div className="mb-2">
                      <label className="form-label" htmlFor="filtro-precio-min">Mínimo</label>
                      <input
                        className="form-control"
                        type="number"
                        id="filtro-precio-min"
                        placeholder="0"
                        min="0"
                        step="5000"
                        value={precioMin}
                        onChange={(e) => setPrecioMin(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label" htmlFor="filtro-precio-max">Máximo</label>
                      <input
                        className="form-control"
                        type="number"
                        id="filtro-precio-max"
                        placeholder="2000000"
                        min="0"
                        step="5000"
                        value={precioMax}
                        onChange={(e) => setPrecioMax(e.target.value)}
                      />
                    </div>

                    {/* Mensaje de error si min > max (evaluación obligatoria EP1) */}
                    {errorRangoPrecio && (
                      <span className="texto-error mt-2" role="alert">
                        {errorRangoPrecio}
                      </span>
                    )}
                  </fieldset>

                  {/* Ordenamiento */}
                  <div className="mb-0">
                    <label className="form-label" htmlFor="filtro-orden">Ordenar por</label>
                    <select
                      className="form-select"
                      id="filtro-orden"
                      value={orden}
                      onChange={(e) => setOrden(e.target.value)}
                    >
                      {OPCIONES_ORDEN.map((op) => (
                        <option key={op.valor} value={op.valor}>{op.texto}</option>
                      ))}
                    </select>
                  </div>
                </form>
              </div>
            </div>
          </aside>

          {/* Grilla de resultados */}
          <section className="col-12 col-lg-8 col-xl-9" aria-labelledby="titulo-resultados">
            <h2 id="titulo-resultados" className="visualmente-oculto">
              Lista de productos disponibles
            </h2>

            {cargando && <Cargando texto="Cargando catálogo…" />}
            {error && <ErrorCarga mensaje={error} onReintentar={recargar} />}

            <div className="row row-cols-1 row-cols-sm-2 row-cols-xxl-3 g-4">
              {!cargando && !error && productosFiltrados.length === 0 ? (
                <div className="col-12">
                  <div className="alert alert-info d-flex align-items-center gap-2" role="status">
                    <span aria-hidden="true">ℹ</span>
                    No se encontraron productos que coincidan con los filtros seleccionados.
                  </div>
                </div>
              ) : (
                productosFiltrados.map((producto) => (
                  <div className="col" key={producto.id}>
                    <TarjetaProducto producto={producto} />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}