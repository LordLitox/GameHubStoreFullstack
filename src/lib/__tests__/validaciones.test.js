import { describe, it, expect } from "vitest";
import {
  validarNombre,
  validarEmail,
  validarTelefono,
  validarSelect,
  validarTextoSimple,
  validarFechaGarantia,
  validarDetalleGarantia,
} from "../validaciones.js";

describe("validarNombre", () => {
  it("acepta nombre y apellido", () => {
    expect(validarNombre("Ana Pérez").valido).toBe(true);
  });

  it("rechaza vacío", () => {
    const res = validarNombre("   ");
    expect(res.valido).toBe(false);
    expect(res.mensaje).toBe("El nombre completo es obligatorio.");
  });

  it("rechaza un solo nombre sin apellido", () => {
    expect(validarNombre("Ana").valido).toBe(false);
  });
});

describe("validarEmail", () => {
  it("acepta un correo válido", () => {
    expect(validarEmail("usuario@dominio.cl").valido).toBe(true);
  });

  it("rechaza formato inválido", () => {
    expect(validarEmail("usuario@").valido).toBe(false);
    expect(validarEmail("usuario-dominio.cl").valido).toBe(false);
  });
});

describe("validarTelefono", () => {
  it("acepta 9 dígitos comenzando en 9", () => {
    expect(validarTelefono("912345678").valido).toBe(true);
  });

  it("rechaza otros formatos", () => {
    expect(validarTelefono("812345678").valido).toBe(false);
    expect(validarTelefono("91234567").valido).toBe(false);
  });
});

describe("validarSelect y validarTextoSimple", () => {
  it("exige selección en los select", () => {
    const res = validarSelect("", "región");
    expect(res.valido).toBe(false);
    expect(res.mensaje).toContain("región");
  });

  it("exige mínimo 4 caracteres en textos simples", () => {
    expect(validarTextoSimple("abc", "dirección").valido).toBe(false);
    expect(validarTextoSimple("Av. Providencia 123", "dirección").valido).toBe(true);
  });
});

describe("validarFechaGarantia", () => {
  const hoy = new Date("2026-10-07");

  it("acepta una compra dentro de los 180 días", () => {
    expect(validarFechaGarantia("2026-09-07", hoy).valido).toBe(true);
  });

  it("rechaza fecha futura", () => {
    expect(validarFechaGarantia("2026-12-01", hoy).valido).toBe(false);
  });

  it("rechaza compras de más de 180 días", () => {
    const res = validarFechaGarantia("2026-01-01", hoy);
    expect(res.valido).toBe(false);
    expect(res.mensaje).toContain("180 días");
  });

  it("rechaza fecha vacía", () => {
    expect(validarFechaGarantia("", hoy).valido).toBe(false);
  });
});

describe("validarDetalleGarantia", () => {
  it("exige mínimo 20 caracteres", () => {
    expect(validarDetalleGarantia("corta").valido).toBe(false);
    expect(validarDetalleGarantia("El teclado dejó de responder algunas teclas del lado izquierdo").valido).toBe(true);
  });
});
