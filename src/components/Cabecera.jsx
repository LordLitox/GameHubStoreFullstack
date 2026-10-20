import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext.jsx";

const ENLACES = [
  { to: "/", texto: "Inicio", fin: true },
  { to: "/catalogo", texto: "Catálogo" },
  { to: "/carrito", texto: "Carrito" },
  { to: "/checkout", texto: "Checkout" },
  { to: "/ordenes", texto: "Mis pedidos" },
  { to: "/admin", texto: "Administración" },
];

/**
 * Cabecera del sitio: marca, menú principal (con versión móvil desplegable),
 * y acceso al carrito con contador de unidades.
 * Reemplaza al header duplicado en los 6 HTML del sitio legacy.
 */
export default function Cabecera() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { totalItems } = useCarrito();

  return (
    <header className="cabecera-sitio navbar navbar-expand-lg sticky-top">
      <div className="container">
        <Link className="marca navbar-brand" to="/">
          Game<span className="marca__acento">Hub</span> Store
        </Link>

        {/* Toggler de Bootstrap: en ≥lg se oculta y el menú queda siempre visible.
            El estado lo maneja React (fallback accesible bajo el breakpoint lg). */}
        <button
          type="button"
          className="boton-menu navbar-toggler"
          aria-expanded={menuAbierto}
          aria-controls="navPrincipal"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          <span className="navbar-toggler-icon" aria-hidden="true" />
          <span>Menú</span>
        </button>

        <nav
          className={`nav-principal navbar-collapse collapse${menuAbierto ? " show esta-abierto" : ""}`}
          id="navPrincipal"
          aria-label="Navegación principal"
        >
          <ul className="nav-principal__lista navbar-nav me-auto mb-2 mb-lg-0">
            {ENLACES.map(({ to, texto, fin }) => (
              <li className="nav-item" key={to}>
                {/* NavLink marca automáticamente aria-current="page" en la ruta activa */}
                <NavLink
                  className="nav-principal__enlace nav-link"
                  to={to}
                  end={fin}
                  onClick={() => setMenuAbierto(false)}
                >
                  {texto}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="acciones-cabecera">
            <Link
              className="icono-carrito"
              to="/carrito"
              aria-label={`Ver carrito de compras, ${totalItems} ${
                totalItems === 1 ? "producto" : "productos"
              }`}
            >
              <span aria-hidden="true">🛒</span>
              <span>Carrito</span>
              <span className="icono-carrito__contador" aria-hidden="true">
                {totalItems}
              </span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
