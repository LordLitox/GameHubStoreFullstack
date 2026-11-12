import { Link } from "react-router-dom";
import { useTitulo } from "../hooks/useTitulo.js";
import { useDatos } from "../hooks/useDatos.js";
import TarjetaProducto from "../components/TarjetaProducto.jsx";
import { Cargando, ErrorCarga } from "../components/EstadoCarga.jsx";
import { catalogo as servicioCatalogo } from "../services/index.js";

/**
 * Portada: hero con video, categorías, destacados de la semana y beneficios.
 * Migrada desde legacy/index.html reutilizando las mismas clases CSS.
 *
 * Desde la EP3 los destacados llegan del backend (catálogo + stock) a través de
 * la caché compartida, en vez de leerse de `src/data/productos.js`.
 */
export default function Inicio() {
  useTitulo("GameHub Store — Tu tienda gamer de confianza");

  const { datos: productos, cargando, error, recargar } = useDatos(
    () => servicioCatalogo.obtener(),
    []
  );
  const destacados = (productos ?? []).filter((p) => p.destacado);

  return (
    <>
      {/* ----- Hero con video de producto ----- */}
      <section className="seccion seccion-hero" aria-labelledby="titulo-hero">
        <div className="container">
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-12 col-lg-6">
              <h1 id="titulo-hero">Equípate como los pros. Juega sin límites.</h1>
              <p>
                En GameHub Store encuentras consolas, periféricos y accesorios gamer con despacho a
                todo Chile y garantía oficial. Explora el catálogo y arma tu setup ideal.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Link className="btn btn-primary" to="/catalogo">
                  Ver catálogo
                </Link>
                <a className="btn btn-outline-primary" href="#destacados">
                  Ver destacados
                </a>
              </div>
            </div>

            <div className="col-12 col-lg-6">
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
        </div>
      </section>

      {/* ----- Categorías ----- */}
      <section className="seccion pt-0" aria-labelledby="titulo-categorias">
        <div className="container">
          <h2 id="titulo-categorias">Compra por categoría</h2>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4">
            <div className="col">
              <article className="tarjeta-producto card h-100">
                <img
                  className="tarjeta-producto__imagen card-img-top"
                  src="/assets/img/categoria-consolas.jpg"
                  alt="Consola de videojuegos de última generación junto a dos controles"
                />
                <div className="tarjeta-producto__cuerpo card-body">
                  <p className="tarjeta-producto__categoria card-subtitle mb-1">Categoría</p>
                  <h3 className="tarjeta-producto__titulo card-title h6">
                    <Link to="/catalogo">Consolas</Link>
                  </h3>
                  <p className="mb-0">Las últimas generaciones, con stock y despacho inmediato.</p>
                </div>
              </article>
            </div>

            <div className="col">
              <article className="tarjeta-producto card h-100">
                <img
                  className="tarjeta-producto__imagen card-img-top"
                  src="/assets/img/categoria-perifericos.jpg"
                  alt="Teclado mecánico con retroiluminación RGB y mouse gamer"
                />
                <div className="tarjeta-producto__cuerpo card-body">
                  <p className="tarjeta-producto__categoria card-subtitle mb-1">Categoría</p>
                  <h3 className="tarjeta-producto__titulo card-title h6">
                    <Link to="/catalogo">Periféricos</Link>
                  </h3>
                  <p className="mb-0">Teclados, mouse y audífonos pensados para largas sesiones de juego.</p>
                </div>
              </article>
            </div>

            <div className="col">
              <article className="tarjeta-producto card h-100">
                <img
                  className="tarjeta-producto__imagen card-img-top"
                  src="/assets/img/categoria-sillas.jpg"
                  alt="Silla ergonómica gamer con diseño deportivo"
                />
                <div className="tarjeta-producto__cuerpo card-body">
                  <p className="tarjeta-producto__categoria card-subtitle mb-1">Categoría</p>
                  <h3 className="tarjeta-producto__titulo card-title h6">
                    <Link to="/catalogo">Sillas y mobiliario</Link>
                  </h3>
                  <p className="mb-0">Comodidad y ergonomía certificada para tu espacio de juego.</p>
                </div>
              </article>
            </div>

            <div className="col">
              <article className="tarjeta-producto card h-100">
                <img
                  className="tarjeta-producto__imagen card-img-top"
                  src="/assets/img/categoria-accesorios.jpg"
                  alt="Accesorios gamer variados sobre una mesa"
                />
                <div className="tarjeta-producto__cuerpo card-body">
                  <p className="tarjeta-producto__categoria card-subtitle mb-1">Categoría</p>
                  <h3 className="tarjeta-producto__titulo card-title h6">
                    <Link to="/catalogo">Accesorios</Link>
                  </h3>
                  <p className="mb-0">Todo lo que necesitas para completar tu experiencia gamer.</p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ----- Productos destacados ----- */}
      <section className="seccion pt-0" id="destacados" aria-labelledby="titulo-destacados">
        <div className="container">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <h2 id="titulo-destacados" className="mb-0">Destacados de la semana</h2>
            <Link className="btn btn-outline-primary" to="/catalogo">
              Ver todos
            </Link>
          </div>

          {cargando && <Cargando texto="Cargando destacados…" />}
          {error && <ErrorCarga mensaje={error} onReintentar={recargar} />}

          {!cargando && !error && (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4">
              {destacados.map((producto) => (
                <div className="col" key={producto.id}>
                  <TarjetaProducto producto={producto} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ----- Confianza / beneficios ----- */}
      <section className="seccion pt-0" aria-labelledby="titulo-beneficios">
        <div className="container">
          <h2 id="titulo-beneficios">Por qué comprar en GameHub Store</h2>
          <div className="row row-cols-1 row-cols-md-3 g-4">
            <div className="col">
              <article className="tarjeta-producto card h-100">
                <div className="tarjeta-producto__cuerpo card-body">
                  <h3 className="tarjeta-producto__titulo card-title h6">Despacho a todo Chile</h3>
                  <p className="mb-0">Seguimiento de tu pedido desde la compra hasta la puerta de tu casa.</p>
                </div>
              </article>
            </div>
            <div className="col">
              <article className="tarjeta-producto card h-100">
                <div className="tarjeta-producto__cuerpo card-body">
                  <h3 className="tarjeta-producto__titulo card-title h6">Garantía oficial</h3>
                  <p className="mb-0">Todos los productos cuentan con garantía del fabricante.</p>
                </div>
              </article>
            </div>
            <div className="col">
              <article className="tarjeta-producto card h-100">
                <div className="tarjeta-producto__cuerpo card-body">
                  <h3 className="tarjeta-producto__titulo card-title h6">Pago seguro</h3>
                  <p className="mb-0">Múltiples medios de pago con checkout protegido.</p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
