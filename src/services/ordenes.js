/**
 * Órdenes del cliente (checkout e historial).
 * Backend: `order-service`. Requiere rol CLIENTE.
 */

import { obtener, enviar } from "./cliente.js";
import {
  aDatosDespacho,
  aLineasSolicitud,
  aMetodoPago,
  aOrdenDetalle,
  aOrdenResumen,
} from "./adaptadores.js";

/**
 * Crea la orden y registra el pago simulado en una sola llamada.
 *
 * @param {object} pedido
 * @param {Array} pedido.items            Líneas del carrito del frontend.
 * @param {string} [pedido.cupon]         Código de cupón aplicado.
 * @param {string} pedido.metodoPago      Valor del formulario (`webpay`, `mach`, `transferencia`).
 * @param {object} pedido.despacho        Campos del formulario de checkout.
 * @returns {Promise<object>} Detalle de la orden creada (revisar `pago.estado`).
 */
export async function crear(pedido) {
  const dto = await enviar("/ordenes", {
    lineas: aLineasSolicitud(pedido.items),
    cupon: pedido.cupon || null,
    metodoPago: aMetodoPago(pedido.metodoPago),
    despacho: aDatosDespacho(pedido.despacho),
  });
  return aOrdenDetalle(dto);
}

/** Órdenes del cliente autenticado, de la más reciente a la más antigua. */
export async function mias() {
  const lista = await obtener("/ordenes/mias");
  return (lista ?? []).map(aOrdenResumen);
}

/** Detalle de una orden, con su pago y su despacho. */
export async function detalle(id) {
  const dto = await obtener(`/ordenes/${id}`);
  return aOrdenDetalle(dto);
}
