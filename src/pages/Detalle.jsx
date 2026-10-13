import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTitulo } from "../hooks/useTitulo.js";
import { useCarrito } from "../context/CarritoContext.jsx";
import { PRODUCTOS } from "../data/productos.js";
import { formatearPesosCLP } from "../lib/formato.js";
import { precioFinalProducto } from "../lib/carrito.js";

// Reseñas simuladas de clientes (datos de demostración, igual que el legacy)
const RESENAS_SIMULADAS = [
  {
    autor: "Felipe R.",
    puntaje: 5,
    texto:
      "Excelente tiempo de respuesta, la batería dura varios días jugando intensamente.",
    fecha: "Compra verificada — 28 de Agosto, 2026",
  },
  {
    autor: "Martina S.",
    puntaje: 4,
    texto:
      "Muy cómodo para agarre fingertip, liviano y con buen software para configurar los DPI.",
    fecha: "Compra verificada — 15 de Agosto, 2026",
  },
];

/**
 * Ficha de producto: imagen, precios con descuento, stock, selector de
 * cantidad, especificaciones técnicas y reseñas. Migrado desde
 * legacy/detalle.html: el parámetro de URL ?id=X ahora llega por
 * useParams() con la ruta /detalle/:id.
 */
export default function Detalle() {
  const { id } = useParams();
  const producto = PRODUCTOS.find((p) => p.id === Number(id));

  useTitulo(
    producto
      ? `GameHub Store — ${producto.nombre}`
      : "Producto no encontrado — GameHub Store"
  );

  const { agregar } = useCarrito();
  const [cantidad, setCantidad] = useState(1);
  const [errorStock, setErrorStock] = useState("");

  // Al navegar a otro producto se reinician cantidad y error
  useEffect(() => {
    setCantidad(1);
    setErrorStock("");
  }, [id]);

  if (!producto) {
    return (
      <div className="seccion">
        <div className="contenedor">
          <h1>Producto no encontrado</h1>
          <div className="mensaje-alerta">
            <span className="mensaje-alerta__icono" aria-hidden="true">ℹ</span>
            El producto que buscas no existe o fue removido del catálogo.
          </div>
          <Link className="boton-primario" to="/catalogo">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

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
      <div className="contenedor">
        {/* Enlace miga de pan */}
        <nav aria-label="Ruta de navegación" style={{ marginBottom: "var(--espacio-md)" }}>
          <Link to="/catalogo" style={{ fontSize: "var(--tam-pequeno)" }}>
            ← Volver al catálogo
          </Link>
        </nav>

        <div
          className="grid-hero"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: "var(--espacio-xl)",
            alignItems: "start",
          }}
        >
          {/* Imagen principal / Galería */}
          <div>
            <img
              className="tarjeta-producto__imagen"
              src={producto.imagen}
              alt={`Fotografía de ${producto.nombre}`}
              style={{
                width: "100%",
                borderRadius: "var(--radio-lg)",
                border: "1px solid var(--color-borde)",
                aspectRatio: "4/3",
                objectFit: "cover",
              }}
            />
          </div>

          {/* Información comercial y acciones */}
          <div
            style={{
              backgroundColor: "var(--color-superficie)",
              border: "1px solid var(--color-borde)",
              borderRadius: "var(--radio-lg)",
              padding: "var(--espacio-lg)",
            }}
          >
            <p className="tarjeta-producto__categoria" style={{ marginBottom: "0.2rem" }}>
              {producto.categoria.toUpperCase()}
            </p>
            <h1 style={{ marginBottom: "var(--espacio-sm)" }}>{producto.nombre}</h1>
            <p
              style={{
                fontSize: "var(--tam-pequeno)",
                color: "var(--color-texto-tenue)",
                marginBottom: "var(--espacio-md)",
              }}
            >
              Marca: {producto.marca}
            </p>

            <div style={{ marginBottom: "var(--espacio-md)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--espacio-sm)" }}>
                <span className="tarjeta-producto__precio" style={{ fontSize: "1.8rem" }}>
                  {formatearPesosCLP(precioFinalProducto(producto))}
                </span>
                {producto.descuentoVigente.activo && (
                  <s style={{ color: "var(--color-texto-tenue)", fontSize: "1.1rem" }}>
                    {formatearPesosCLP(producto.precio)}
                  </s>
                )}
              </div>
              <p
                style={{
                  marginTop: "0.3rem",
                  fontSize: "var(--tam-pequeno)",
                  color: sinStock ? "var(--color-error)" : "var(--color-acento)",
                  fontWeight: 600,
                }}
              >
                {sinStock
                  ? "✕ Producto agotado (Sin stock)"
                  : `✓ Stock disponible: ${producto.stockDisponible} unidades`}
              </p>
            </div>

            <p style={{ marginBottom: "var(--espacio-md)" }}>
              {producto.descripcion || "Componente gamer de alta calidad con garantía oficial."}
            </p>

            {/* Control de compra y cantidad */}
            <form
              onSubmit={(e) => e.preventDefault()}
              style={{
                borderTop: "1px dashed var(--color-borde)",
                paddingTop: "var(--espacio-md)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--espacio-md)", marginBottom: "var(--espacio-md)" }}>
                <label htmlFor="detalle-cantidad" style={{ fontWeight: 600, fontSize: "var(--tam-pequeno)" }}>
                  Cantidad:
                </label>
                <input
                  type="number"
                  id="detalle-cantidad"
                  name="cantidad"
                  value={cantidad}
                  min="1"
                  max={producto.stockDisponible}
                  disabled={sinStock}
                  onChange={(e) => setCantidad(e.target.value)}
                  style={{ width: "4rem", textAlign: "center" }}
                />
              </div>

              {sinStock ? (
                <button
                  type="button"
                  className="boton-deshabilitado"
                  disabled
                  aria-disabled="true"
                  style={{ width: "100%" }}
                >
                  Agotado
                </button>
              ) : (
                <button
                  type="button"
                  className="boton-primario"
                  style={{ width: "100%" }}
                  onClick={manejarAgregar}
                >
                  Agregar al carrito
                </button>
              )}
              {errorStock && (
                <span className="texto-error" style={{ display: "flex", marginTop: "0.5rem" }} role="alert">
                  {errorStock}
                </span>
              )}
            </form>
          </div>
        </div>

        {/* Especificaciones técnicas */}
        <section style={{ marginTop: "var(--espacio-xl)" }} aria-labelledby="titulo-specs">
          <h2 id="titulo-specs">Especificaciones Técnicas</h2>
          <div
            style={{
              backgroundColor: "var(--color-superficie)",
              border: "1px solid var(--color-borde)",
              borderRadius: "var(--radio-lg)",
              padding: "var(--espacio-md)",
            }}
          >
            <table className="tabla-carrito">
              <tbody>
                {Object.entries(producto.especificaciones || {}).map(([clave, valor]) => (
                  <tr key={clave}>
                    <th scope="row" style={{ width: "35%", textTransform: "capitalize" }}>
                      {clave}
                    </th>
                    <td>{valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Reseñas y calificaciones */}
        <section style={{ marginTop: "var(--espacio-xl)" }} aria-labelledby="titulo-resenas">
          <div className="flex-entre" style={{ marginBottom: "var(--espacio-md)" }}>
            <h2 id="titulo-resenas" style={{ marginBottom: 0 }}>Reseñas de Clientes</h2>
            <span
              style={{
                background: "var(--color-superficie-alta)",
                padding: "0.3rem 0.8rem",
                borderRadius: "var(--radio-sm)",
                fontWeight: 700,
                color: "var(--color-acento)",
              }}
            >
              ★ 4.8 / 5.0 (Promedio)
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--espacio-sm)" }}>
            {RESENAS_SIMULADAS.map((resena) => (
              <article key={resena.autor} className="tarjeta-producto" style={{ padding: "var(--espacio-md)" }}>
                <div className="flex-entre" style={{ marginBottom: "0.3rem" }}>
                  <strong style={{ color: "var(--color-texto-alto)" }}>{resena.autor}</strong>
                  <span style={{ color: "var(--color-acento)" }}>
                    {"★".repeat(resena.puntaje)}
                    {"☆".repeat(5 - resena.puntaje)} ({resena.puntaje}/5)
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "var(--tam-pequeno)" }}>{resena.texto}</p>
                <small style={{ color: "var(--color-texto-tenue)" }}>{resena.fecha}</small>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}