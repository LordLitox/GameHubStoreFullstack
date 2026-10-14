import { useState } from "react";
import { useTitulo } from "../hooks/useTitulo.js";
import {
  validarFechaGarantia,
  validarSelect,
  validarDetalleGarantia,
} from "../lib/validaciones.js";

// Órdenes simuladas de demostración (igual que el legacy, EP1 sin backend)
const ORDENES_SIMULADAS = [
  {
    numero: "GH-742910",
    fecha: "15 de Agosto, 2026",
    estado: "Entregado",
    entregado: true,
    producto: "1x Mouse Inalámbrico RGB Pro",
    seguimientoEmpresa: "BlueExpress",
    seguimientoCodigo: "BX-99401248",
    total: 29990,
    pago: "Pago aprobado (Webpay Plus)",
  },
  {
    numero: "GH-881204",
    fecha: "02 de Septiembre, 2026",
    estado: "En Tránsito a Domicilio",
    entregado: false,
    producto: "1x Teclado Mecánico TKL RGB",
    seguimientoEmpresa: "Starken",
    seguimientoCodigo: "ST-11823901",
    total: 59990,
    pago: "Pago aprobado (Transferencia)",
  },
];

/**
 * Historial de pedidos y formulario de garantía post-venta. Migrado desde
 * legacy/ordenes.html + legacy/js/validaciones.js (sección 2): las reglas
 * de la garantía (máximo 180 días, sin fechas futuras, detalle de 20+
 * caracteres) vienen de src/lib/validaciones.js.
 */
export default function Ordenes() {
  useTitulo("Mis pedidos — GameHub Store");

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

          <div className="d-flex flex-column gap-3">
            {ORDENES_SIMULADAS.map((orden) => (
              <article key={orden.numero} className="tarjeta-producto card">
                <div className="card-body">
                  <div
                    className="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-2 mb-2 border-bottom"
                  >
                    <div>
                      <strong className="text-body-emphasis fs-5">Orden #{orden.numero}</strong>
                      <p className="mb-0 small text-body-secondary">Fecha de compra: {orden.fecha}</p>
                    </div>
                    <div>
                      {orden.entregado ? (
                        <span className="badge text-bg-success">✓ Entregado</span>
                      ) : (
                        <span className="badge text-bg-primary">🚚 {orden.estado}</span>
                      )}
                    </div>
                  </div>

                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <div>
                      <p className="mb-0 fw-semibold">{orden.producto}</p>
                      <p className="mb-0 small text-body-secondary">
                        Seguimiento {orden.seguimientoEmpresa}: <strong>{orden.seguimientoCodigo}</strong>
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="tarjeta-producto__precio mb-0">
                        ${orden.total.toLocaleString("es-CL")}
                      </p>
                      <span className="small text-body-secondary">{orden.pago}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
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