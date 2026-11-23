/**
 * Validación del carrito antes del checkout.
 * Backend: `order-service`, que a su vez consulta product-service,
 * inventory-service y promotion-service.
 *
 * El carrito vive en el navegador (localStorage); aquí solo se revisa contra
 * el stock y los precios reales del servidor.
 */

import { enviar } from "./cliente.js";
import { aLineasSolicitud, aValidacionCarrito } from "./adaptadores.js";

/**
 * @param {Array} items Líneas del carrito del frontend (`{ id, cantidad }`).
 * @param {string} [codigoCupon]
 */
export async function validar(items = [], codigoCupon = null) {
  const dto = await enviar(
    "/carrito/validar",
    {
      lineas: aLineasSolicitud(items),
      cupon: codigoCupon || null,
    },
    { sinAuth: true }
  );
  return aValidacionCarrito(dto);
}
