import { useState } from "react";
import { Link } from "react-router-dom";
import { useTitulo } from "../hooks/useTitulo.js";
import { useDatos } from "../hooks/useDatos.js";
import { Cargando, ErrorCarga } from "../components/EstadoCarga.jsx";
import { ordenes as servicioOrdenes } from "../services/index.js";
import { formatearPesosCLP } from "../lib/formato.js";
import {
  validarFechaGarantia,
  validarSelect,
  validarDetalleGarantia,
} from "../lib/validaciones.js";

/** Fecha ISO en formato legible ("15 de agosto, 2026"). */
function formatearFecha(fechaISO) {
  if (!fechaISO) return "—";
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return String(fechaISO);
  return fecha.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
}

/** Badge del estado de la orden según lo que devuelve order-service. */
function estiloEstado(estado) {
  const mapa = {
    ENTREGADA: "text-bg-success",
    EN_TRANSITO: "text-bg-primary",
    DESPACHADA: "text-bg-primary",
    PAGADA: "text-bg-info",
    PENDIENTE_PAGO: "text-bg-warning",
    CANCELADA: "text-bg-danger",
  };
  return mapa[estado] ?? "text-bg-secondary";
}

/**
 * Historial de pedidos y formulario de garantía post-venta. Migrado desde
 * legacy/ordenes.html + legacy/js/validaciones.js (sección 2): las reglas
 * de la garantía (máximo 180 días, sin fechas futuras, detalle de 20+
 * caracteres) vienen de src/lib/validaciones.js.
 *
 * EP3 · Parte 6: las compras ya no son de mentira — se listan las órdenes
 * reales del cliente autenticado (`GET /ordenes/mias`, rol CLIENTE).
 */
export default function Ordenes() {
  useTitulo("Mis pedidos — GameHub Store");

  const { datos: ordenes, cargando, error, recargar } = useDatos(
    () => servicioOrdenes.mias(),
    []
  );

  const [garantia, setGarantia] = useState({ fecha: "", motivo: "", detalle: "" });
  const [errores, setErrores] = useState({});

  function manejarCambio(nombreCampo, valor) {
    setGarantia((previo) => ({ ...previo, [nombreCampo]: valor }));
    if (errores[nombreCampo]?.valido === false) {
      setErrores((previo) => ({ ...previo, [nombreCampo]: validarCampo(nombreCampo, valor) }));
    }
  }

  function validarCampo(nombreCampo, valor) {
    switch (nombreCampo) {
      case "fecha":
        return validarFechaGarantia(valor);
      case "motivo":
        return validarSelect(valor, "motivo del reclamo");
      case "detalle":
        return validarDetalleGarantia(valor);
      default:
        return { valido: true, mensaje: "" };
    }
  }

  function manejarBlur(nombreCampo) {
    const res = validarCampo(nombreCampo, garantia[nombreCampo]);
    setErrores((previo) => ({ ...previo, [nombreCampo]: res }));
  }

  function manejarSubmit(evento) {
    evento.preventDefault();

    const resFecha = validarFechaGarantia(garantia.fecha);
    const resMotivo = validarSelect(garantia.motivo, "motivo del reclamo");
    const resDetalle = validarDetalleGarantia(garantia.detalle);

    setErrores({ fecha: resFecha, motivo: resMotivo, detalle: resDetalle });

    if (resFecha.valido && resMotivo.valido && resDetalle.valido) {
      alert(
        "Solicitud de garantía ingresada correctamente. Nuestro equipo técnico responderá en 48 horas hábiles."
      );
      setGarantia({ fecha: "", motivo: "", detalle: "" });
      setErrores({});
    }
  }

  const MensajeError = ({ nombreCampo }) =>
    errores[nombreCampo]?.valido === false ? (
      <span className="texto-error mt-1" role="alert">
        {errores[nombreCampo].mensaje}
      </span>
    ) : null;

  return (
    <div className="seccion">
      <div className="container">
        <h1>Historial de Pedidos y Post-Venta</h1>
        <p>
          Revisa el estado de tus compras recientes, el seguimiento de tus
          paquetes o gestiona una garantía técnica.
        </p>

        {/* ----- Sección 1: Listado de órdenes ----- */}
        <section className="mb-5" aria-labelledby="titulo-mis-ordenes">
          <h2 id="titulo-mis-ordenes">Tus compras recientes</h2>

          {cargando && <Cargando texto="Cargando tus pedidos…" />}
          {error && <ErrorCarga mensaje={error} onReintentar={recargar} />}

          {!cargando && !error && (ordenes ?? []).length === 0 && (
            <div className="alert alert-info" role="status">
              <span aria-hidden="true">📦</span> <strong>Todavía no tienes pedidos.</strong>
              <p className="mt-2 mb-0">
                <Link className="btn btn-primary" to="/catalogo">Explorar catálogo</Link>
              </p>
            </div>
          )}

          {!cargando && !error && (ordenes ?? []).length > 0 && (
            <div className="d-flex flex-column gap-3">
              {ordenes.map((orden) => (
                <article key={orden.id} className="tarjeta-producto card">
                  <div className="card-body">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-2 mb-2 border-bottom">
                      <div>
                        <strong className="text-body-emphasis fs-5">Orden #{orden.numero}</strong>
                        <p className="mb-0 small text-body-secondary">
                          Fecha de compra: {formatearFecha(orden.fecha)}
                        </p>
                      </div>
                      <div>
                        <span className={`badge ${estiloEstado(orden.estado)}`}>{orden.estado}</span>
                      </div>
                    </div>

                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                      <div>
                        <p className="mb-0 fw-semibold">
                          {orden.unidades} {orden.unidades === 1 ? "unidad" : "unidades"}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="tarjeta-producto__precio mb-0">
                          {formatearPesosCLP(orden.total)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ----- Sección 2: Formulario de Garantía Legal ----- */}
        <section aria-labelledby="titulo-garantia">
          <div className="card" style={{ maxWidth: "700px" }}>
            <div className="card-body p-4">
              <h2 id="titulo-garantia">Solicitud de Garantía Técnica y Devolución</h2>
              <p>
                Si tu hardware presenta fallas técnicas, ingresa los datos a
                continuación. El plazo máximo de cobertura legal es de 180 días
                corridos a partir de la entrega.
              </p>

              <form onSubmit={manejarSubmit} noValidate>
                <div className="mb-3">
                  <label className="form-label" htmlFor="garantia-fecha">Fecha de recepción del producto *</label>
                  <input
                    className="form-control"
                    type="date"
                    id="garantia-fecha"
                    name="fecha"
                    aria-describedby="ayuda-fecha error-fecha"
                    value={garantia.fecha}
                    onChange={(e) => manejarCambio("fecha", e.target.value)}
                    onBlur={() => manejarBlur("fecha")}
                  />
                  <span id="ayuda-fecha" className="texto-ayuda">
                    Fecha en la que recibiste físicamente el paquete.
                  </span>
                  <MensajeError nombreCampo="fecha" />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="garantia-motivo">Motivo de la solicitud *</label>
                  <select
                    className="form-select"
                    id="garantia-motivo"
                    name="motivo"
                    aria-describedby="error-motivo"
                    value={garantia.motivo}
                    onChange={(e) => manejarCambio("motivo", e.target.value)}
                    onBlur={() => manejarBlur("motivo")}
                  >
                    <option value="">Selecciona el motivo...</option>
                    <option value="falla-fabrica">Falla técnica de fábrica o mal funcionamiento</option>
                    <option value="incompleto">Producto llegó incompleto o con daño físico por transporte</option>
                    <option value="incompatibilidad">Problema crítico de compatibilidad de componentes</option>
                  </select>
                  <MensajeError nombreCampo="motivo" />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="garantia-detalle">Descripción detallada de la falla *</label>
                  <textarea
                    className="form-control"
                    id="garantia-detalle"
                    name="detalle"
                    rows="4"
                    placeholder="Indica qué pruebas realizaste y cuál es la anomalía (mínimo 20 caracteres)..."
                    aria-describedby="ayuda-detalle error-detalle"
                    value={garantia.detalle}
                    onChange={(e) => manejarCambio("detalle", e.target.value)}
                    onBlur={() => manejarBlur("detalle")}
                  />
                  <span id="ayuda-detalle" className="texto-ayuda">
                    Describe el problema con claridad para agilizar la revisión técnica.
                  </span>
                  <MensajeError nombreCampo="detalle" />
                </div>

                <button type="submit" className="btn btn-primary">
                  Ingresar Solicitud de Garantía
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}