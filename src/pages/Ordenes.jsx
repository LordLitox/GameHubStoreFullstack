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
      <span className="texto-error" style={{ display: "flex" }} role="alert">
        {errores[nombreCampo].mensaje}
      </span>
    ) : null;

  return (
    <div className="seccion">
      <div className="contenedor">
        <h1>Historial de Pedidos y Post-Venta</h1>
        <p>
          Revisa el estado de tus compras recientes, el seguimiento de tus
          paquetes o gestiona una garantía técnica.
        </p>

        {/* ----- Sección 1: Listado de órdenes ----- */}
        <section
          aria-labelledby="titulo-mis-ordenes"
          style={{ marginBottom: "var(--espacio-xl)" }}
        >
          <h2 id="titulo-mis-ordenes">Tus compras recientes</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--espacio-md)" }}>
            {ORDENES_SIMULADAS.map((orden) => (
              <article key={orden.numero} className="tarjeta-producto" style={{ padding: "var(--espacio-md)" }}>
                <div
                  className="flex-entre"
                  style={{
                    borderBottom: "1px solid var(--color-borde)",
                    paddingBottom: "var(--espacio-sm)",
                    marginBottom: "var(--espacio-sm)",
                  }}
                >
                  <div>
                    <strong style={{ color: "var(--color-texto-alto)", fontSize: "1.1rem" }}>
                      Orden #{orden.numero}
                    </strong>
                    <p style={{ margin: 0, fontSize: "var(--tam-pequeno)", color: "var(--color-texto-tenue)" }}>
                      Fecha de compra: {orden.fecha}
                    </p>
                  </div>
                  <div>
                    {orden.entregado ? (
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "rgba(172, 213, 80, 0.15)",
                          color: "var(--color-acento)",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "var(--radio-sm)",
                          fontWeight: 700,
                          fontSize: "var(--tam-pequeno)",
                        }}
                      >
                        ✓ Entregado
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "rgba(102, 192, 244, 0.15)",
                          color: "var(--color-primario)",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "var(--radio-sm)",
                          fontWeight: 700,
                          fontSize: "var(--tam-pequeno)",
                        }}
                      >
                        🚚 {orden.estado}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "var(--espacio-sm)",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{orden.producto}</p>
                    <p style={{ margin: 0, fontSize: "var(--tam-pequeno)", color: "var(--color-texto-tenue)" }}>
                      Seguimiento {orden.seguimientoEmpresa}: <strong>{orden.seguimientoCodigo}</strong>
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p className="tarjeta-producto__precio" style={{ margin: 0 }}>
                      ${orden.total.toLocaleString("es-CL")}
                    </p>
                    <span style={{ fontSize: "var(--tam-pequeno)", color: "var(--color-texto-tenue)" }}>
                      {orden.pago}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ----- Sección 2: Formulario de Garantía Legal ----- */}
        <section aria-labelledby="titulo-garantia">
          <div
            style={{
              backgroundColor: "var(--color-superficie)",
              border: "1px solid var(--color-borde)",
              borderRadius: "var(--radio-lg)",
              padding: "var(--espacio-lg)",
              maxWidth: "700px",
            }}
          >
            <h2 id="titulo-garantia">Solicitud de Garantía Técnica y Devolución</h2>
            <p>
              Si tu hardware presenta fallas técnicas, ingresa los datos a
              continuación. El plazo máximo de cobertura legal es de 180 días
              corridos a partir de la entrega.
            </p>

            <form onSubmit={manejarSubmit} noValidate>
              <div className="campo-formulario">
                <label htmlFor="garantia-fecha">Fecha de recepción del producto *</label>
                <input
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

              <div className="campo-formulario">
                <label htmlFor="garantia-motivo">Motivo de la solicitud *</label>
                <select
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

              <div className="campo-formulario">
                <label htmlFor="garantia-detalle">Descripción detallada de la falla *</label>
                <textarea
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

              <button type="submit" className="boton-primario">
                Ingresar Solicitud de Garantía
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}