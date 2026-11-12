/**
 * Punto de entrada de la capa de servicios (EP3 · Parte 3).
 *
 * Las vistas importan desde aquí (`../services/index.js`) y nunca llaman a
 * `fetch` por su cuenta: así el día que cambie la URL del Gateway, el formato
 * del token o el nombre de un campo, se cambia en un solo lugar.
 *
 *   import { productos, autenticacion } from "../services/index.js";
 *   const catalogo = await productos.listarConStock();
 */

export * as productos from "./productos.js";
export * as categorias from "./categorias.js";
export * as inventario from "./inventario.js";
export * as cupones from "./cupones.js";
export * as carrito from "./carrito.js";
export * as ordenes from "./ordenes.js";
export * as resenas from "./resenas.js";
export * as autenticacion from "./autenticacion.js";
export * as usuarios from "./usuarios.js";
export * as admin from "./admin.js";
export * as operador from "./operador.js";

export { ErrorApi, mensajeDeError, URL_API } from "./cliente.js";
export { sesionActual, usuarioActual, tokenActual, alCambiarSesion } from "./sesion.js";
export { nombreRol } from "./adaptadores.js";
