/**
 * Perfiles de usuario y permisos simulados (EP1).
 * Migrados tal cual desde legacy/js/data.js.
 */
export const PERFILES_USUARIO = [
  { rol: "Visitante", permisos: ["navegar", "armar_carrito"] },
  { rol: "Cliente", permisos: ["navegar", "armar_carrito", "comprar", "resenar", "garantia"] },
  { rol: "Operador", permisos: ["gestionar_ordenes", "stock", "despachos"] },
  { rol: "Administrador", permisos: ["todo"] },
];
