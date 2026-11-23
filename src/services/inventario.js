/**
 * Stock disponible.
 * Backend: `inventory-service`. Es un servicio aparte porque el stock cambia
 * por ventas y movimientos de bodega, no por la ficha del producto.
 */

import { obtener, query } from "./cliente.js";
import { aDisponibilidad } from "./adaptadores.js";

/**
 * Stock de los productos indicados.
 * @param {Array<number|string>} [ids] Sin ids, el backend entrega todos.
 * @returns {Promise<Map<number, number>>} `productoId → unidades`.
 */
export async function stockPorProducto(ids) {
  const ruta = `/inventario/stock${query({ productos: ids })}`;
  const lista = await obtener(ruta, { sinAuth: true });
  const mapa = new Map();
  (lista ?? []).forEach((dto) => {
    const { productoId, stock } = aDisponibilidad(dto);
    mapa.set(productoId, stock);
  });
  return mapa;
}

/** Lista completa de stock, tal como la entrega el backend. */
export async function listar() {
  const lista = await obtener("/inventario/stock", { sinAuth: true });
  return (lista ?? []).map(aDisponibilidad);
}
