/**
 * Cupones de descuento simulados (EP1: sin backend).
 * Migrados tal cual desde legacy/js/data.js.
 */
export const CUPONES = [
  {
    codigo: "GAMEHUB20",
    porcentaje: 20,
    topeMaximo: 50000,
    expira: "2026-12-31", // Vigente
  },
  {
    codigo: "BIENVENIDO10",
    porcentaje: 10,
    topeMaximo: 20000,
    expira: "2025-01-01", // Expirado (caso de prueba de cuponVigente)
  },
];
