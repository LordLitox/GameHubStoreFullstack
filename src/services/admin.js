/**
 * Panel de administración (rol ADMIN).
 * Backend: `product-service`, `category-service`, `promotion-service`,
 * `review-service` y `auth-service` — todos bajo `/api/v1/admin/**`.
 */

import { borrar, enviar, modificar, obtener, reemplazar, query } from "./cliente.js";
import {
  aCategoria,
  aCupon,
  aEspecificaciones,
  aResena,
  aUsuario,
  nombreRol,
} from "./adaptadores.js";

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------

function aProductoSolicitud(datos = {}) {
  const especificaciones =
    datos.especificaciones && !Array.isArray(datos.especificaciones)
      ? Object.entries(datos.especificaciones).map(([clave, valor]) => ({ clave, valor }))
      : (datos.especificaciones ?? []);

  return {
    sku: datos.sku ?? "",
    nombre: datos.nombre ?? "",
    marca: datos.marca ?? "",
    categoriaId: Number(datos.categoriaId),
    precio: Number(datos.precio),
    precioNormal: datos.precioNormal ? Number(datos.precioNormal) : null,
    ofertaHasta: datos.ofertaHasta || null,
    stock: datos.stock === undefined || datos.stock === "" ? null : Number(datos.stock),
    resumen: datos.resumen ?? "",
    descripcion: datos.descripcion ?? "",
    imagen: datos.imagen ?? "",
    especificaciones,
  };
}

/** Producto tal como lo muestra el mantenedor (precios guardados, no los vigentes). */
function aProductoAdmin(dto) {
  if (!dto) return null;
  return {
    id: dto.id,
    sku: dto.sku,
    nombre: dto.nombre,
    marca: dto.marca,
    categoriaId: dto.categoriaId,
    categoria: dto.categoria,
    precio: dto.precio,
    precioNormal: dto.precioNormal ?? null,
    ofertaHasta: dto.ofertaHasta ?? null,
    activo: dto.activo,
    imagen: dto.imagen ?? "",
    resumen: dto.resumen ?? "",
    descripcion: dto.descripcion ?? "",
    especificaciones: aEspecificaciones(dto.especificaciones),
  };
}

export const productos = {
  /** Todos los productos, activos e inactivos. */
  async listar() {
    const lista = await obtener("/admin/productos");
    return (lista ?? []).map(aProductoAdmin);
  },
  async crear(datos) {
    return aProductoAdmin(await enviar("/admin/productos", aProductoSolicitud(datos)));
  },
  async actualizar(id, datos) {
    return aProductoAdmin(
      await reemplazar(`/admin/productos/${id}`, aProductoSolicitud(datos))
    );
  },
  /** Activa o desactiva la venta del producto. */
  async cambiarActivo(id, activo) {
    return aProductoAdmin(await modificar(`/admin/productos/${id}/activo`, { activo }));
  },
};

// ---------------------------------------------------------------------------
// Categorías
// ---------------------------------------------------------------------------

export const categorias = {
  /** Categorías contando también los productos inactivos (es el mantenedor). */
  async listar() {
    const lista = await obtener("/admin/categorias");
    return (lista ?? []).map(aCategoria);
  },
  async crear(nombre) {
    return aCategoria(await enviar("/admin/categorias", { nombre }));
  },
  async renombrar(id, nombre) {
    return aCategoria(await reemplazar(`/admin/categorias/${id}`, { nombre }));
  },
  /** Solo se puede eliminar una categoría sin productos. */
  async eliminar(id) {
    return borrar(`/admin/categorias/${id}`);
  },
};

// ---------------------------------------------------------------------------
// Promociones (cupones)
// ---------------------------------------------------------------------------

function aPromocion(dto) {
  if (!dto) return null;
  return {
    id: dto.id,
    codigo: dto.codigo,
    porcentaje: dto.porcentaje,
    topeMaximo: dto.tope ?? 0,
    inicio: dto.inicio ?? null,
    expira: dto.termino ?? null,
    usosMaximos: dto.usosMaximos ?? 0,
    usos: dto.usos ?? 0,
    activa: dto.activa,
    estado: dto.estado,
  };
}

function aPromocionSolicitud(datos = {}) {
  return {
    codigo: String(datos.codigo ?? "").trim().toUpperCase(),
    porcentaje: Number(datos.porcentaje),
    tope: Number(datos.topeMaximo ?? datos.tope),
    inicio: datos.inicio,
    termino: datos.expira ?? datos.termino,
    usosMaximos: Number(datos.usosMaximos ?? 1),
  };
}

export const promociones = {
  async listar() {
    const lista = await obtener("/admin/promociones");
    return (lista ?? []).map(aPromocion);
  },
  async crear(datos) {
    return aPromocion(await enviar("/admin/promociones", aPromocionSolicitud(datos)));
  },
  async actualizar(id, datos) {
    return aPromocion(
      await reemplazar(`/admin/promociones/${id}`, aPromocionSolicitud(datos))
    );
  },
  async cambiarActivo(id, activa) {
    return aPromocion(await modificar(`/admin/promociones/${id}/activo`, { activa }));
  },
};

// ---------------------------------------------------------------------------
// Reseñas y cuentas de usuario
// ---------------------------------------------------------------------------

export const resenas = {
  /** @param {string} [estado] PENDIENTE | APROBADA | OCULTA */
  async listar(estado) {
    const lista = await obtener(`/admin/resenas${query({ estado })}`);
    return (lista ?? []).map(aResena);
  },
  /** Aprueba (`APROBADA`) u oculta (`OCULTA`) una reseña. */
  async moderar(id, estado) {
    return aResena(await reemplazar(`/admin/resenas/${id}`, { estado }));
  },
};

export const usuarios = {
  async listar() {
    const lista = await obtener("/admin/usuarios");
    return (lista ?? []).map(aUsuario);
  },
  /** Activa o desactiva una cuenta (una cuenta desactivada no puede iniciar sesión). */
  async cambiarActivo(id, activo) {
    return aUsuario(await modificar(`/admin/usuarios/${id}/activo`, { activo }));
  },
};

/** Cupón público reutilizable: se expone para no importar dos módulos en la vista. */
export { aCupon, nombreRol };
