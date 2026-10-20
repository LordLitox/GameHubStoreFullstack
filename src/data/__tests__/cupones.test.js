import {
  CUPONES,
  listarCupones,
  obtenerCuponPorCodigo,
  crearCupon,
  actualizarCupon,
  eliminarCupon,
  restablecerCupones,
} from "../cupones.js";

describe("CRUD de cupones (fuente de datos simulada)", () => {
  const CANTIDAD_INICIAL = CUPONES.length;

  beforeEach(() => restablecerCupones());
  afterEach(() => restablecerCupones());

  describe("Leer", () => {
    it("listarCupones devuelve todos los cupones", () => {
      expect(listarCupones()).toHaveSize(CANTIDAD_INICIAL);
    });

    it("obtenerCuponPorCodigo ignora mayúsculas y espacios", () => {
      expect(obtenerCuponPorCodigo("  gamehub20 ").codigo).toBe("GAMEHUB20");
    });

    it("obtenerCuponPorCodigo devuelve null si no existe", () => {
      expect(obtenerCuponPorCodigo("NOEXISTE")).toBeNull();
    });
  });

  describe("Crear", () => {
    it("agrega un cupón válido y normaliza el código a mayúsculas", () => {
      const res = crearCupon({
        codigo: "nuevo15",
        porcentaje: 15,
        topeMaximo: 30000,
        expira: "2099-01-01",
      });
      expect(res.exito).toBe(true);
      expect(res.cupon.codigo).toBe("NUEVO15");
      expect(listarCupones()).toHaveSize(CANTIDAD_INICIAL + 1);
    });

    it("rechaza un código duplicado", () => {
      const res = crearCupon({ codigo: "GAMEHUB20", porcentaje: 5, topeMaximo: 1000, expira: "2099-01-01" });
      expect(res.exito).toBe(false);
    });

    it("rechaza un porcentaje fuera de rango", () => {
      const res = crearCupon({ codigo: "MALO", porcentaje: 150, topeMaximo: 1000, expira: "2099-01-01" });
      expect(res.exito).toBe(false);
    });

    it("rechaza una fecha de expiración inválida", () => {
      const res = crearCupon({ codigo: "MALO", porcentaje: 10, topeMaximo: 1000, expira: "no-es-fecha" });
      expect(res.exito).toBe(false);
    });
  });

  describe("Actualizar", () => {
    it("modifica campos sin cambiar el código", () => {
      const res = actualizarCupon("GAMEHUB20", { porcentaje: 25 });
      expect(res.exito).toBe(true);
      expect(res.cupon.codigo).toBe("GAMEHUB20");
      expect(obtenerCuponPorCodigo("GAMEHUB20").porcentaje).toBe(25);
    });

    it("rechaza actualizar un cupón inexistente", () => {
      expect(actualizarCupon("NOEXISTE", { porcentaje: 5 }).exito).toBe(false);
    });
  });

  describe("Eliminar", () => {
    it("quita el cupón de la colección", () => {
      const res = eliminarCupon("BIENVENIDO10");
      expect(res.exito).toBe(true);
      expect(obtenerCuponPorCodigo("BIENVENIDO10")).toBeNull();
      expect(listarCupones()).toHaveSize(CANTIDAD_INICIAL - 1);
    });

    it("rechaza eliminar un cupón inexistente", () => {
      expect(eliminarCupon("NOEXISTE").exito).toBe(false);
    });
  });
});
