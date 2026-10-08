import { Link } from "react-router-dom";
import { useTitulo } from "../hooks/useTitulo.js";
import TarjetaProducto from "../components/TarjetaProducto.jsx";
import { PRODUCTOS } from "../data/productos.js";

/**
 * Portada: hero con video, categorías, destacados de la semana y beneficios.
 * Migrada desde legacy/index.html reutilizando las mismas clases CSS.
 */
export default function Inicio() {
  useTitulo("GameHub Store — Tu tienda gamer de confianza");

  const destacados = PRODUCTOS.filter((p) => p.destacado);

  return (
    <>
      {/* ----- Hero con video de producto ----- */}
      <section className="seccion seccion-hero" aria-labelledby="titulo-hero">
        <div
          className="contenedor grid-hero"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: "var(--espacio-lg)",
            alignItems: "center",
          }}
        >
          <div>
            <h1 id="titulo-hero">Equípate como los pros. Juega sin límites.</h1>
            <p>
              En GameHub Store encuentras consolas, periféricos y accesorios gamer con despacho a
              todo Chile y garantía oficial. Explora el catálogo y arma tu setup ideal.
            </p>
            <div className="flex-entre" style={{ justifyContent: "flex-start", gap: "var(--espacio-sm)" }}>
              <Link className="boton-primario" to="/catalogo">
                Ver catálogo
              </Link>
              <a className="boton-secundario" href="#destacados">
                Ver destacados
              </a>
            </div>
          </div>

          <div>
            <h2 className="visualmente-oculto">Video de presentación de producto</h2>
            <video
              controls
              preload="metadata"
              poster="/assets/img/poster-setup-gamer.jpg"
              style={{
                width: "100%",
                borderRadius: "var(--radio-lg)",
                border: "1px solid var(--color-borde)",
              }}
              aria-label="Video demostrativo de un setup gamer con teclado, mouse y audífonos GameHub"
            >
              <source src="/assets/video/gamehub-setup-demo.mp4" type="video/mp4" />
              <track
                kind="captions"
                src="/assets/video/gamehub-setup-demo.es.vtt"
                srclang="es"
                label="Español"
              />
              Tu navegador no soporta la reproducción de video. Puedes{" "}
              <a href="/assets/video/gamehub-setup-demo.mp4">descargar el video de demostración aquí</a>.
            </video>
          </div>
        </div>
      </section>

      {/* ----- Categorías ----- */}
      <section className="seccion" aria-labelledby="titulo-categorias">
        <div className="contenedor">
          <h2 id="titulo-categorias">Compra por categoría</h2>
          <div className="grid-auto">
            <article className="tarjeta-producto">
              <img
                className="tarjeta-producto__imagen"
                src="/assets/img/categoria-consolas.jpg"
                alt="Consola de videojuegos de última generación junto a dos controles"
              />
              <div className="tarjeta-producto__cuerpo">
                <p className="tarjeta-producto__categoria">Categoría</p>
                <h3 className="tarjeta-producto__titulo">
                  <Link to="/catalogo">Consolas</Link>
                </h3>
                <p>Las últimas generaciones, con stock y despacho inmediato.</p>
              </div>
            </article>

            <article className="tarjeta-producto">
              <img
                className="tarjeta-producto__imagen"
                src="/assets/img/categoria-perifericos.jpg"
                alt="Teclado mecánico con retroiluminación RGB y mouse gamer"
              />
              <div className="tarjeta-producto__cuerpo">
                <p className="tarjeta-producto__categoria">Categoría</p>
                <h3 className="tarjeta-producto__titulo">
                  <Link to="/catalogo">Periféricos</Link>
                </h3>
                <p>Teclados, mouse y audífonos pensados para largas sesiones de juego.</p>
              </div>
            </article>

            <article className="tarjeta-producto">
              <img
                className="tarjeta-producto__imagen"
                src="/assets/img/categoria-sillas.jpg"
                alt="Silla ergonómica gamer con diseño deportivo"
              />
              <div className="tarjeta-producto__cuerpo">
                <p className="tarjeta-producto__categoria">Categoría</p>
                <h3 className="tarjeta-producto__titulo">
                  <Link to="/catalogo">Sillas y mobiliario</Link>
                </h3>
                <p>Comodidad y ergonomía certificada para tu espacio de juego.</p>
              </div>
            </article>

            <article className="tarjeta-producto">
              <img
                className="tarjeta-producto__imagen"
                src="/assets/img/categoria-accesorios.jpg"
                alt="Accesorios gamer variados sobre una mesa"
              />
              <div className="tarjeta-producto__cuerpo">
                <p className="tarjeta-producto__categoria">Categoría</p>
                <h3 className="tarjeta-producto__titulo">
                  <Link to="/catalogo">Accesorios</Link>
                </h3>
                <p>Todo lo que necesitas para completar tu experiencia gamer.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ----- Productos destacados ----- */}
      <section className="seccion" id="destacados" aria-labelledby="titulo-destacados">
        <div className="contenedor">
          <div className="flex-entre">
            <h2 id="titulo-destacados">Destacados de la semana</h2>
            <Link className="boton-secundario" to="/catalogo">
              Ver todos
            </Link>
          </div>

          <div className="grid-auto">
            {destacados.map((producto) => (
              <TarjetaProducto key={producto.id} producto={producto} />
            ))}
          </div>
        </div>
      </section>

      {/* ----- Confianza / beneficios ----- */}
      <section className="seccion" aria-labelledby="titulo-beneficios">
        <div className="contenedor">
          <h2 id="titulo-beneficios">Por qué comprar en GameHub Store</h2>
          <div className="grid-auto">
            <article className="tarjeta-producto">
              <div className="tarjeta-producto__cuerpo">
                <h3 className="tarjeta-producto__titulo">Despacho a todo Chile</h3>
                <p>Seguimiento de tu pedido desde la compra hasta la puerta de tu casa.</p>
              </div>
            </article>
            <article className="tarjeta-producto">
              <div className="tarjeta-producto__cuerpo">
                <h3 className="tarjeta-producto__titulo">Garantía oficial</h3>
                <p>Todos los productos cuentan con garantía del fabricante.</p>
              </div>
            </article>
            <article className="tarjeta-producto">
              <div className="tarjeta-producto__cuerpo">
                <h3 className="tarjeta-producto__titulo">Pago seguro</h3>
                <p>Múltiples medios de pago con checkout protegido.</p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
