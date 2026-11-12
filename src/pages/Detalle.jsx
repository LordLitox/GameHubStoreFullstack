import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTitulo } from "../hooks/useTitulo.js";
import { useDatos } from "../hooks/useDatos.js";
import { useCarrito } from "../context/CarritoContext.jsx";
import { Cargando, ErrorCarga } from "../components/EstadoCarga.jsx";
import { productos as servicioProductos, resenas as servicioResenas } from "../services/index.js";
import { formatearPesosCLP } from "../lib/formato.js";
import { precioFinalProducto } from "../lib/carrito.js";

/** Fecha ISO de una reseña en formato legible ("28 de agosto, 2026"). */
function formatearFecha(fechaISO) {
  if (!fechaISO) return "";
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return String(fechaISO);
  return fecha.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Ficha de producto: imagen, precios con descuento, stock, selector de
 * cantidad, especificaciones técnicas y reseñas. Migrado desde
 * legacy/detalle.html: el parámetro de URL ?id=X ahora llega por
 * useParams() con la ruta /detalle/:id.
 *
 * EP3 · Parte 6: el producto y sus reseñas se piden al backend. Las reseñas ya
 * no son de mentira: salen de review-service (solo las aprobadas) y el promedio
 * se calcula con las que devuelve el servidor.
 */
export default function Detalle() {
  const { id } = useParams();

  const { datos: producto, cargando, error, recargar } = useDatos(
    () => servicioProductos.detalle(id),
    [id]
  );

  useTitulo(
    producto ? `GameHub Store — ${producto.nombre}` : "GameHub Store — Producto",
    !cargando
  );

  const { datos: resenas } = useDatos(() => servicioResenas.deProducto(id), [id]);

  const { agregar } = useCarrito();
  const [cantidad, setCantidad] = useState(1);
  const [errorStock, setErrorStock] = useState("");

  // Al navegar a otro producto se reinician cantidad y error
  useEffect(() => {
    setCantidad(1);
    setErrorStock("");
  }, [id]);

  if (cargando) {
    return (
      <div className="seccion">
        <div className="container">
          <Cargando texto="Cargando producto…" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="seccion">
        <div className="container">
          <ErrorCarga mensaje={error} onReintentar={recargar} />
          <Link className="btn btn-primary" to="/catalogo">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="seccion">
        <div className="container">
          <h1>Producto no encontrado</h1>
          <div className="alert alert-info d-flex align-items-center gap-2">
            <span aria-hidden="true">ℹ</span>
            El producto que buscas no existe o fue removido del catálogo.
          </div>
          <Link className="btn btn-primary" to="/catalogo">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  // Promedio real: 0 cuando todavía no hay reseñas aprobadas.
  const listaResenas = resenas ?? [];
  const promedio =
    listaResenas.length > 0
      ? listaResenas.reduce((suma, r) => suma + r.puntaje, 0) / listaResenas.length
      : 0;

  const sinStock = producto.stockDisponible <= 0;

  function manejarAgregar() {
    const cant = Number(cantidad);
    if (Number.isNaN(cant) || cant < 1) {
      setErrorStock("La cantidad debe ser mayor a 0.");
      return;
    }
    if (cant > producto.stockDisponible) {
      setErrorStock(
        `No puedes agregar más del stock disponible (${producto.stockDisponible}).`
      );
      return;
    }
    setErrorStock("");
    const res = agregar(producto.id, cant);
    alert(res.mensaje);
  }

  return (
    <div className="seccion">
      <div className="container">
        {/* Enlace miga de pan */}
        <nav aria-label="Ruta de navegación" className="mb-3">
          <Link to="/catalogo" className="small">
            ← Volver al catálogo
          </Link>
        </nav>

        <div className="row g-4 g-lg-5 align-items-start">
          {/* Imagen principal / Galería */}
          <div className="col-12 col-lg-6">
            <img
              className="tarjeta-producto__imagen w-100 rounded-4 border"
              src={producto.imagen}
              alt={`Fotografía de ${producto.nombre}`}
            />
          </div>

          {/* Información comercial y acciones */}
          <div className="col-12 col-lg-6">
            <div className="card">
              <div className="card-body p-4">
                <p className="tarjeta-producto__categoria mb-1">
                  {producto.categoria.toUpperCase()}
                </p>
                <h1 className="mb-2">{producto.nombre}</h1>
                <p className="small text-body-secondary mb-3">Marca: {producto.marca}</p>

                <div className="mb-3">
                  <div className="d-flex align-items-baseline gap-2">
                    <span className="tarjeta-producto__precio fs-3">
                      {formatearPesosCLP(precioFinalProducto(producto))}
                    </span>
                    {producto.descuentoVigente.activo && (
                      <s className="text-body-secondary fs-5">
                        {formatearPesosCLP(producto.precio)}
                      </s>
                    )}
                  </div>
                  <p
                    className="mt-1 mb-0 small fw-semibold"
                    style={{ color: sinStock ? "var(--color-error)" : "var(--color-acento)" }}
                  >
                    {sinStock
                      ? "✕ Producto agotado (Sin stock)"
                      : `✓ Stock disponible: ${producto.stockDisponible} unidades`}
                  </p>
                </div>

                <p className="mb-3">
                  {producto.descripcion || "Componente gamer de alta calidad con garantía oficial."}
                </p>

                {/* Control de compra y cantidad */}
                <form onSubmit={(e) => e.preventDefault()} className="border-top border-dashed pt-3">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <label className="form-label fw-semibold small mb-0" htmlFor="detalle-cantidad">
                      Cantidad:
                    </label>
                    <input
                      className="form-control text-center"
                      type="number"
                      id="detalle-cantidad"
                      name="cantidad"
                      value={cantidad}
                      min="1"
                      max={producto.stockDisponible}
                      disabled={sinStock}
                      onChange={(e) => setCantidad(e.target.value)}
                      style={{ width: "5rem" }}
                    />
                  </div>

                  {sinStock ? (
                    <button
                      type="button"
                      className="btn btn-secondary w-100"
                      disabled
                      aria-disabled="true"
                    >
                      Agotado
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primary w-100" onClick={manejarAgregar}>
                      Agregar al carrito
                    </button>
                  )}
                  {errorStock && (
                    <span className="texto-error mt-2" role="alert">
                      {errorStock}
                    </span>
                  )}
                </form>

                {/* Componente JS de Bootstrap: modal con la ficha técnica ampliada */}
                <button
                  type="button"
                  className="btn btn-outline-primary w-100 mt-2"
                  data-bs-toggle="modal"
                  data-bs-target="#modalFichaTecnica"
                >
                  Ver ficha técnica ampliada
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Especificaciones técnicas */}
        <section className="mt-5" aria-labelledby="titulo-specs">
          <h2 id="titulo-specs">Especificaciones Técnicas</h2>
          <div className="card">
            <div className="card-body">
              <table className="table table-sm table-borderless align-middle mb-0">
                <tbody>
                  {Object.entries(producto.especificaciones || {}).map(([clave, valor]) => (
                    <tr key={clave}>
                      <th scope="row" className="text-capitalize" style={{ width: "35%" }}>
                        {clave}
                      </th>
                      <td>{valor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Reseñas y calificaciones */}
        <section className="mt-5" aria-labelledby="titulo-resenas">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <h2 id="titulo-resenas" className="mb-0">Reseñas de Clientes</h2>
            <span className="badge rounded-pill text-bg-secondary fs-6">
              {listaResenas.length > 0
                ? `★ ${promedio.toFixed(1)} / 5.0 (${listaResenas.length} ${
                    listaResenas.length === 1 ? "reseña" : "reseñas"
                  })`
                : "Sin reseñas todavía"}
            </span>
          </div>

          {listaResenas.length === 0 ? (
            <div className="alert alert-info" role="status">
              Este producto aún no tiene reseñas aprobadas. Las opiniones de los
              clientes aparecen aquí una vez que el equipo las revisa.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {listaResenas.map((resena) => (
                <article key={resena.id} className="tarjeta-producto card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong className="text-body-emphasis">{resena.autor}</strong>
                      <span style={{ color: "var(--color-acento)" }}>
                        {"★".repeat(resena.puntaje)}
                        {"☆".repeat(5 - resena.puntaje)} ({resena.puntaje}/5)
                      </span>
                    </div>
                    <p className="mb-0 small">{resena.texto}</p>
                    <small className="text-body-secondary">
                      {resena.fecha ? `Compra verificada — ${formatearFecha(resena.fecha)}` : ""}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Modal de Bootstrap con las especificaciones completas */}
        <div className="modal fade" id="modalFichaTecnica" tabIndex="-1" aria-labelledby="tituloModalFicha" aria-hidden="true">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title h5" id="tituloModalFicha">
                  Ficha técnica — {producto.nombre}
                </h2>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar" />
              </div>
              <div className="modal-body">
                <table className="table table-sm align-middle mb-0">
                  <tbody>
                    {Object.entries(producto.especificaciones || {}).map(([clave, valor]) => (
                      <tr key={clave}>
                        <th scope="row" className="text-capitalize" style={{ width: "35%" }}>
                          {clave}
                        </th>
                        <td>{valor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <p className="small text-body-secondary mb-0 me-auto">
                  Garantía oficial del fabricante y despacho a todo Chile.
                </p>
                <button type="button" className="btn btn-primary" data-bs-dismiss="modal">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}