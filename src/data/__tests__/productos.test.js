import {
  PRODUCTOS,
  CATEGORIAS,
  listarProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  restablecerProductos,
} from "../productos.js";

describe("CRUD de productos (fuente de datos simulada)", () => {
  const CANTIDAD_INICIAL = PRODUCTOS.length;

  beforeEach(() => restablecerProductos());
  afterEach(() => restablecerProductos());

  describe("Leer", () => {
    it("listarProductos devuelve todos los productos de la colección", () => {
      expect(listarProductos()).toHaveSize(CANTIDAD_INICIAL);
    });

    it("obtenerProductoPorId encuentra por id numérico y por string", () => {
      expect(obtenerProductoPorId(1).marca).toBe("Asus");
      expect(obtenerProductoPorId("1").id).toBe(1);
    });

    it("obtenerProductoPorId devuelve null cuando el id no existe", () => {
      expect(obtenerProductoPorId(9999)).toBeNull();
    });
  });

  describe("Crear", () => {
    it("agrega un producto con id autogenerado y lo deja consultable", () => {
      const res = crearProducto({
        nombre: "Webcam 4K Pro",
        marca: "Logitech",
        categoria: "accesorios",
        precio: 79990,
        stockDisponible: 3,
      });

      expect(res.exito).toBe(true);
      expect(res.producto.id).toBe(CANTIDAD_INICIAL + 1);
      expect(listarProductos()).toHaveSize(CANTIDAD_INICIAL + 1);
      expect(obtenerProductoPorId(res.producto.id).nombre).toBe("Webcam 4K Pro");
    });

    it("rechaza crear un producto sin nombre", () => {
      const res = crearProducto({ marca: "X", categoria: "consolas", precio: 1000 });
      expect(res.exito).toBe(false);
      expect(res.producto).toBeNull();
      expect(listarProductos()).toHaveSize(CANTIDAD_INICIAL);
    });

    it("rechaza una categoría que no existe en el catálogo", () => {
      const res = crearProducto({ nombre: "X", marca: "Y", categoria: "inventada", precio: 1000 });
      expect(res.exito).toBe(false);
    });

    it("rechaza un precio que no es número", () => {
      const res = crearProducto({ nombre: "X", marca: "Y", categoria: "consolas", precio: "gratis" });
      expect(res.exito).toBe(false);
    });

    it("expone las categorías válidas del catálogo", () => {
      expect(CATEGORIAS).toContain("consolas");
    });
  });

  describe("Actualizar", () => {
    it("modifica los campos indicados sin cambiar el id", () => {
      const res = actualizarProducto(1, { precio: 999990, stockDisponible: 20 });
      expect(res.exito).toBe(true);
      expect(res.producto.id).toBe(1);
      expect(obtenerProductoPorId(1).precio).toBe(999990);
      expect(obtenerProductoPorId(1).stockDisponible).toBe(20);
    });

    it("ignora un intento de cambiar el id", () => {
      actualizarProducto(1, { id: 500, nombre: "Renombrado" });
      expect(obtenerProductoPorId(1)).not.toBeNull();
      expect(obtenerProductoPorId(500)).toBeNull();
    });

    it("rechaza actualizar un id inexistente", () => {
      const res = actualizarProducto(9999, { precio: 1 });
      expect(res.exito).toBe(false);
      expect(res.producto).toBeNull();
    });

    it("rechaza un cambio que dejaría datos inválidos y no toca el original", () => {
      const res = actualizarProducto(1, { precio: -5 });
      expect(res.exito).toBe(false);
      expect(obtenerProductoPorId(1).precio).toBe(1499990);
    });
  });

  describe("Eliminar", () => {
    it("quita el producto de la colección", () => {
      const res = eliminarProducto(1);
      expect(res.exito).toBe(true);
      expect(res.producto.id).toBe(1);
      expect(obtenerProductoPorId(1)).toBeNull();
      expect(listarProductos()).toHaveSize(CANTIDAD_INICIAL - 1);
    });

    it("rechaza eliminar un id inexistente", () => {
      expect(eliminarProducto(9999).exito).toBe(false);
    });
  });

  it("restablecerProductos vuelve al estado inicial", () => {
    crearProducto({ nombre: "X", marca: "Y", categoria: "consolas", precio: 1 });
    eliminarProducto(1);
    restablecerProductos();
    expect(listarProductos()).toHaveSize(CANTIDAD_INICIAL);
    expect(obtenerProductoPorId(1)).not.toBeNull();
  });
});
