/**
 * Marcador temporal para páginas aún no migradas a React.
 * Mientras exista, el usuario puede seguir usando la versión legacy
 * de la misma página (carpeta /legacy) sin perder funcionalidad.
 */
export default function PaginaEnMigracion({ titulo, archivoLegacy }) {
  return (
    <section className="seccion" aria-labelledby="titulo-migracion">
      <div className="contenedor">
        <h1 id="titulo-migracion">{titulo}</h1>
        <div className="mensaje-alerta">
          <span className="mensaje-alerta__icono" aria-hidden="true">⚙</span>
          <p>
            Esta página está siendo migrada de HTML/JS vanilla a React y aún
            no está disponible en la nueva versión.
          </p>
        </div>
        <p>
          Mientras tanto, puedes continuar usando la versión original del sitio:
        </p>
        <a className="boton-primario" href={`/legacy/${archivoLegacy}`}>
          Ir a la versión legacy de {titulo}
        </a>
      </div>
    </section>
  );
}
