/**
 * Reglas de negocio del carrito (funciones puras, sin DOM ni localStorage).
 * Migradas desde la sección 2 de legacy/js/app.js para poder testearlas
 * con Vitest y reutilizarlas desde cualquier componente React.
 *
 * Todas reciben el carrito como argumento y devuelven un nuevo array
 * (inmutabilidad), sin modificar el original.
 */

export function validarStock(producto, cantidadDeseada) {
  if (!producto || typeof producto.stockDisponible !== "number") return false;
  if (producto.stockDisponible <= 0) return false;
  return cantidadDeseada <= producto.stockDisponible;
}

export function precioFinalProducto(producto) {
  return producto.descuentoVigente.activo
    ? Math.round(producto.precio * (1 - producto.descuentoVigente.porcentaje / 100))
    : producto.precio;
}

export function agregarAlCarrito(carrito, productos, idProducto, cantidad = 1) {
  const producto = productos.find((p) => p.id === idProducto);
  if (!producto) {
    return { carrito, exito: false, mensaje: "El producto seleccionado no existe." };
  }

  if (producto.stockDisponible <= 0) {
    return { carrito, exito: false, mensaje: "Producto sin stock disponible." };
  }

  const indice = carrito.findIndex((item) => item.id === idProducto);
  const cantidadActual = indice !== -1 ? carrito[indice].cantidad : 0;
  const nuevaCantidad = cantidadActual + cantidad;

  if (!validarStock(producto, nuevaCantidad)) {
    return {
      carrito,
      exito: false,
      mensaje: `No es posible agregar más unidades. Stock disponible: ${producto.stockDisponible}.`,
    };
  }

  const nuevoCarrito = [...carrito];
  if (indice !== -1) {
    nuevoCarrito[indice] = { ...nuevoCarrito[indice], cantidad: nuevaCantidad };
  } else {
    nuevoCarrito.push({
      id: producto.id,
      nombre: producto.nombre,
      marca: producto.marca,
      categoria: producto.categoria,
      precio: precioFinalProducto(producto),
      precioOriginal: producto.precio,
      imagen: producto.imagen,
      stockDisponible: producto.stockDisponible,
      cantidad: nuevaCantidad,
    });
  }

  return {
    carrito: nuevoCarrito,
    exito: true,
    mensaje: `"${producto.nombre}" agregado al carrito.`,
  };
}

export function quitarLinea(carrito, idProducto) {
  return carrito.filter((item) => item.id !== idProducto);
}

/**
 * Cambia la cantidad de una línea (botones +/- del carrito).
 * Cantidad 0 o menor elimina la línea.
 */
export function cambiarCantidad(carrito, productos, idProducto, cantidad) {
  if (cantidad <= 0) {
    return {
      carrito: quitarLinea(carrito, idProducto),
      exito: true,
      mensaje: "Producto eliminado del carrito.",
    };
  }

  const producto = productos.find((p) => p.id === idProducto);
  if (!producto) {
    return { carrito, exito: false, mensaje: "El producto seleccionado no existe." };
  }

  if (!validarStock(producto, cantidad)) {
    return {
      carrito,
      exito: false,
      mensaje: `No es posible agregar más unidades. Stock disponible: ${producto.stockDisponible}.`,
    };
  }

  return {
    carrito: carrito.map((item) => (item.id === idProducto ? { ...item, cantidad } : item)),
    exito: true,
    mensaje: "Cantidad actualizada.",
  };
}

export function contarItems(carrito) {
  return carrito.reduce((acumulado, item) => acumulado + item.cantidad, 0);
}
