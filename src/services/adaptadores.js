/**
 * Adaptadores entre la forma de los DTO del backend y la forma que ya usan
 * las vistas del frontend (EP3 · Parte 3).
 *
 * El backend y el frontend no coinciden en todos los campos: los nombres de
 * categoría son nombres visibles, el descuento viene como `precioNormal`, el
 * stock lo entrega otro microservicio y las especificaciones son una lista.
 * En vez de retocar cada vista (y sus 116 pruebas), la traducción se concentra
 * aquí: las vistas siguen recibiendo el objeto que ya conocían.
 *
 * El detalle de cada desajuste está en `docs/CONTRATO_API.md`.
 */

/** Imágenes locales disponibles para las claves que usa el catálogo semilla. */
const IMAGENES_POR_CLAVE = {
  notebook: "/assets/img/producto-notebook-asus.jpg",
  gpu: "/assets/img/producto-tarjeta-video.jpg",
  teclado: "/assets/img/producto-teclado.jpg",
  mouse: "/assets/img/producto-mouse-rgb.jpg",
  audifonos: "/assets/img/producto-audifonos.jpg",
  monitor: "/assets/img/producto-monitor.jpg",
  silla: "/assets/img/producto-silla.jpg",
};

/** Respaldo cuando la clave del producto no tiene foto propia. */
const IMAGENES_POR_CATEGORIA = {
  notebooks: "/assets/img/producto-notebook-lenovo.jpg",
  "tarjetas-graficas": "/assets/img/producto-tarjeta-video.jpg",
  procesadores: "/assets/img/categoria-accesorios.jpg",
  perifericos: "/assets/img/producto-mouse-rgb.jpg",
  consolas: "/assets/img/categoria-consolas.jpg",
  monitores: "/assets/img/producto-monitor.jpg",
  accesorios: "/assets/img/categoria-accesorios.jpg",
};

const IMAGEN_GENERICA = "/assets/img/poster-setup-gamer.jpg";

/** Nombres de rol tal como los pide la pauta de la EP3 (el enum del backend no cambia). */
export const NOMBRE_ROL = {
  ADMIN: "Administrador",
  OPERADOR: "Vendedor",
  CLIENTE: "Cliente",
};

/** Nombre visible de un rol del backend. */
export function nombreRol(rol) {
  return NOMBRE_ROL[rol] ?? rol ?? "";
}

/**
 * Ruta local de la imagen de un producto.
 * Acepta una clave del catálogo semilla ("gpu"), o una ruta/URL ya lista.
 */
export function imagenProducto(clave, categoriaSlug) {
  if (!clave) return IMAGENES_POR_CATEGORIA[categoriaSlug] ?? IMAGEN_GENERICA;
  if (clave.startsWith("http") || clave.startsWith("/")) return clave;
  return (
    IMAGENES_POR_CLAVE[clave] ??
    IMAGENES_POR_CATEGORIA[categoriaSlug] ??
    IMAGEN_GENERICA
  );
}

/** `[{ clave, valor }]` → `{ clave: valor }`, que es lo que recorre la ficha técnica. */
export function aEspecificaciones(lista) {
  if (!Array.isArray(lista)) return {};
  return lista.reduce((mapa, item) => {
    if (item && item.clave) mapa[item.clave] = item.valor;
    return mapa;
  }, {});
}

/**
 * Producto del backend → producto del frontend.
 *
 * El precio final no se copia: se calcula con `precioFinalProducto()` de
 * `src/lib/carrito.js` a partir del precio de lista y el porcentaje, igual que
 * hacían los datos simulados de la EP2.
 *
 * @param {object} resumen `ProductoResumenDto` o `ProductoDetalleDto`.
 * @param {number} [stock] Unidades disponibles que entrega inventory-service.
 */
export function aProducto(resumen, stock = 0) {
  if (!resumen) return null;

  const tieneOferta =
    resumen.precioNormal !== null &&
    resumen.precioNormal !== undefined &&
    resumen.precioNormal > resumen.precio;

  const porcentaje = tieneOferta
    ? Math.round((1 - resumen.precio / resumen.precioNormal) * 100)
    : 0;

  return {
    id: resumen.id,
    sku: resumen.sku,
    nombre: resumen.nombre,
    marca: resumen.marca,
    // Los filtros del catálogo comparan slugs; el nombre visible va aparte.
    categoria: resumen.categoriaSlug ?? "",
    categoriaNombre: resumen.categoria ?? "",
    // Precio de lista: el descuento lo aplica lib/carrito.js con descuentoVigente.
    precio: tieneOferta ? resumen.precioNormal : resumen.precio,
    descuentoVigente: { activo: tieneOferta, porcentaje },
    stockDisponible: stock,
    // "Destacados de la semana": los productos que hoy están en oferta.
    destacado: tieneOferta,
    imagen: imagenProducto(resumen.imagen, resumen.categoriaSlug),
    resumen: resumen.resumen ?? "",
    descripcion: resumen.descripcion ?? "",
    especificaciones: aEspecificaciones(resumen.especificaciones),
    ofertaHasta: resumen.ofertaHasta ?? null,
  };
}

/** `CategoriaDto` → categoría del frontend (para los filtros del catálogo). */
export function aCategoria(dto) {
  if (!dto) return null;
  return {
    id: dto.id,
    nombre: dto.nombre,
    slug: dto.slug,
    cantidadProductos: dto.cantidadProductos ?? 0,
  };
}

/** `DisponibilidadDto` → `{ productoId, stock }`. */
export function aDisponibilidad(dto) {
  if (!dto) return null;
  return { productoId: dto.productoId, stock: dto.stock ?? 0 };
}

/** `ResenaDto` → reseña del frontend (fechas ya formateadas en la Parte 6). */
export function aResena(dto) {
  if (!dto) return null;
  return {
    id: dto.id,
    autor: dto.autor,
    puntaje: dto.puntuacion,
    texto: dto.comentario,
    fecha: dto.fecha,
    estado: dto.estado,
  };
}

/** `ResumenResenasDto` → `{ productoId, puntuacion, cantidad }`. */
export function aResumenResenas(dto) {
  if (!dto) return null;
  return {
    productoId: dto.productoId,
    puntuacion: dto.puntuacion ?? 0,
    cantidad: dto.cantidad ?? 0,
  };
}

/**
 * `CuponDto` → cupón del frontend.
 * Se conserva `topeMaximo`/`expira` porque `src/lib/cupones.js` ya los usa así.
 */
export function aCupon(dto) {
  if (!dto) return null;
  return {
    codigo: dto.codigo,
    porcentaje: dto.porcentaje,
    topeMaximo: dto.tope ?? 0,
    expira: dto.termino ?? null,
    inicio: dto.inicio ?? null,
  };
}

/** `OrdenResumenDto` → fila del historial de pedidos. */
export function aOrdenResumen(dto) {
  if (!dto) return null;
  return {
    id: dto.id,
    numero: dto.numero,
    fecha: dto.creadaEn,
    estado: dto.estado,
    total: dto.total,
    unidades: dto.unidades,
  };
}

/** `OrdenDetalleDto` → detalle de la orden (líneas, pago y despacho). */
export function aOrdenDetalle(dto) {
  if (!dto) return null;
  return {
    id: dto.id,
    numero: dto.numero,
    fecha: dto.creadaEn,
    estado: dto.estado,
    cliente: dto.cliente,
    subtotal: dto.subtotal,
    descuento: dto.descuento,
    total: dto.total,
    cupon: dto.cupon ?? null,
    despachoDatos: dto.despachoDatos ?? null,
    lineas: (dto.lineas ?? []).map((linea) => ({
      productoId: linea.productoId,
      nombre: linea.nombre,
      imagen: imagenProducto(linea.imagen),
      precioUnitario: linea.precioUnitario,
      cantidad: linea.cantidad,
      subtotal: linea.subtotal,
    })),
    pago: dto.pago ? { ...dto.pago } : null,
    despacho: dto.despacho ? { ...dto.despacho } : null,
    entregadaEn: dto.entregadaEn ?? null,
  };
}

/** `UsuarioDto` / `UsuarioAdminDto` → usuario del frontend (con el rol de la pauta). */
export function aUsuario(dto) {
  if (!dto) return null;
  return {
    id: dto.id,
    nombre: dto.nombre,
    email: dto.email,
    rol: dto.rol,
    rolVisible: nombreRol(dto.rol),
    activo: dto.activo ?? true,
    creadoEn: dto.creadoEn ?? null,
  };
}

/** `SesionRespuesta` → `{ token, usuario }` con el usuario adaptado. */
export function aSesion(dto) {
  if (!dto) return null;
  return { token: dto.token, usuario: aUsuario(dto.usuario) };
}

/** Método de pago del formulario → enum `MetodoPago` del backend. */
export function aMetodoPago(valor) {
  const equivalencias = {
    webpay: "DEBITO",
    mach: "DEBITO",
    transferencia: "TRANSFERENCIA",
    debito: "DEBITO",
    credito: "CREDITO",
  };
  return equivalencias[String(valor ?? "").toLowerCase()] ?? "DEBITO";
}

/**
 * Campos del formulario de checkout → `DatosDespachoDto`.
 * El único renombre real es `email` → `correo`.
 */
export function aDatosDespacho(campos = {}) {
  return {
    nombre: campos.nombre ?? "",
    correo: campos.email ?? campos.correo ?? "",
    telefono: campos.telefono ?? "",
    region: campos.region ?? "",
    comuna: campos.comuna ?? "",
    direccion: campos.direccion ?? "",
    depto: campos.depto ?? null,
    indicaciones: campos.indicaciones ?? null,
  };
}

/** Carrito del frontend → líneas que espera el backend (`LineaSolicitud`). */
export function aLineasSolicitud(items = []) {
  return items.map((item) => ({
    productoId: item.id,
    cantidad: item.cantidad,
  }));
}

/**
 * `ValidacionCarritoDto` → resultado que consume la vista del carrito.
 * Mantiene `exito`/`mensaje` para no cambiar la forma en que se muestran los avisos.
 */
export function aValidacionCarrito(dto) {
  if (!dto) return null;
  const noDisponibles = (dto.lineas ?? []).filter((linea) => !linea.disponible);
  return {
    exito: dto.valido,
    mensaje:
      dto.mensajeCupon ??
      (noDisponibles.length > 0
        ? noDisponibles[0].mensaje
        : "Carrito validado contra el stock disponible."),
    lineas: (dto.lineas ?? []).map((linea) => ({
      productoId: linea.productoId,
      nombre: linea.nombre,
      precio: linea.precio,
      precioNormal: linea.precioNormal ?? null,
      stock: linea.stock,
      cantidad: linea.cantidad,
      disponible: linea.disponible,
      mensaje: linea.mensaje,
    })),
    cupon: dto.cupon ? aCupon(dto.cupon) : null,
    mensajeCupon: dto.mensajeCupon ?? null,
    subtotal: dto.subtotal ?? 0,
    descuento: dto.descuento ?? 0,
    total: dto.total ?? 0,
  };
}
