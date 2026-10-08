import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext.jsx";

const ENLACES = [
  { to: "/", texto: "Inicio", fin: true },
  { to: "/catalogo", texto: "Catálogo" },
  { to: "/carrito", texto: "Carrito" },
  { to: "/checkout", texto: "Checkout" },
  { to: "/ordenes", texto: "Mis pedidos" },
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
    <header className="cabecera-sitio">
      <div className="contenedor">
        <Link className="marca" to="/">
          Game<span className="marca__acento">Hub</span> Store
        </Link>

        <button
          type="button"
          className="boton-menu"
          aria-expanded={menuAbierto}
          aria-controls="navPrincipal"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          <span aria-hidden="true">☰</span>
          <span>Menú</span>
        </button>

        <nav
          className={`nav-principal${menuAbierto ? " esta-abierto" : ""}`}
          id="navPrincipal"
          aria-label="Navegación principal"
        >
          <ul className="nav-principal__lista">
            {ENLACES.map(({ to, texto, fin }) => (
              <li key={to}>
                {/* NavLink marca automáticamente aria-current="page" en la ruta activa */}
                <NavLink
                  className="nav-principal__enlace"
                  to={to}
                  end={fin}
                  onClick={() => setMenuAbierto(false)}
                >
                  {texto}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

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
      </div>
    </header>
  );
}
