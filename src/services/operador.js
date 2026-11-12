/**
 * Panel del vendedor (rol OPERADOR — "Vendedor" en la interfaz).
 * Backend: `order-service`, `inventory-service`, `payment-service`,
 * `shipping-service` y `warranty-service`, todos bajo `/api/v1/operador/**`.
 */

import { enviar, obtener, reemplazar, query } from "./cliente.js";
import { aOrdenDetalle, imagenProducto } from "./adaptadores.js";

/** `OrdenOperadorDto` → fila de la bandeja de órdenes. */
function aOrdenOperador(dto) {
  if (!dto) return null;
  return {
    id: dto.id,
    numero: dto.numero,
    cliente: dto.cliente,
    fecha: dto.creadaEn,
    total: dto.total,
    unidades: dto.unidades,
    estado: dto.estado,
    metodoPago: dto.metodoPago,
    estadoPago: dto.estadoPago,
    estadoDespacho: dto.estadoDespacho,
    seguimiento: dto.seguimiento ?? null,
  };
}

/** Órdenes: bandeja, detalle y los pasos de pago y despacho. */
export const ordenes = {
  /** Cifras de cabecera: pagos por confirmar, despachos por generar y órdenes en curso. */
  async resumen() {
    return obtener("/operador/resumen");
  },

  /** @param {string} [estado] PENDIENTE_PAGO | POR_DESPACHAR | EN_CURSO | ENTREGADAS | CERRADAS */
  async listar(estado) {
    const lista = await obtener(`/operador/ordenes${query({ estado })}`);
    return (lista ?? []).map(aOrdenOperador);
  },

  /** Detalle completo de cualquier orden, con las mismas líneas que ve el cliente. */
  async detalle(id) {
    return aOrdenDetalle(await obtener(`/operador/ordenes/${id}`));
  },

  /** Confirma una transferencia pendiente y descuenta el stock. */
  async confirmarPago(id) {
    return aOrdenOperador(await enviar(`/operador/ordenes/${id}/pago/confirmar`));
  },

  /** Anula un pago pendiente. */
  async anularPago(id) {
    return aOrdenOperador(await enviar(`/operador/ordenes/${id}/pago/anular`));
  },

  /** Genera el despacho en shipping-service. Ambos campos son opcionales. */
  async generarDespacho(id, { seguimiento, fechaEstimada } = {}) {
    return aOrdenOperador(
      await enviar(`/operador/ordenes/${id}/despacho`, {
        seguimiento: seguimiento || null,
        fechaEstimada: fechaEstimada || null,
      })
    );
  },

  /** Avanza el despacho: DESPACHADO, EN_TRANSITO o ENTREGADO. */
  async actualizarDespacho(id, { estado, seguimiento, fechaEstimada } = {}) {
    return aOrdenOperador(
      await reemplazar(`/operador/ordenes/${id}/despacho`, {
        estado,
        seguimiento: seguimiento || null,
        fechaEstimada: fechaEstimada || null,
      })
    );
  },
};

/** `StockDto` → fila de la tabla de stock. */
function aStock(dto) {
  if (!dto) return null;
  return {
    productoId: dto.id,
    sku: dto.sku,
    nombre: dto.nombre,
    stock: dto.stock,
    activo: dto.activo,
  };
}

/** `MovimientoDto` → fila del historial de movimientos. */
function aMovimiento(dto) {
  if (!dto) return null;
  return {
    id: dto.id,
    fecha: dto.fecha,
    productoId: dto.productoId,
    producto: dto.producto,
    tipo: dto.tipo,
    cantidad: dto.cantidad,
    motivo: dto.motivo,
    usuario: dto.usuario,
    stockResultante: dto.stockResultante,
  };
}

/** Inventario: stock actual y movimientos de bodega. */
export const inventario = {
  async listar() {
    const lista = await obtener("/operador/inventario");
    return (lista ?? []).map(aStock);
  },

  async movimientos() {
    const lista = await obtener("/operador/inventario/movimientos");
    return (lista ?? []).map(aMovimiento);
  },

  /**
   * Registra un movimiento de stock.
   * En `AJUSTE`, `cantidad` es el stock contado en bodega; en `INGRESO` y
   * `SALIDA`, las unidades que se mueven.
   */
  async registrarMovimiento({ productoId, tipo, cantidad, motivo }) {
    return aMovimiento(
      await enviar("/operador/inventario/movimientos", {
        productoId: Number(productoId),
        tipo,
        cantidad: Number(cantidad),
        motivo,
      })
    );
  },
};

/** Pagos: listado para el vendedor. */
export const pagos = {
  /** @param {string} [estado] PENDIENTE | APROBADO | RECHAZADO | ANULADO */
  async listar(estado) {
    return obtener(`/operador/pagos${query({ estado })}`);
  },
};

/** Despachos: listado para el vendedor. */
export const despachos = {
  /** @param {string} [estado] PREPARANDO | DESPACHADO | EN_TRANSITO | ENTREGADO */
  async listar(estado) {
    return obtener(`/operador/despachos${query({ estado })}`);
  },
};

/** Garantías post-venta. */
export const garantias = {
  async listar() {
    return obtener("/operador/garantias");
  },

  /** Cuántas garantías siguen sin cerrar (ABIERTA o EN_REVISION). */
  async resumen() {
    return obtener("/operador/garantias/resumen");
  },

  /** Cambia el estado de una garantía (`ResolverGarantiaSolicitud`). */
  async resolver(id, solicitud) {
    return reemplazar(`/operador/garantias/${id}`, solicitud);
  },
};

/** Se reexporta para pintar las líneas del detalle del vendedor. */
export { imagenProducto };
