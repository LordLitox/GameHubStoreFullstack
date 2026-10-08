/**
 * Reglas de validación de formularios (funciones puras).
 * Migradas desde legacy/js/validaciones.js, separando las REGLAS
 * (este archivo, testeadle sin DOM) del manejo visual de errores
 * (responsabilidad de cada componente en React, vía aria-invalid y
 * los elementos .texto-error ya definidos en el CSS).
 *
 * Cada validador devuelve { valido, mensaje }.
 */

export function validarNombre(valor) {
  const limpio = (valor || "").trim();
  if (limpio === "") {
    return { valido: false, mensaje: "El nombre completo es obligatorio." };
  }
  if (limpio.length < 5 || !limpio.includes(" ")) {
    return { valido: false, mensaje: "Ingresa al menos nombre y apellido válidos." };
  }
  return { valido: true, mensaje: "" };
}

export function validarEmail(valor) {
  const limpio = (valor || "").trim();
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (limpio === "") {
    return { valido: false, mensaje: "El correo electrónico es obligatorio." };
  }
  if (!regexEmail.test(limpio)) {
    return { valido: false, mensaje: "Formato de correo no válido (ej. usuario@dominio.cl)." };
  }
  return { valido: true, mensaje: "" };
}

export function validarTelefono(valor) {
  const limpio = (valor || "").trim();
  const regexTel = /^9\d{8}$/; // Formato móvil Chile: 9 dígitos comenzando en 9
  if (limpio === "") {
    return { valido: false, mensaje: "El número de teléfono es obligatorio." };
  }
  if (!regexTel.test(limpio)) {
    return { valido: false, mensaje: "Debe tener exactamente 9 dígitos y comenzar en 9." };
  }
  return { valido: true, mensaje: "" };
}

export function validarSelect(valor, campo) {
  if (!valor || valor === "") {
    return { valido: false, mensaje: `Debes seleccionar una opción de ${campo}.` };
  }
  return { valido: true, mensaje: "" };
}

export function validarTextoSimple(valor, campo) {
  if ((valor || "").trim().length < 4) {
    return { valido: false, mensaje: `La ${campo} debe contener al menos 4 caracteres.` };
  }
  return { valido: true, mensaje: "" };
}

/**
 * Coherencia de garantía legal: máximo 180 días (6 meses) desde la compra.
 * fechaCompraISO: string "YYYY-MM-DD" del input type="date".
 */
export function validarFechaGarantia(fechaCompraISO, fechaActual = new Date()) {
  if (!fechaCompraISO) {
    return { valido: false, mensaje: "Selecciona la fecha de recepción del pedido." };
  }

  const fechaCompra = new Date(fechaCompraISO);
  if (Number.isNaN(fechaCompra.getTime())) {
    return { valido: false, mensaje: "La fecha ingresada no es válida." };
  }

  const diferenciaDias = Math.floor(
    (fechaActual - fechaCompra) / (1000 * 60 * 60 * 24)
  );

  if (diferenciaDias < 0) {
    return { valido: false, mensaje: "La fecha no puede ser futura." };
  }

  if (diferenciaDias > 180) {
    return {
      valido: false,
      mensaje: `Plazo de garantía vencido (${diferenciaDias} días transcurridos. Máximo: 180 días).`,
    };
  }

  return { valido: true, mensaje: "" };
}

export function validarDetalleGarantia(valor) {
  if ((valor || "").trim().length < 20) {
    return {
      valido: false,
      mensaje: "Describe detalladamente la falla (mínimo 20 caracteres).",
    };
  }
  return { valido: true, mensaje: "" };
}
