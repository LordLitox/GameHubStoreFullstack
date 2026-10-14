import { Link } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext.jsx";
import { formatearPesosCLP } from "../lib/formato.js";
import { precioFinalProducto } from "../lib/carrito.js";

/**
 * Tarjeta de producto reutilizable (home, catálogo, destacados).
 * Equivalente a crearTarjetaProductoDOM de legacy/js/app.js, ahora
 * declarativa y sin manipulación manual del DOM.
 */
export default function TarjetaProducto({ producto }) {
  const { agregar } = useCarrito();
  const sinStock = producto.stockDisponible <= 0;

  function manejarAgregar() {
    const res = agregar(producto.id, 1);
    alert(res.mensaje);
  }

  return (
    <article className="tarjeta-producto card h-100">
      <img
        className="tarjeta-producto__imagen card-img-top"
        src={producto.imagen}
        alt={`Fotografía de ${producto.nombre}`}
        loading="lazy"
      />

      <div className="tarjeta-producto__cuerpo card-body d-flex flex-column gap-1">
        <p className="tarjeta-producto__categoria card-subtitle mb-1">
          {producto.categoria.charAt(0).toUpperCase() + producto.categoria.slice(1)}
        </p>

        <h3 className="tarjeta-producto__titulo card-title h6 mb-1">
          <Link to={`/detalle/${producto.id}`}>{producto.nombre}</Link>
        </h3>

        <p
          className="mb-0"
          style={{
            fontSize: "var(--tam-pequeno)",
            color: sinStock ? "var(--color-error)" : "var(--color-texto-tenue)",
          }}
        >
          {sinStock ? "Sin stock disponible" : `Stock: ${producto.stockDisponible} un.`}
        </p>

        <p className="tarjeta-producto__precio mt-auto mb-2">
          {producto.descuentoVigente.activo ? (
            <>
              {formatearPesosCLP(precioFinalProducto(producto))}{" "}
              <s style={{ fontSize: "var(--tam-pequeno)", color: "var(--color-texto-tenue)" }}>
                {formatearPesosCLP(producto.precio)}
              </s>
            </>
          ) : (
            formatearPesosCLP(producto.precio)
          )}
        </p>

        {sinStock ? (
          <button type="button" className="btn btn-secondary w-100" disabled aria-disabled="true">
            Agotado
          </button>
        ) : (
          <button type="button" className="btn btn-primary w-100" onClick={manejarAgregar}>
            Agregar al carrito
          </button>
        )}
      </div>
    </article>
  );
}
