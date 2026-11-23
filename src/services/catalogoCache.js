/**
 * Caché del catálogo (EP3 · Parte 6).
 *
 * Tres vistas (Inicio, Catálogo y el contexto del carrito) necesitan la misma
 * lista de productos con stock. Sin caché, abrir la portada dispararía tres
 * veces las mismas llamadas al Gateway. Aquí la promesa se memoiza: el primero
 * que pregunta lanza la petición y los demás esperan el mismo resultado.
 *
 * Además expone `semilla()`, el catálogo local de la EP2 adaptado a la forma
 * que produce `aProducto`. Sirve de respaldo cuando el backend no responde y
 * como valor inicial del contexto, para que el carrito sea usable igual.
 */

import { listarConStock } from "./productos.js";
import { PRODUCTOS } from "../data/productos.js";

let promesa = null;

/**
 * Catálogo completo (con stock) desde el backend, memoizado.
 * @returns {Promise<Array>} Lista de productos en la forma del frontend.
 */
export function obtener() {
  if (!promesa) {
    promesa = listarConStock().catch((error) => {
      // Si falla, se olvida la promesa para permitir un reintento más adelante.
      promesa = null;
      throw error;
    });
  }
  return promesa;
}

/** Fuerza una recarga en la próxima llamada a `obtener()` (tras un CRUD del admin). */
export function invalidar() {
  promesa = null;
}

/** Copia profunda de la semilla local (evita mutar la constante del módulo). */
export function semilla() {
  return PRODUCTOS.map((producto) => ({ ...producto }));
}

/** Semilla local como promesa, para usar en pruebas sin backend. */
export function obtenerDeSemilla() {
  return Promise.resolve(semilla());
}
