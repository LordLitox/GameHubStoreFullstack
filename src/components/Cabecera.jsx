import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext.jsx";
import { useSesion } from "../context/SesionContext.jsx";

/**
 * Enlaces del menú con el rol mínimo que exige cada uno (EP3 · Parte 5).
 * `roles: null` = visible para todo el mundo.
 */
const ENLACES = [
  { to: "/", texto: "Inicio", fin: true, roles: null },
  { to: "/catalogo", texto: "Catálogo", roles: null },
  { to: "/carrito", texto: "Carrito", roles: null },
  { to: "/checkout", texto: "Checkout", roles: ["CLIENTE"] },
  { to: "/ordenes", texto: "Mis pedidos", roles: ["CLIENTE"] },
  { to: "/vendedor", texto: "Ventas", roles: ["OPERADOR", "ADMIN"] },
  { to: "/admin", texto: "Administración", roles: ["ADMIN"] },
];

/**
 * Cabecera del sitio: marca, menú principal (con versión móvil desplegable),
 * acceso al carrito con contador y bloque de sesión.
 *
 * Desde la EP3 el menú se filtra por rol: un cliente no ve "Administración" ni
 * "Ventas", y un vendedor no ve "Checkout". Ocultar el enlace no protege nada
 * por sí solo — de eso se encarga `RutaProtegida` y, sobre todo, el backend.
 */
export default function Cabecera() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { totalItems } = useCarrito();
  const { autenticado, usuario, rolVisible, salir } = useSesion();
  const navigate = useNavigate();

  const enlacesVisibles = ENLACES.filter(
    (enlace) => enlace.roles === null || enlace.roles.includes(usuario?.rol)
  );

  function manejarSalir() {
    salir();
    setMenuAbierto(false);
    navigate("/");
  }

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
            {enlacesVisibles.map(({ to, texto, fin }) => (
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

            {autenticado ? (
              <div className="sesion-cabecera">
                <span className="sesion-cabecera__usuario">
                  <span className="visualmente-oculto">Sesión iniciada como </span>
                  {usuario?.nombre}
                  <span className="sesion-cabecera__rol"> ({rolVisible})</span>
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={manejarSalir}
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <Link className="btn btn-sm btn-primary" to="/ingresar">
                Iniciar sesión
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
