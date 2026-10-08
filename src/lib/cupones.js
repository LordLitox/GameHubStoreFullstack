/**
 * Motor de cupones y cálculo de totales (funciones puras).
 * Migrado desde la sección 2 de legacy/js/app.js, desacoplando
 * el acceso a localStorage (ahora responsabilidad del contexto de React).
 */

export function cuponVigente(cupon, fechaActual = new Date()) {
  if (!cupon || !cupon.expira) return false;
  const fechaExp = new Date(cupon.expira + "T23:59:59");
  return fechaActual <= fechaExp;
}

export function buscarCupon(cupones, codigo) {
  const limpio = (codigo || "").trim().toUpperCase();
  if (!limpio) return null;
  return cupones.find((c) => c.codigo === limpio) || null;
}

export function aplicarCupon(cupones, codigo, fechaActual = new Date()) {
  if (!codigo || codigo.trim() === "") {
    return { exito: false, cupon: null, mensaje: "Debes ingresar un código de cupón." };
  }

  const cupon = buscarCupon(cupones, codigo);

  if (!cupon) {
    return { exito: false, cupon: null, mensaje: "El cupón no existe o no es válido." };
  }

  if (!cuponVigente(cupon, fechaActual)) {
    return { exito: false, cupon: null, mensaje: "El cupón ha expirado." };
  }

  return {
    exito: true,
    cupon,
    mensaje: `Cupón ${cupon.codigo} aplicado con éxito (${cupon.porcentaje}% dscto).`,
  };
}

export function calcularTotales(carrito, cupon, fechaActual = new Date()) {
  const subtotal = carrito.reduce((acumulado, item) => acumulado + item.precio * item.cantidad, 0);
  if (subtotal <= 0) return { subtotal: 0, descuento: 0, total: 0 };

  let descuento = 0;
  if (cupon && cuponVigente(cupon, fechaActual)) {
    const descuentoTeorico = Math.round(subtotal * (cupon.porcentaje / 100));
    descuento = Math.min(descuentoTeorico, cupon.topeMaximo);
  }

  const total = Math.max(0, subtotal - descuento);
  return { subtotal, descuento, total };
}
