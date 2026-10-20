/**
 * Fuente de datos simulada de cupones (EP2: sin backend).
 * Migrada desde legacy/js/data.js. Igual que productos, expone las operaciones
 * CRUD (Crear, Leer, Actualizar, Eliminar) sobre la colección.
 */
export const CUPONES = [
  {
    codigo: "GAMEHUB20",
    porcentaje: 20,
    topeMaximo: 50000,
    // Fecha lejana a propósito: es un cupón de demo y no debe caducar
    // durante la presentación. La regla de vigencia sí se prueba con
    // fechas inyectadas en src/lib/__tests__/cupones.test.js.
    expira: "2099-12-31",
  },
  {
    codigo: "BIENVENIDO10",
    porcentaje: 10,
    topeMaximo: 20000,
    expira: "2025-01-01", // Expirado (caso de prueba de cuponVigente)
  },
];

// ---------------------------------------------------------------------------
// CRUD sobre la colección simulada. La clave del cupón es su `codigo`.
// Convención de retorno de escritura, igual que la capa lib/:
//   { exito: boolean, cupon: object|null, mensaje: string }
// ---------------------------------------------------------------------------

/** Estado inicial de la colección, para poder reiniciarla (útil en pruebas). */
const SEMILLA = JSON.parse(JSON.stringify(CUPONES));

/** Normaliza un código: sin espacios y en mayúsculas. */
function normalizarCodigo(codigo) {
  return String(codigo ?? "").trim().toUpperCase();
}

/** Valida un cupón completo. Devuelve un mensaje de error o null si es válido. */
function validarCupon(cupon, codigoOriginal = null) {
  if (!cupon.codigo) return "El código del cupón es obligatorio.";
  if (!/^[A-Z0-9]+$/.test(cupon.codigo)) {
    return "El código debe contener solo letras y números (sin espacios).";
  }
  const duplicado = CUPONES.some(
    (c) => c.codigo === cupon.codigo && c.codigo !== codigoOriginal
  );
  if (duplicado) return `Ya existe un cupón con el código ${cupon.codigo}.`;
  if (
    typeof cupon.porcentaje !== "number" ||
    Number.isNaN(cupon.porcentaje) ||
    cupon.porcentaje <= 0 ||
    cupon.porcentaje > 100
  ) {
    return "El porcentaje debe ser un número entre 1 y 100.";
  }
  if (
    typeof cupon.topeMaximo !== "number" ||
    Number.isNaN(cupon.topeMaximo) ||
    cupon.topeMaximo < 0
  ) {
    return "El tope máximo debe ser un número mayor o igual a 0.";
  }
  if (!cupon.expira || Number.isNaN(new Date(cupon.expira).getTime())) {
    return "La fecha de expiración (expira) no es válida.";
  }
  return null;
}

/** LEER: devuelve una copia del listado de cupones. */
export function listarCupones() {
  return CUPONES.map((cupon) => ({ ...cupon }));
}

/** LEER: busca por código (sin distinguir mayúsculas ni espacios). null si no existe. */
export function obtenerCuponPorCodigo(codigo) {
  const buscado = normalizarCodigo(codigo);
  return CUPONES.find((cupon) => cupon.codigo === buscado) || null;
}

/**
 * CREAR: agrega un cupón nuevo.
 * @returns {{ exito: boolean, cupon: object|null, mensaje: string }}
 */
export function crearCupon(datos = {}) {
  const nuevo = {
    codigo: normalizarCodigo(datos.codigo),
    porcentaje: Number(datos.porcentaje),
    topeMaximo: datos.topeMaximo === undefined ? 0 : Number(datos.topeMaximo),
    expira: datos.expira,
  };

  const error = validarCupon(nuevo);
  if (error) return { exito: false, cupon: null, mensaje: error };

  CUPONES.push(nuevo);
  return { exito: true, cupon: nuevo, mensaje: `Cupón ${nuevo.codigo} creado.` };
}

/**
 * ACTUALIZAR: modifica los campos indicados de un cupón existente.
 * El código no se puede cambiar (se ignora si viene en `cambios`).
 * @returns {{ exito: boolean, cupon: object|null, mensaje: string }}
 */
export function actualizarCupon(codigo, cambios = {}) {
  const buscado = normalizarCodigo(codigo);
  const indice = CUPONES.findIndex((cupon) => cupon.codigo === buscado);
  if (indice === -1) {
    return { exito: false, cupon: null, mensaje: `No existe el cupón ${buscado}.` };
  }

  const original = CUPONES[indice];
  const { codigo: _codigoIgnorado, ...permitidos } = cambios || {};
  const actualizado = { ...original, ...permitidos };

  const error = validarCupon(actualizado, original.codigo);
  if (error) return { exito: false, cupon: original, mensaje: error };

  CUPONES[indice] = actualizado;
  return { exito: true, cupon: actualizado, mensaje: `Cupón ${actualizado.codigo} actualizado.` };
}

/**
 * ELIMINAR: quita un cupón de la colección por su código.
 * @returns {{ exito: boolean, cupon: object|null, mensaje: string }}
 */
export function eliminarCupon(codigo) {
  const buscado = normalizarCodigo(codigo);
  const indice = CUPONES.findIndex((cupon) => cupon.codigo === buscado);
  if (indice === -1) {
    return { exito: false, cupon: null, mensaje: `No existe el cupón ${buscado}.` };
  }

  const [eliminado] = CUPONES.splice(indice, 1);
  return { exito: true, cupon: eliminado, mensaje: `Cupón ${eliminado.codigo} eliminado.` };
}

/** Restaura la colección a su estado inicial (aísla las pruebas entre sí). */
export function restablecerCupones() {
  CUPONES.splice(0, CUPONES.length, ...JSON.parse(JSON.stringify(SEMILLA)));
}
