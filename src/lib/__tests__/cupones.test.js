import { describe, it, expect } from "vitest";
import { cuponVigente, buscarCupon, aplicarCupon, calcularTotales } from "../cupones.js";

const CUPONES = [
  { codigo: "GAMEHUB20", porcentaje: 20, topeMaximo: 50000, expira: "2099-12-31" },
  { codigo: "EXPIRADO10", porcentaje: 10, topeMaximo: 20000, expira: "2020-01-01" },
];

describe("cuponVigente", () => {
  it("acepta cupones cuya fecha de expiración aún no llega", () => {
    expect(cuponVigente(CUPONES[0], new Date("2026-10-07"))).toBe(true);
  });

  it("rechaza cupones expirados", () => {
    expect(cuponVigente(CUPONES[1], new Date("2026-10-07"))).toBe(false);
  });

  it("rechaza valores nulos o sin fecha", () => {
    expect(cuponVigente(null)).toBe(false);
    expect(cuponVigente({ codigo: "X" })).toBe(false);
  });
});

describe("buscarCupon", () => {
  it("encuentra el cupón ignorando mayúsculas y espacios", () => {
    expect(buscarCupon(CUPONES, "  gamehub20 ").codigo).toBe("GAMEHUB20");
  });

  it("devuelve null para códigos vacíos o inexistentes", () => {
    expect(buscarCupon(CUPONES, "")).toBeNull();
    expect(buscarCupon(CUPONES, "NOEXISTE")).toBeNull();
  });
});

describe("aplicarCupon", () => {
  it("aplica un cupón válido y lo devuelve", () => {
    const res = aplicarCupon(CUPONES, "GAMEHUB20", new Date("2026-10-07"));
    expect(res.exito).toBe(true);
    expect(res.cupon.codigo).toBe("GAMEHUB20");
  });

  it("rechaza el código vacío", () => {
    const res = aplicarCupon(CUPONES, "   ");
    expect(res.exito).toBe(false);
    expect(res.mensaje).toBe("Debes ingresar un código de cupón.");
  });

  it("rechaza cupones inexistentes", () => {
    const res = aplicarCupon(CUPONES, "INVENTADO50");
    expect(res.exito).toBe(false);
    expect(res.mensaje).toContain("no existe");
  });

  it("rechaza cupones expirados", () => {
    const res = aplicarCupon(CUPONES, "EXPIRADO10", new Date("2026-10-07"));
    expect(res.exito).toBe(false);
    expect(res.mensaje).toBe("El cupón ha expirado.");
  });
});

describe("calcularTotales", () => {
  const carrito = [{ precio: 300000, cantidad: 2 }]; // subtotal 600000

  it("sin cupón el total es el subtotal", () => {
    const totales = calcularTotales(carrito, null);
    expect(totales).toEqual({ subtotal: 600000, descuento: 0, total: 600000 });
  });

  it("aplica el porcentaje del cupón respetando el tope máximo", () => {
    // 20% de 600000 = 120000, pero el tope es 50000
    const totales = calcularTotales(carrito, CUPONES[0], new Date("2026-10-07"));
    expect(totales.descuento).toBe(50000);
    expect(totales.total).toBe(550000);
  });

  it("ignora cupones expirados", () => {
    const totales = calcularTotales(carrito, CUPONES[1], new Date("2026-10-07"));
    expect(totales.descuento).toBe(0);
  });

  it("con carrito vacío todo es cero", () => {
    const totales = calcularTotales([], CUPONES[0]);
    expect(totales).toEqual({ subtotal: 0, descuento: 0, total: 0 });
  });

  it("el total nunca es negativo", () => {
    const carritoChico = [{ precio: 1000, cantidad: 1 }];
    const totales = calcularTotales(carritoChico, CUPONES[0], new Date("2026-10-07"));
    expect(totales.total).toBeGreaterThanOrEqual(0);
  });
});
