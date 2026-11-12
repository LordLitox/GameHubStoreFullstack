/**
 * Reseñas de productos.
 * Backend: `review-service`.
 */

import { obtener, enviar, query } from "./cliente.js";
import { aResena, aResumenResenas } from "./adaptadores.js";

/** Reseñas aprobadas de un producto (público). */
export async function deProducto(productoId) {
  const lista = await obtener(`/productos/${productoId}/resenas`, { sinAuth: true });
  return (lista ?? []).map(aResena);
}

/**
 * Puntuación promedio y cantidad de reseñas por producto (público).
 * @param {Array<number|string>} [ids] Sin ids, el backend entrega todos.
 * @returns {Promise<Map<number, { puntuacion: number, cantidad: number }>>}
 */
export async function resumenPorProducto(ids) {
  const lista = await obtener(`/resenas/resumen${query({ productos: ids })}`, {
    sinAuth: true,
  });
  const mapa = new Map();
  (lista ?? []).forEach((dto) => {
    const resumen = aResumenResenas(dto);
    mapa.set(resumen.productoId, resumen);
  });
  return mapa;
}

/** Reseñas del cliente autenticado. */
export async function mias() {
  const lista = await obtener("/resenas/mias");
  return (lista ?? []).map(aResena);
}

/**
 * Publica una reseña sobre una línea ya comprada. Requiere rol CLIENTE.
 * El backend exige la orden de origen (`ordenId`) para verificar la compra;
 * la reseña queda PENDIENTE hasta que el administrador la aprueba.
 */
export async function crear({ ordenId, productoId, puntuacion, comentario }) {
  const dto = await enviar("/resenas", { ordenId, productoId, puntuacion, comentario });
  return aResena(dto);
}
