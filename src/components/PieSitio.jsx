import { Link } from "react-router-dom";

/**
 * Pie de página informativo compartido por todas las vistas.
 * Equivalente al <footer> duplicado en cada HTML del sitio legacy.
 */
export default function PieSitio() {
  return (
    <footer className="pie-sitio">
      <div className="contenedor">
        <div>
          <h2>GameHub Store</h2>
          <p>Tu tienda gamer de confianza. DSY1104 — Proyecto FullStack II.</p>
        </div>

        <nav aria-label="Enlaces de navegación del pie de página">
          <h2>Navegación</h2>
          <ul className="pie-sitio__enlaces">
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/catalogo">Catálogo</Link></li>
            <li><Link to="/carrito">Carrito</Link></li>
            <li><Link to="/checkout">Checkout</Link></li>
            <li><Link to="/ordenes">Mis pedidos</Link></li>
          </ul>
        </nav>

        <div>
          <h2>Contacto</h2>
          <ul className="pie-sitio__enlaces">
            <li><a href="mailto:contacto@gamehubstore.cl">contacto@gamehubstore.cl</a></li>
            <li><a href="tel:+56220000000">+56 2 2000 0000</a></li>
          </ul>
        </div>

        <p className="pie-sitio__copyright">© 2026 GameHub Store. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
