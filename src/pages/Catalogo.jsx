import { useMemo, useState } from "react";
import { useTitulo } from "../hooks/useTitulo.js";
import TarjetaProducto from "../components/TarjetaProducto.jsx";
import { PRODUCTOS } from "../data/productos.js";

const OPCIONES_CATEGORIA = [
  { valor: "todas", texto: "Todas las categorías" },
  { valor: "consolas", texto: "Consolas y Notebooks" },
  { valor: "perifericos", texto: "Periféricos" },
  { valor: "sillas", texto: "Sillas y Mobiliario" },
  { valor: "accesorios", texto: "Hardware y Accesorios" },
];

const OPCIONES_MARCA = [
  { valor: "todas", texto: "Todas las marcas" },
  { valor: "asus", texto: "Asus" },
  { valor: "lenovo", texto: "Lenovo" },
  { valor: "msi", texto: "MSI" },
  { valor: "logitech", texto: "Logitech" },
  { valor: "hyperx", texto: "HyperX" },
  { valor: "redragon", texto: "Redragon" },
  { valor: "cougar", texto: "Cougar" },
  { valor: "samsung", texto: "Samsung" },
];

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
 */
export default function Catalogo() {
  useTitulo("Catálogo — GameHub Store");

  const [categoria, setCategoria] = useState("todas");
  const [marca, setMarca] = useState("todas");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [orden, setOrden] = useState("defecto");

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

    let resultado = PRODUCTOS.filter(
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
  }, [categoria, marca, precioMin, precioMax, orden, errorRangoPrecio]);

  return (
    <div className="seccion">
      <div className="contenedor">
        <h1>Catálogo de Productos Gamer</h1>
        <p>
          Filtra por categoría, marca o rango de presupuesto para encontrar el
          componente ideal para tu setup.
        </p>

        <div
          className="grid-hero"
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            gap: "var(--espacio-lg)",
            alignItems: "start",
          }}
        >
          {/* Barra lateral de Filtros y Ordenamiento */}
          <aside
            style={{
              backgroundColor: "var(--color-superficie)",
              border: "1px solid var(--color-borde)",
              borderRadius: "var(--radio-lg)",
              padding: "var(--espacio-md)",
            }}
            aria-labelledby="titulo-filtros"
          >
            <h2 id="titulo-filtros" style={{ fontSize: "1.2rem", marginBottom: "var(--espacio-sm)" }}>
              Filtros de Búsqueda
            </h2>

            <form onSubmit={(e) => e.preventDefault()}>
              {/* Categoría */}
              <div className="campo-formulario">
                <label htmlFor="filtro-categoria">Categoría</label>
                <select
                  id="filtro-categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  {OPCIONES_CATEGORIA.map((op) => (
                    <option key={op.valor} value={op.valor}>{op.texto}</option>
                  ))}
                </select>
              </div>

              {/* Marca */}
              <div className="campo-formulario">
                <label htmlFor="filtro-marca">Marca</label>
                <select
                  id="filtro-marca"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                >
                  {OPCIONES_MARCA.map((op) => (
                    <option key={op.valor} value={op.valor}>{op.texto}</option>
                  ))}
                </select>
              </div>

              {/* Rango de Precios */}
              <fieldset
                style={{
                  border: "1px solid var(--color-borde)",
                  borderRadius: "var(--radio-sm)",
                  padding: "var(--espacio-sm)",
                  marginBottom: "var(--espacio-md)",
                }}
              >
                <legend
                  style={{
                    color: "var(--color-texto-alto)",
                    fontSize: "var(--tam-pequeno)",
                    fontWeight: 600,
                    padding: "0 var(--espacio-xs)",
                  }}
                >
                  Rango de Precio ($ CLP)
                </legend>

                <div className="campo-formulario" style={{ marginBottom: "var(--espacio-xs)" }}>
                  <label htmlFor="filtro-precio-min">Mínimo</label>
                  <input
                    type="number"
                    id="filtro-precio-min"
                    placeholder="0"
                    min="0"
                    step="5000"
                    value={precioMin}
                    onChange={(e) => setPrecioMin(e.target.value)}
                  />
                </div>

                <div className="campo-formulario" style={{ marginBottom: 0 }}>
                  <label htmlFor="filtro-precio-max">Máximo</label>
                  <input
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
                  <span className="texto-error" style={{ display: "flex", marginTop: "0.5rem" }} role="alert">
                    {errorRangoPrecio}
                  </span>
                )}
              </fieldset>

              {/* Ordenamiento */}
              <div className="campo-formulario">
                <label htmlFor="filtro-orden">Ordenar por</label>
                <select
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
          </aside>

          {/* Grilla de resultados */}
          <section aria-labelledby="titulo-resultados">
            <h2 id="titulo-resultados" className="visualmente-oculto">
              Lista de productos disponibles
            </h2>
            <div className="grid-auto">
              {productosFiltrados.length === 0 ? (
                <div className="mensaje-alerta">
                  <span className="mensaje-alerta__icono" aria-hidden="true">ℹ</span>
                  No se encontraron productos que coincidan con los filtros seleccionados.
                </div>
              ) : (
                productosFiltrados.map((producto) => (
                  <TarjetaProducto key={producto.id} producto={producto} />
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}