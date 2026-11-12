import {
  aCupon,
  aDatosDespacho,
  aLineasSolicitud,
  aMetodoPago,
  aOrdenDetalle,
  aOrdenResumen,
  aProducto,
  aResena,
  aUsuario,
  aValidacionCarrito,
  imagenProducto,
  nombreRol,
} from "../adaptadores.js";

/**
 * Adaptadores (EP3 · Parte 7): traducen los DTO del backend a la forma que ya
 * usan las vistas del frontend. Son funciones puras, así que se prueban sin red.
 */

describe("adaptadores de producto", () => {
  it("deriva la oferta comparando precio y precioNormal", () => {
    const producto = aProducto(
      { id: 1, nombre: "GPU", marca: "MSI", categoriaSlug: "tarjetas-graficas", precio: 800000, precioNormal: 1000000, imagen: "gpu", especificaciones: [] },
      4
    );

    expect(producto.precio).toBe(1000000); // precio de lista
    expect(producto.descuentoVigente).toEqual({ activo: true, porcentaje: 20 });
    expect(producto.destacado).toBe(true);
    expect(producto.stockDisponible).toBe(4);
  });

  it("no marca descuento cuando no hay precioNormal mayor", () => {
    const producto = aProducto({ id: 2, precio: 50000, precioNormal: null, categoriaSlug: "accesorios" });
    expect(producto.descuentoVigente.activo).toBe(false);
    expect(producto.destacado).toBe(false);
    expect(producto.precio).toBe(50000);
  });

  it("convierte la lista de especificaciones en un objeto", () => {
    const producto = aProducto({
      id: 3,
      precio: 1,
      categoriaSlug: "perifericos",
      especificaciones: [{ clave: "switch", valor: "Red" }, { clave: "color", valor: "Negro" }],
    });
    expect(producto.especificaciones).toEqual({ switch: "Red", color: "Negro" });
  });

  it("resuelve la imagen por clave, por categoría o devuelve una genérica", () => {
    expect(imagenProducto("teclado")).toBe("/assets/img/producto-teclado.jpg");
    expect(imagenProducto(null, "monitores")).toBe("/assets/img/producto-monitor.jpg");
    expect(imagenProducto("/ruta/ya-lista.jpg")).toBe("/ruta/ya-lista.jpg");
    expect(imagenProducto("desconocida", "sin-mapa")).toContain("/assets/img/");
  });
});

describe("adaptadores de orden y carrito", () => {
  it("aOrdenResumen expone la forma del historial", () => {
    const resumen = aOrdenResumen({ id: 5, numero: "GH-1", creadaEn: "2026-01-01", estado: "PAGADA", total: 1000, unidades: 2 });
    expect(resumen).toEqual({ id: 5, numero: "GH-1", fecha: "2026-01-01", estado: "PAGADA", total: 1000, unidades: 2 });
  });

  it("aOrdenDetalle adapta las líneas y conserva pago y despacho", () => {
    const orden = aOrdenDetalle({
      id: 5,
      numero: "GH-1",
      total: 1000,
      lineas: [{ productoId: 1, nombre: "Mouse", imagen: "mouse", precioUnitario: 500, cantidad: 2, subtotal: 1000 }],
      pago: { estado: "APROBADO" },
      despacho: { estado: "PREPARANDO" },
    });

    expect(orden.lineas[0].nombre).toBe("Mouse");
    expect(orden.pago.estado).toBe("APROBADO");
    expect(orden.despacho.estado).toBe("PREPARANDO");
  });

  it("aLineasSolicitud traduce el carrito a lo que espera el backend", () => {
    expect(aLineasSolicitud([{ id: 7, cantidad: 3, nombre: "x" }])).toEqual([
      { productoId: 7, cantidad: 3 },
    ]);
  });

  it("aMetodoPago mapea los medios del formulario al enum del backend", () => {
    expect(aMetodoPago("webpay")).toBe("DEBITO");
    expect(aMetodoPago("transferencia")).toBe("TRANSFERENCIA");
    expect(aMetodoPago("mach")).toBe("DEBITO");
    expect(aMetodoPago("")).toBe("DEBITO");
  });

  it("aDatosDespacho renombra email a correo", () => {
    const dto = aDatosDespacho({ nombre: "Ana", email: "ana@x.cl", telefono: "912345678" });
    expect(dto.correo).toBe("ana@x.cl");
    expect(dto.nombre).toBe("Ana");
  });

  it("aValidacionCarrito mantiene exito/mensaje que usa la vista", () => {
    const validacion = aValidacionCarrito({
      valido: false,
      lineas: [{ productoId: 1, disponible: false, mensaje: "Sin stock" }],
      subtotal: 0,
      descuento: 0,
      total: 0,
    });
    expect(validacion.exito).toBe(false);
    expect(validacion.mensaje).toBe("Sin stock");
  });
});

describe("adaptadores varios", () => {
  it("aCupon traduce tope y término", () => {
    const cupon = aCupon({ codigo: "X", porcentaje: 10, tope: 5000, termino: "2030-01-01", inicio: "2026-01-01" });
    expect(cupon.topeMaximo).toBe(5000);
    expect(cupon.expira).toBe("2030-01-01");
  });

  it("aResena usa autor, puntuación y comentario", () => {
    const resena = aResena({ id: 1, autor: "Ana", puntuacion: 4, comentario: "Bien", fecha: "2026-01-01", estado: "APROBADA" });
    expect(resena).toEqual({ id: 1, autor: "Ana", puntaje: 4, texto: "Bien", fecha: "2026-01-01", estado: "APROBADA" });
  });

  it("nombreRol traduce los enums del backend a los de la pauta", () => {
    expect(nombreRol("ADMIN")).toBe("Administrador");
    expect(nombreRol("OPERADOR")).toBe("Vendedor");
    expect(nombreRol("CLIENTE")).toBe("Cliente");
    expect(nombreRol(undefined)).toBe("");
  });

  it("aUsuario añade el rol visible", () => {
    const usuario = aUsuario({ id: 1, nombre: "Ana", email: "a@x.cl", rol: "OPERADOR" });
    expect(usuario.rolVisible).toBe("Vendedor");
    expect(usuario.activo).toBe(true);
  });
});
