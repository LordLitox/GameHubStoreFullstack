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
    <article className="tarjeta-producto">
      <img
        className="tarjeta-producto__imagen"
        src={producto.imagen}
        alt={`Fotografía de ${producto.nombre}`}
        loading="lazy"
      />

      <div className="tarjeta-producto__cuerpo">
        <p className="tarjeta-producto__categoria">
          {producto.categoria.charAt(0).toUpperCase() + producto.categoria.slice(1)}
        </p>

        <h3 className="tarjeta-producto__titulo">
          <Link to={`/detalle/${producto.id}`}>{producto.nombre}</Link>
        </h3>

        <p
          style={{
            fontSize: "var(--tam-pequeno)",
            color: sinStock ? "var(--color-error)" : "var(--color-texto-tenue)",
          }}
        >
          {sinStock ? "Sin stock disponible" : `Stock: ${producto.stockDisponible} un.`}
        </p>

        <p className="tarjeta-producto__precio">
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
          <button type="button" className="boton-deshabilitado" disabled aria-disabled="true">
            Agotado
          </button>
        ) : (
          <button type="button" className="boton-primario" onClick={manejarAgregar}>
            Agregar al carrito
          </button>
        )}
      </div>
    </article>
  );
}
