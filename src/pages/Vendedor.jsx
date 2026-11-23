import { useState } from "react";
import { useTitulo } from "../hooks/useTitulo.js";
import { useDatos } from "../hooks/useDatos.js";
import { Cargando, ErrorCarga } from "../components/EstadoCarga.jsx";
import { operador as servicioOperador, mensajeDeError } from "../services/index.js";
import { formatearPesosCLP } from "../lib/formato.js";

/**
 * Panel del vendedor (rol OPERADOR — "Vendedor" en la interfaz).
 *
 * EP3 · Parte 6: es la página que el menú de la Parte 5 ya enlazaba pero que
 * todavía no existía. Consume `services/operador.js` contra los microservicios
 * de orden, inventario, pago y despacho, todos bajo `/api/v1/operador/**`.
 *
 * Tiene dos pestañas:
 *  - **Órdenes**: bandeja con las órdenes pendientes de pago y por despachar,
 *    con las acciones de confirmar/anular pago y generar/avanzar despacho.
 *  - **Inventario**: stock actual y registro de movimientos de bodega.
 */

const FILTROS_ORDEN = [
  { valor: "", texto: "Todas" },
  { valor: "PENDIENTE_PAGO", texto: "Pendientes de pago" },
  { valor: "POR_DESPACHAR", texto: "Por despachar" },
  { valor: "EN_CURSO", texto: "En curso" },
  { valor: "ENTREGADAS", texto: "Entregadas" },
  { valor: "CERRADAS", texto: "Cerradas" },
];

/** Fecha ISO corta para la tabla ("15-08-2026 14:30"). */
function formatearFecha(fechaISO) {
  if (!fechaISO) return "—";
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return String(fechaISO);
  return fecha.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Vendedor() {
  useTitulo("Ventas — GameHub Store");

  const [vista, setVista] = useState("ordenes");
  const [filtro, setFiltro] = useState("");
  const [mensaje, setMensaje] = useState(null); // { tipo, texto }
  const [ocupado, setOcupado] = useState(null); // id de la orden en proceso

  // Resumen de cabecera (pagos por confirmar, despachos por generar, en curso).
  const resumen = useDatos(() => servicioOperador.ordenes.resumen(), []);

  // Bandeja de órdenes según el filtro elegido.
  const { datos: ordenes, cargando, error, recargar } = useDatos(
    () => servicioOperador.ordenes.listar(filtro || undefined),
    [filtro]
  );

  function avisar(resultado, exitoTexto) {
    setMensaje({ tipo: "exito", texto: exitoTexto ?? resultado });
  }

  /** Ejecuta una acción de orden, refresca la bandeja y avisa del resultado. */
  async function accionOrden(id, accion, exitoTexto) {
    setOcupado(id);
    setMensaje(null);
    try {
      await accion();
      avisar(null, exitoTexto);
      recargar();
      resumen.recargar();
    } catch (fallo) {
      setMensaje({ tipo: "error", texto: mensajeDeError(fallo) });
    } finally {
      setOcupado(null);
    }
  }

  const cifras = resumen.datos ?? {};

  return (
    <div className="seccion">
      <div className="container">
        <h1>Panel de Ventas</h1>
        <p>
          Gestiona los pagos pendientes y los despachos de las órdenes, y
          mantén el stock de bodega al día.
        </p>

        {/* Cifras de cabecera */}
        <div className="row row-cols-1 row-cols-md-3 g-3 mb-4">
          <div className="col">
            <div className="card text-center h-100">
              <div className="card-body">
                <p className="text-body-secondary mb-1">Pagos por confirmar</p>
                <p className="fs-3 mb-0 fw-semibold">{cifras.pagosPendientes ?? "—"}</p>
              </div>
            </div>
          </div>
          <div className="col">
            <div className="card text-center h-100">
              <div className="card-body">
                <p className="text-body-secondary mb-1">Despachos por generar</p>
                <p className="fs-3 mb-0 fw-semibold">{cifras.porDespachar ?? "—"}</p>
              </div>
            </div>
          </div>
          <div className="col">
            <div className="card text-center h-100">
              <div className="card-body">
                <p className="text-body-secondary mb-1">Órdenes en curso</p>
                <p className="fs-3 mb-0 fw-semibold">{cifras.enCurso ?? "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pestañas */}
        <div className="mb-4 d-flex gap-2" role="tablist" aria-label="Secciones del panel de ventas">
          <button
            type="button"
            role="tab"
            id="tab-ordenes"
            aria-selected={vista === "ordenes"}
            aria-controls="panel-ordenes"
            className={`btn ${vista === "ordenes" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setVista("ordenes")}
          >
            Órdenes
          </button>
          <button
            type="button"
            role="tab"
            id="tab-inventario"
            aria-selected={vista === "inventario"}
            aria-controls="panel-inventario"
            className={`btn ${vista === "inventario" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setVista("inventario")}
          >
            Inventario
          </button>
        </div>

        {mensaje && (
          <div
            className={`alert ${mensaje.tipo === "exito" ? "alert-success" : "alert-danger"}`}
            role={mensaje.tipo === "exito" ? "status" : "alert"}
          >
            {mensaje.texto}
          </div>
        )}

        {vista === "ordenes" ? (
          <section id="panel-ordenes" role="tabpanel" aria-labelledby="tab-ordenes">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h2 className="h5 mb-0">Bandeja de órdenes</h2>
              <div style={{ minWidth: "14rem" }}>
                <label className="form-label small mb-1" htmlFor="filtro-orden-vendedor">
                  Filtrar por estado
                </label>
                <select
                  className="form-select form-select-sm"
                  id="filtro-orden-vendedor"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                >
                  {FILTROS_ORDEN.map((op) => (
                    <option key={op.valor} value={op.valor}>{op.texto}</option>
                  ))}
                </select>
              </div>
            </div>

            {cargando && <Cargando texto="Cargando órdenes…" />}
            {error && <ErrorCarga mensaje={error} onReintentar={recargar} />}

            {!cargando && !error && (ordenes ?? []).length === 0 && (
              <div className="alert alert-info" role="status">
                No hay órdenes que coincidan con el filtro seleccionado.
              </div>
            )}

            {!cargando && !error && (ordenes ?? []).length > 0 && (
              <div className="table-responsive">
                <table className="table table-striped align-middle">
                  <caption className="visualmente-oculto">Órdenes de la tienda</caption>
                  <thead>
                    <tr>
                      <th scope="col">Orden</th>
                      <th scope="col">Cliente</th>
                      <th scope="col">Fecha</th>
                      <th scope="col">Total</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Pago</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenes.map((orden) => (
                      <tr key={orden.id}>
                        <td>
                          <strong>{orden.numero}</strong>
                          <div className="small text-body-secondary">{orden.unidades} un.</div>
                        </td>
                        <td>{orden.cliente}</td>
                        <td className="small">{formatearFecha(orden.fecha)}</td>
                        <td>{formatearPesosCLP(orden.total)}</td>
                        <td>
                          <span className="badge text-bg-secondary">{orden.estado}</span>
                        </td>
                        <td>
                          <span className="small">{orden.estadoPago}</span>
                          <div className="small text-body-secondary">{orden.estadoDespacho}</div>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {orden.estadoPago === "PENDIENTE" && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success"
                                  disabled={ocupado === orden.id}
                                  onClick={() =>
                                    accionOrden(
                                      orden.id,
                                      () => servicioOperador.ordenes.confirmarPago(orden.id),
                                      `Pago de la orden ${orden.numero} confirmado.`
                                    )
                                  }
                                >
                                  Confirmar pago
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  disabled={ocupado === orden.id}
                                  onClick={() =>
                                    accionOrden(
                                      orden.id,
                                      () => servicioOperador.ordenes.anularPago(orden.id),
                                      `Pago de la orden ${orden.numero} anulado.`
                                    )
                                  }
                                >
                                  Anular
                                </button>
                              </>
                            )}
                            {orden.estadoPago === "APROBADO" &&
                              (orden.estadoDespacho === "SIN_DESPACHO" ||
                                orden.estadoDespacho === "PREPARANDO") && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  disabled={ocupado === orden.id}
                                  onClick={() =>
                                    accionOrden(
                                      orden.id,
                                      () => servicioOperador.ordenes.generarDespacho(orden.id),
                                      `Despacho de la orden ${orden.numero} generado.`
                                    )
                                  }
                                >
                                  Generar despacho
                                </button>
                              )}
                            {orden.estadoDespacho === "DESPACHADO" && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                disabled={ocupado === orden.id}
                                onClick={() =>
                                  accionOrden(
                                    orden.id,
                                    () =>
                                      servicioOperador.ordenes.actualizarDespacho(orden.id, {
                                        estado: "EN_TRANSITO",
                                      }),
                                    `Orden ${orden.numero} marcada en tránsito.`
                                  )
                                }
                              >
                                Marcar en tránsito
                              </button>
                            )}
                            {orden.estadoDespacho === "EN_TRANSITO" && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                disabled={ocupado === orden.id}
                                onClick={() =>
                                  accionOrden(
                                    orden.id,
                                    () =>
                                      servicioOperador.ordenes.actualizarDespacho(orden.id, {
                                        estado: "ENTREGADO",
                                      }),
                                    `Orden ${orden.numero} marcada como entregada.`
                                  )
                                }
                              >
                                Marcar entregada
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <PanelInventario avisar={avisar} />
        )}
      </div>
    </div>
  );
}

/** Pestaña de inventario: stock actual y registro de movimientos. */
function PanelInventario({ avisar }) {
  const { datos: stock, cargando, error, recargar } = useDatos(
    () => servicioOperador.inventario.listar(),
    []
  );
  const { datos: movimientos } = useDatos(() => servicioOperador.inventario.movimientos(), []);

  const [movimiento, setMovimiento] = useState({ productoId: "", tipo: "INGRESO", cantidad: "", motivo: "" });
  const [enviando, setEnviando] = useState(false);
  const [errorMovimiento, setErrorMovimiento] = useState(null);

  async function registrar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setErrorMovimiento(null);
    try {
      await servicioOperador.inventario.registrarMovimiento({
        productoId: movimiento.productoId,
        tipo: movimiento.tipo,
        cantidad: movimiento.cantidad,
        motivo: movimiento.motivo,
      });
      avisar(null, "Movimiento de stock registrado.");
      setMovimiento({ productoId: "", tipo: "INGRESO", cantidad: "", motivo: "" });
      recargar();
    } catch (fallo) {
      setErrorMovimiento(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section id="panel-inventario" role="tabpanel" aria-labelledby="tab-inventario">
      <h2 className="h5 mb-3">Inventario de bodega</h2>

      {cargando && <Cargando texto="Cargando inventario…" />}
      {error && <ErrorCarga mensaje={error} onReintentar={recargar} />}

      {!cargando && !error && (
        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <caption className="visualmente-oculto">Stock actual por producto</caption>
                <thead>
                  <tr>
                    <th scope="col">SKU</th>
                    <th scope="col">Producto</th>
                    <th scope="col">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {(stock ?? []).map((fila) => (
                    <tr key={fila.productoId}>
                      <td>{fila.sku}</td>
                      <td>{fila.nombre}</td>
                      <td>
                        <span className={`badge ${fila.stock <= 0 ? "text-bg-danger" : "text-bg-success"}`}>
                          {fila.stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="h6 mt-4">Últimos movimientos</h3>
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Producto</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Cantidad</th>
                    <th scope="col">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {(movimientos ?? []).slice(0, 10).map((m) => (
                    <tr key={m.id}>
                      <td className="small">{formatearFecha(m.fecha)}</td>
                      <td>{m.producto}</td>
                      <td>
                        <span className={`badge ${m.tipo === "SALIDA" ? "text-bg-warning" : "text-bg-info"}`}>
                          {m.tipo}
                        </span>
                      </td>
                      <td>{m.cantidad}</td>
                      <td className="small">{m.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card">
              <div className="card-body">
                <h3 className="h5 mb-3">Registrar movimiento</h3>

                {errorMovimiento && (
                  <div className="alert alert-danger" role="alert">{errorMovimiento}</div>
                )}

                <form onSubmit={registrar} noValidate>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="inv-producto">Producto *</label>
                    <select
                      className="form-select"
                      id="inv-producto"
                      value={movimiento.productoId}
                      onChange={(e) => setMovimiento((p) => ({ ...p, productoId: e.target.value }))}
                    >
                      <option value="">Selecciona un producto...</option>
                      {(stock ?? []).map((fila) => (
                        <option key={fila.productoId} value={fila.productoId}>
                          {fila.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="inv-tipo">Tipo *</label>
                    <select
                      className="form-select"
                      id="inv-tipo"
                      value={movimiento.tipo}
                      onChange={(e) => setMovimiento((p) => ({ ...p, tipo: e.target.value }))}
                    >
                      <option value="INGRESO">Ingreso</option>
                      <option value="SALIDA">Salida</option>
                      <option value="AJUSTE">Ajuste (stock contado)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="inv-cantidad">Cantidad *</label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      id="inv-cantidad"
                      value={movimiento.cantidad}
                      onChange={(e) => setMovimiento((p) => ({ ...p, cantidad: e.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="inv-motivo">Motivo</label>
                    <input
                      className="form-control"
                      id="inv-motivo"
                      placeholder="Ej. Reposición de proveedor"
                      value={movimiento.motivo}
                      onChange={(e) => setMovimiento((p) => ({ ...p, motivo: e.target.value }))}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
                    {enviando ? "Registrando…" : "Registrar movimiento"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
