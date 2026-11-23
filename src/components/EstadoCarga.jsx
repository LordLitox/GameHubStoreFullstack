/**
 * Estados de carga y error para las vistas que piden datos al backend
 * (EP3 · Parte 6).
 *
 * Desde que el catálogo, la ficha y los paneles dependen de HTTP, toda vista
 * tiene tres momentos: cargando, falló y listo. Estos dos bloques evitan
 * repetir el mismo marcado en cada página y dejan el aviso accesible
 * (`role="status"` para "cargando", `role="alert"` para el error).
 */

/** Aviso de "cargando" con el estilo de las alertas del sitio. */
export function Cargando({ texto = "Cargando…" }) {
  return (
    <div className="alert alert-info d-flex align-items-center gap-2" role="status">
      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      {texto}
    </div>
  );
}

/**
 * Aviso de error con un botón para reintentar.
 * @param {object} props
 * @param {string} props.mensaje     Texto del fallo (ya presentable).
 * @param {() => void} [props.onReintentar]
 */
export function ErrorCarga({ mensaje, onReintentar }) {
  return (
    <div className="alert alert-danger" role="alert">
      <strong>No se pudieron cargar los datos.</strong>
      <p className="mb-0 mt-2">{mensaje}</p>
      {onReintentar && (
        <button type="button" className="btn btn-sm btn-outline-danger mt-2" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}
