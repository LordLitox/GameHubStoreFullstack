/**
 * Cupones de descuento (validación pública).
 * Backend: `promotion-service`.
 */

import { obtener, query } from "./cliente.js";
import { aCupon } from "./adaptadores.js";

/**
 * Valida un cupón contra las reglas del servidor (vigencia, usos, estado).
 * @param {string} codigo
 * @returns {Promise<{ exito: boolean, cupon: object|null, mensaje: string }>}
 *   Mantiene la forma que ya usa la vista del carrito; un cupón que no sirve
 *   llega como `exito: false` con el motivo del backend, no como excepción.
 */
export async function validar(codigo) {
  const limpio = String(codigo ?? "").trim();
  if (!limpio) {
    return { exito: false, cupon: null, mensaje: "Debes ingresar un código de cupón." };
  }
  try {
    const dto = await obtener(`/promociones/validar${query({ codigo: limpio })}`, {
      sinAuth: true,
    });
    const cupon = aCupon(dto);
    return {
      exito: true,
      cupon,
      mensaje: `Cupón ${cupon.codigo} aplicado con éxito (${cupon.porcentaje}% dscto).`,
    };
  } catch (error) {
    if (error?.estado === 404) {
      return { exito: false, cupon: null, mensaje: "El cupón no existe o no es válido." };
    }
    if (error?.estado === 400) {
      return { exito: false, cupon: null, mensaje: error.message };
    }
    throw error;
  }
}
