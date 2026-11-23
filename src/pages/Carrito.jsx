import { useState } from "react";
import { Link } from "react-router-dom";
import { useTitulo } from "../hooks/useTitulo.js";
import { useCarrito } from "../context/CarritoContext.jsx";
import { formatearPesosCLP } from "../lib/formato.js";

/**
 * Carrito de compras: tabla de líneas, control de cantidades, cupones y
 * totales. Migrado desde legacy/carrito.html (que quedó inconcluso: llamaba
 * a renderizarVistaCarrito(), función que nunca existió). Esta versión
 * completa la funcionalidad consumiendo el CarritoContext.
 */
export default function Carrito() {
  useTitulo("Carrito de compras — GameHub Store");

  const {
    items,
    cupon,
    totales,
    cambiarCantidad,
    quitar,
    vaciar,
    aplicarCupon,
    quitarCupon,
  } = useCarrito();

  const [codigo, setCodigo] = useState("");
  const [mensajeCupon, setMensajeCupon] = useState(null); // { tipo: "error" | "exito", texto }
  const [validandoCupon, setValidandoCupon] = useState(false);

  // El cupón se valida contra promotion-service (EP3 · Parte 6): la operación es
  // asíncrona y puede fallar por red, así que se muestra un estado "Validando…".
  async function manejarAplicarCupon() {
    setValidandoCupon(true);
    try {
      const res = await aplicarCupon(codigo);
      setMensajeCupon({ tipo: res.exito ? "exito" : "error", texto: res.mensaje });
      if (res.exito) setCodigo("");
    } catch (error) {
      setMensajeCupon({
        tipo: "error",
        texto: "No se pudo validar el cupón. Revisa tu conexión e inténtalo otra vez.",
      });
    } finally {
      setValidandoCupon(false);
    }
  }

  function manejarQuitarCupon() {
    quitarCupon();
    setMensajeCupon(null);
  }

  const carritoVacio = items.length === 0;

  return (
    <div className="seccion">
      <div className="container">
        <h1>Tu Carrito de Compras</h1>
        <p>Revisa el resumen de tus componentes y periféricos antes de proceder al pago.</p>

        {/* Estado vacío explícito */}
        {carritoVacio && (
          <div className="alert alert-info" role="status">
            <span aria-hidden="true">🛒</span>{" "}
            <strong>Tu carrito está actualmente vacío.</strong> No has añadido
            ningún producto gamer todavía.
            <p className="mt-2 mb-0">
              <Link className="btn btn-primary" to="/catalogo">Explorar catálogo</Link>
            </p>
          </div>
        )}

        {!carritoVacio && (
          <div className="row g-4 align-items-start">
            {/* Tabla con el detalle por producto */}
            <section className="col-12 col-lg-8" aria-labelledby="titulo-detalle-carrito">
              <h2 id="titulo-detalle-carrito" className="visualmente-oculto">
                Detalle de líneas del carrito
              </h2>

              <div className="card">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <caption className="px-3 pt-3">Lista de productos seleccionados</caption>
                    <thead>
                      <tr>
                        <th scope="col">Producto</th>
                        <th scope="col">Precio</th>
                        <th scope="col">Cantidad</th>
                        <th scope="col">Subtotal</th>
                        <th scope="col">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <img
                                src={item.imagen}
                                alt={`Fotografía de ${item.nombre}`}
                                width="56"
                                height="42"
                                className="rounded"
                                style={{ objectFit: "cover" }}
                              />
                              <div>
                                <strong className="text-body-emphasis">{item.nombre}</strong>
                                <p className="mb-0 small text-body-secondary">{item.marca}</p>
                              </div>
                            </div>
                          </td>
                          <td>{formatearPesosCLP(item.precio)}</td>
                          <td>
                            <div className="input-group input-group-sm" style={{ width: "8rem" }}>
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                aria-label={`Restar una unidad de ${item.nombre}`}
                                onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                              >
                                −
                              </button>
                              <span className="input-group-text justify-content-center" aria-live="polite">
                                {item.cantidad}
                              </span>
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                aria-label={`Sumar una unidad de ${item.nombre}`}
                                onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td>{formatearPesosCLP(item.precio * item.cantidad)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => quitar(item.id)}
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => {
                    vaciar();
                    setMensajeCupon(null);
                  }}
                >
                  Vaciar carrito
                </button>
                <Link className="btn btn-outline-primary" to="/catalogo">Seguir comprando</Link>
              </div>
            </section>

            {/* Panel lateral: Cupones y Totales */}
            <aside className="col-12 col-lg-4 resumen-pedido" aria-labelledby="titulo-resumen-carrito">
              <h2 id="titulo-resumen-carrito" className="h5">Resumen de Compra</h2>

              {/* Bloque de Cupón de descuento */}
              <div className="border-bottom border-dashed pb-3 mb-3">
                <label
                  className="form-label fw-semibold small"
                  htmlFor="codigo-cupon"
                >
                  Cupón de descuento:
                </label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control text-uppercase"
                    id="codigo-cupon"
                    placeholder="Ej. GAMEHUB20"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    aria-describedby="mensaje-cupon"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={manejarAplicarCupon}
                    disabled={validandoCupon}
                  >
                    {validandoCupon ? "Validando…" : "Aplicar"}
                  </button>
                </div>

                {/* Mensajes dinámicos de cupón (éxito o error con icono) */}
                {mensajeCupon && (
                  <div
                    id="mensaje-cupon"
                    className={`alert py-2 mt-2 mb-0 ${mensajeCupon.tipo === "exito" ? "alert-success" : "alert-danger"}`}
                    role="alert"
                  >
                    {mensajeCupon.tipo === "exito" ? "✓ " : "⚠ "}
                    {mensajeCupon.texto}
                  </div>
                )}

                {cupon && (
                  <div className="d-flex justify-content-between align-items-center mt-2 px-2 py-1 rounded small border border-success bg-success bg-opacity-10">
                    <span className="fw-semibold" style={{ color: "var(--color-acento)" }}>
                      {cupon.codigo} ({cupon.porcentaje}% dscto activo)
                    </span>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={manejarQuitarCupon}
                      aria-label="Quitar cupón aplicado"
                    />
                  </div>
                )}
              </div>

              {/* Filas de totales calculados */}
              <div className="resumen-pedido__fila">
                <span>Subtotal:</span>
                <span>{formatearPesosCLP(totales.subtotal)}</span>
              </div>

              <div className="resumen-pedido__fila">
                <span>Descuento aplicado:</span>
                <span style={{ color: "var(--color-acento)" }}>
                  -{formatearPesosCLP(totales.descuento)}
                </span>
              </div>

              <div className="resumen-pedido__fila resumen-pedido__fila--total">
                <span>Total a Pagar:</span>
                <span>{formatearPesosCLP(totales.total)}</span>
              </div>

              <Link to="/checkout" className="btn btn-primary w-100 mt-3">
                Continuar al Checkout
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
