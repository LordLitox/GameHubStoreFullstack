import { Outlet } from "react-router-dom";
import Cabecera from "./Cabecera.jsx";
import PieSitio from "./PieSitio.jsx";

/**
 * Estructura común de todas las vistas: enlace de salto (accesibilidad),
 * cabecera, contenido (<Outlet> renderiza la ruta activa) y pie de página.
 */
export default function Layout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <a className="saltar-enlace" href="#contenido-principal">
        Saltar al contenido principal
      </a>

      <Cabecera />

      <main id="contenido-principal" className="flex-grow-1">
        <Outlet />
      </main>

      <PieSitio />
    </div>
  );
}
