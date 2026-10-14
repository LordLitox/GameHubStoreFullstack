/**
 * Cupones de descuento simulados (EP1: sin backend).
 * Migrados tal cual desde legacy/js/data.js.
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
