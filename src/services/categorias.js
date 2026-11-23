/**
 * Categorías del catálogo.
 * Backend: `category-service`.
 */

import { obtener } from "./cliente.js";
import { aCategoria } from "./adaptadores.js";

/** Categorías con su cantidad de productos activos. */
export async function listar() {
  const lista = await obtener("/categorias", { sinAuth: true });
  return (lista ?? []).map(aCategoria);
}
