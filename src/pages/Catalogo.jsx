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

  function manejarAplicarCupon() {
    const res = aplicarCupon(codigo);
    setMensajeCupon({ tipo: res.exito ? "exito" : "error", texto: res.mensaje });
    if (res.exito) setCodigo("");
  }

  function manejarQuitarCupon() {
    quitarCupon();
    setMensajeCupon(null);
  }

  const carritoVacio = items.length === 0;

  return (
    <div className="seccion">
      <div className="contenedor">
        <h1>Tu Carrito de Compras</h1>
        <p>Revisa el resumen de tus componentes y periféricos antes de proceder al pago.</p>

        {/* Estado vacío explícito */}
        {carritoVacio && (
          <div className="mensaje-alerta" role="status">
            <span className="mensaje-alerta__icono" aria-hidden="true">🛒</span>
            <div>
              <strong>Tu carrito está actualmente vacío.</strong> No has añadido
              ningún producto gamer todavía.
              <p style={{ margin: "0.5rem 0 0 0" }}>
                <Link className="boton-primario" to="/catalogo">Explorar catálogo</Link>
              </p>
            </div>
          </div>
        )}

        {!carritoVacio && (
          <div
            className="grid-hero"
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: "var(--espacio-lg)",
              alignItems: "start",
            }}
          >
            {/* Tabla con el detalle por producto */}
            <section aria-labelledby="titulo-detalle-carrito">
              <h2 id="titulo-detalle-carrito" className="visualmente-oculto">
                Detalle de líneas del carrito
              </h2>

              <div
                style={{
                  overflowX: "auto",
                  backgroundColor: "var(--color-superficie)",
                  border: "1px solid var(--color-borde)",
                  borderRadius: "var(--radio-lg)",
                  padding: "var(--espacio-sm)",
                }}
              >
                <table className="tabla-carrito">
                  <caption>Lista de productos seleccionados</caption>
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
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--espacio-sm)" }}>
                            <img
                              src={item.imagen}
                              alt={`Fotografía de ${item.nombre}`}
                              width="56"
                              height="42"
                              style={{ borderRadius: "var(--radio-sm)", objectFit: "cover" }}
                            />
                            <div>
                              <strong style={{ color: "var(--color-texto-alto)" }}>{item.nombre}</strong>
                              <p style={{ margin: 0, fontSize: "var(--tam-pequeno)", color: "var(--color-texto-tenue)" }}>
                                {item.marca}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>{formatearPesosCLP(item.precio)}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <button
                              type="button"
                              className="boton-secundario"
                              style={{ padding: "0.15rem 0.55rem" }}
                              aria-label={`Restar una unidad de ${item.nombre}`}
                              onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                            >
                              −
                            </button>
                            <span aria-live="polite">{item.cantidad}</span>
                            <button
                              type="button"
                              className="boton-secundario"
                              style={{ padding: "0.15rem 0.55rem" }}
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
                            className="boton-secundario"
                            style={{ color: "var(--color-error)", borderColor: "var(--color-error)" }}
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

              <div
                style={{
                  marginTop: "var(--espacio-md)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "var(--espacio-sm)",
                }}
              >
                <button
                  type="button"
                  className="boton-secundario"
                  style={{ color: "var(--color-error)", borderColor: "var(--color-error)" }}
                  onClick={() => {
                    vaciar();
                    setMensajeCupon(null);
                  }}
                >
                  Vaciar carrito
                </button>
                <Link className="boton-secundario" to="/catalogo">Seguir comprando</Link>
              </div>
            </section>

            {/* Panel lateral: Cupones y Totales */}
            <aside className="resumen-pedido" aria-labelledby="titulo-resumen-carrito">
              <h2 id="titulo-resumen-carrito">Resumen de Compra</h2>

              {/* Bloque de Cupón de descuento */}
              <div
                style={{
                  marginBottom: "var(--espacio-md)",
                  borderBottom: "1px dashed var(--color-borde)",
                  paddingBottom: "var(--espacio-md)",
                }}
              >
                <label
                  htmlFor="codigo-cupon"
                  style={{ display: "block", fontWeight: 600, fontSize: "var(--tam-pequeno)", marginBottom: "0.35rem" }}
                >
                  Cupón de descuento:
                </label>
                <div style={{ display: "flex", gap: "var(--espacio-xs)" }}>
                  <input
                    type="text"
                    id="codigo-cupon"
                    placeholder="Ej. GAMEHUB20"
                    style={{ flex: 1, textTransform: "uppercase" }}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    aria-describedby="mensaje-cupon"
                  />
                  <button type="button" className="boton-secundario" onClick={manejarAplicarCupon}>
                    Aplicar
                  </button>
                </div>

                {/* Mensajes dinámicos de cupón (éxito o error con icono) */}
                {mensajeCupon && (
                  <span
                    id="mensaje-cupon"
                    className="texto-error"
                    style={{ display: "flex", marginTop: "0.4rem" }}
                    role="alert"
                  >
                    {mensajeCupon.tipo === "exito" ? "✓ " : "⚠ "}
                    {mensajeCupon.texto}
                  </span>
                )}

                {cupon && (
                  <div
                    style={{
                      display: "flex",
                      marginTop: "0.5rem",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "var(--tam-pequeno)",
                      background: "rgba(172, 213, 80, 0.15)",
                      border: "1px solid var(--color-acento)",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "var(--radio-sm)",
                    }}
                  >
                    <span style={{ color: "var(--color-acento)", fontWeight: 600 }}>
                      {cupon.codigo} ({cupon.porcentaje}% dscto activo)
                    </span>
                    <button
                      type="button"
                      onClick={manejarQuitarCupon}
                      style={{ background: "none", border: "none", color: "var(--color-error)", cursor: "pointer", fontWeight: 700 }}
                      aria-label="Quitar cupón aplicado"
                    >
                      ✕
                    </button>
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

              <Link
                to="/checkout"
                className="boton-primario"
                style={{ display: "flex", width: "100%", marginTop: "var(--espacio-md)" }}
              >
                Continuar al Checkout
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
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

  function manejarAplicarCupon() {
    const res = aplicarCupon(codigo);
    setMensajeCupon({ tipo: res.exito ? "exito" : "error", texto: res.mensaje });
    if (res.exito) setCodigo("");
  }

  function manejarQuitarCupon() {
    quitarCupon();
    setMensajeCupon(null);
  }

  const carritoVacio = items.length === 0;

  return (
    <div className="seccion">
      <div className="contenedor">
        <h1>Tu Carrito de Compras</h1>
        <p>Revisa el resumen de tus componentes y periféricos antes de proceder al pago.</p>

        {/* Estado vacío explícito */}
        {carritoVacio && (
          <div className="mensaje-alerta" role="status">
            <span className="mensaje-alerta__icono" aria-hidden="true">🛒</span>
            <div>
              <strong>Tu carrito está actualmente vacío.</strong> No has añadido
              ningún producto gamer todavía.
              <p style={{ margin: "0.5rem 0 0 0" }}>
                <Link className="boton-primario" to="/catalogo">Explorar catálogo</Link>
              </p>
            </div>
          </div>
        )}

        {!carritoVacio && (
          <div
            className="grid-hero"
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: "var(--espacio-lg)",
              alignItems: "start",
            }}
          >
            {/* Tabla con el detalle por producto */}
            <section aria-labelledby="titulo-detalle-carrito">
              <h2 id="titulo-detalle-carrito" className="visualmente-oculto">
                Detalle de líneas del carrito
              </h2>

              <div
                style={{
                  overflowX: "auto",
                  backgroundColor: "var(--color-superficie)",
                  border: "1px solid var(--color-borde)",
                  borderRadius: "var(--radio-lg)",
                  padding: "var(--espacio-sm)",
                }}
              >
                <table className="tabla-carrito">
                  <caption>Lista de productos seleccionados</caption>
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
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--espacio-sm)" }}>
                            <img
                              src={item.imagen}
                              alt={`Fotografía de ${item.nombre}`}
                              width="56"
                              height="42"
                              style={{ borderRadius: "var(--radio-sm)", objectFit: "cover" }}
                            />
                            <div>
                              <strong style={{ color: "var(--color-texto-alto)" }}>{item.nombre}</strong>
                              <p style={{ margin: 0, fontSize: "var(--tam-pequeno)", color: "var(--color-texto-tenue)" }}>
                                {item.marca}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>{formatearPesosCLP(item.precio)}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <button
                              type="button"
                              className="boton-secundario"
                              style={{ padding: "0.15rem 0.55rem" }}
                              aria-label={`Restar una unidad de ${item.nombre}`}
                              onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                            >
                              −
                            </button>
                            <span aria-live="polite">{item.cantidad}</span>
                            <button
                              type="button"
                              className="boton-secundario"
                              style={{ padding: "0.15rem 0.55rem" }}
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
                            className="boton-secundario"
                            style={{ color: "var(--color-error)", borderColor: "var(--color-error)" }}
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

              <div
                style={{
                  marginTop: "var(--espacio-md)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "var(--espacio-sm)",
                }}
              >
                <button
                  type="button"
                  className="boton-secundario"
                  style={{ color: "var(--color-error)", borderColor: "var(--color-error)" }}
                  onClick={() => {
                    vaciar();
                    setMensajeCupon(null);
                  }}
                >
                  Vaciar carrito
                </button>
                <Link className="boton-secundario" to="/catalogo">Seguir comprando</Link>
              </div>
            </section>

            {/* Panel lateral: Cupones y Totales */}
            <aside className="resumen-pedido" aria-labelledby="titulo-resumen-carrito">
              <h2 id="titulo-resumen-carrito">Resumen de Compra</h2>

              {/* Bloque de Cupón de descuento */}
              <div
                style={{
                  marginBottom: "var(--espacio-md)",
                  borderBottom: "1px dashed var(--color-borde)",
                  paddingBottom: "var(--espacio-md)",
                }}
              >
                <label
                  htmlFor="codigo-cupon"
                  style={{ display: "block", fontWeight: 600, fontSize: "var(--tam-pequeno)", marginBottom: "0.35rem" }}
                >
                  Cupón de descuento:
                </label>
                <div style={{ display: "flex", gap: "var(--espacio-xs)" }}>
                  <input
                    type="text"
                    id="codigo-cupon"
                    placeholder="Ej. GAMEHUB20"
                    style={{ flex: 1, textTransform: "uppercase" }}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    aria-describedby="mensaje-cupon"
                  />
                  <button type="button" className="boton-secundario" onClick={manejarAplicarCupon}>
                    Aplicar
                  </button>
                </div>

                {/* Mensajes dinámicos de cupón (éxito o error con icono) */}
                {mensajeCupon && (
                  <span
                    id="mensaje-cupon"
                    className="texto-error"
                    style={{ display: "flex", marginTop: "0.4rem" }}
                    role="alert"
                  >
                    {mensajeCupon.tipo === "exito" ? "✓ " : "⚠ "}
                    {mensajeCupon.texto}
                  </span>
                )}

                {cupon && (
                  <div
                    style={{
                      display: "flex",
                      marginTop: "0.5rem",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "var(--tam-pequeno)",
                      background: "rgba(172, 213, 80, 0.15)",
                      border: "1px solid var(--color-acento)",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "var(--radio-sm)",
                    }}
                  >
                    <span style={{ color: "var(--color-acento)", fontWeight: 600 }}>
                      {cupon.codigo} ({cupon.porcentaje}% dscto activo)
                    </span>
                    <button
                      type="button"
                      onClick={manejarQuitarCupon}
                      style={{ background: "none", border: "none", color: "var(--color-error)", cursor: "pointer", fontWeight: 700 }}
                      aria-label="Quitar cupón aplicado"
                    >
                      ✕
                    </button>
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

              <Link
                to="/checkout"
                className="boton-primario"
                style={{ display: "flex", width: "100%", marginTop: "var(--espacio-md)" }}
              >
                Continuar al Checkout
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}