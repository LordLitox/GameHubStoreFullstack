/**
 * Productos del catálogo público.
 * Backend: `product-service` a través del Gateway.
 */

import { obtener, query } from "./cliente.js";
import { aProducto } from "./adaptadores.js";
import { stockPorProducto } from "./inventario.js";

/** Convierte la lista del backend y le pega el stock de inventory-service. */
async function conStock(resumenes) {
  if (resumenes.length === 0) return [];
  const stock = await stockPorProducto(resumenes.map((r) => r.id));
  return resumenes.map((resumen) => aProducto(resumen, stock.get(resumen.id) ?? 0));
}

/**
 * Catálogo completo (con stock), opcionalmente de una categoría.
 * @param {{ categoria?: string }} [filtros] Slug de categoría.
 */
export async function listarConStock(filtros = {}) {
  const resumenes = await obtener(`/productos${query({ categoria: filtros.categoria })}`, {
    sinAuth: true,
  });
  return conStock(resumenes ?? []);
}

/** Catálogo sin consultar el stock (una sola llamada al Gateway). */
export async function listar(filtros = {}) {
  const resumenes = await obtener(`/productos${query({ categoria: filtros.categoria })}`, {
    sinAuth: true,
  });
  return (resumenes ?? []).map((resumen) => aProducto(resumen));
}

/** Ficha completa de un producto, con stock y sin reseñas. */
export async function detalle(id) {
  const [producto, stock] = await Promise.all([
    obtener(`/productos/${id}`, { sinAuth: true }),
    stockPorProducto([id]),
  ]);
  return aProducto(producto, stock.get(Number(id)) ?? 0);
}

/** Productos que hoy están en oferta, para "Destacados de la semana". */
export async function destacados(limite = 4) {
  const catalogo = await listarConStock();
  return catalogo.filter((producto) => producto.destacado).slice(0, limite);
}
