import { fireEvent, screen } from "@testing-library/react";
import { Route } from "react-router-dom";
import Checkout from "../Checkout.jsx";
import {
  CLAVE_CARRITO,
  mockAlert,
  mockLocalStorage,
  renderConRutas,
} from "../../__tests__/ayudas/render.jsx";

/**
 * Página Checkout: validación en vivo del formulario y confirmación de la
 * orden. Math.random y window.alert están mockeados para que el resultado sea
 * determinista.
 */

const NOMBRE_PRODUCTO = "Notebook Gamer Asus ROG Strix G16";

function lineaGuardada() {
  return {
    id: 1,
    nombre: NOMBRE_PRODUCTO,
    marca: "Asus",
    precio: 100000,
    imagen: "/assets/img/producto-teclado.jpg",
    stockDisponible: 5,
    cantidad: 1,
  };
}

function renderCheckout(almacen) {
  return renderConRutas(
    [
      <Route key="checkout" path="/checkout" element={<Checkout />} />,
      <Route key="ordenes" path="/ordenes" element={<p>Página de órdenes</p>} />,
    ],
    { ruta: "/checkout", almacen }
  );
}

function escribir(etiqueta, valor) {
  const campo = screen.getByLabelText(etiqueta);
  fireEvent.change(campo, { target: { value: valor } });
  return campo;
}

function completarFormulario() {
  escribir("Nombre y Apellido *", "Ana Pérez");
  escribir("Correo Electrónico *", "ana@ejemplo.cl");
  escribir("Teléfono Móvil (Chile) *", "912345678");
  escribir("Región *", "metropolitana");
  escribir("Comuna *", "Maipú");
  escribir("Dirección exacta y número (o depto) *", "Av. Providencia 1234");
  escribir("Método de pago *", "webpay");
}

describe("Checkout", () => {
  let alerta;

  beforeEach(() => {
    alerta = mockAlert();
  });

  it("avisa y bloquea el envío cuando el carrito está vacío", () => {
    mockLocalStorage();
    renderCheckout();

    expect(screen.getByRole("alert").textContent).toContain("Tu carrito está vacío.");
    expect(screen.getByRole("button", { name: "Confirmar y Pagar Orden" }).disabled).toBe(true);
  });

  it("valida un campo al salir de él y marca aria-invalid", () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [lineaGuardada()]);
    renderCheckout(almacen);

    const campoNombre = escribir("Nombre y Apellido *", "Ana");
    fireEvent.blur(campoNombre);

    expect(screen.getByRole("alert").textContent).toContain(
      "Ingresa al menos nombre y apellido válidos."
    );
    expect(campoNombre.getAttribute("aria-invalid")).toBe("true");
  });

  it("revalida en vivo: al corregir el campo el error desaparece del DOM", () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [lineaGuardada()]);
    renderCheckout(almacen);

    const campoNombre = escribir("Nombre y Apellido *", "Ana");
    fireEvent.blur(campoNombre);
    expect(campoNombre.getAttribute("aria-invalid")).toBe("true");

    escribir("Nombre y Apellido *", "Ana Pérez");

    expect(screen.queryByText("Ingresa al menos nombre y apellido válidos.")).toBeNull();
    expect(screen.getByLabelText("Nombre y Apellido *").getAttribute("aria-invalid")).toBeNull();
  });

  it("valida el formato del correo y del teléfono", () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [lineaGuardada()]);
    renderCheckout(almacen);

    fireEvent.blur(escribir("Correo Electrónico *", "ana@sin-dominio"));
    expect(screen.getByRole("alert").textContent).toContain("Formato de correo no válido");

    fireEvent.blur(escribir("Teléfono Móvil (Chile) *", "12345"));
    expect(screen.getByText("Debe tener exactamente 9 dígitos y comenzar en 9.")).toBeTruthy();
  });

  it("al enviar un formulario incompleto marca todos los campos y no confirma nada", () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [lineaGuardada()]);
    renderCheckout(almacen);

    fireEvent.click(screen.getByRole("button", { name: "Confirmar y Pagar Orden" }));

    const camposInvalidos = document.querySelectorAll(
      "#formulario-checkout [aria-invalid='true']"
    );
    expect(camposInvalidos.length).toBe(7);
    expect(alerta).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nombre y Apellido *")).toBeTruthy();
  });

  it("confirma la orden, avisa al usuario, vacía el carrito y navega a /ordenes", () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [lineaGuardada()]);
    renderCheckout(almacen);

    // Número de orden determinista: Math.floor(100000 + 0.123456 * 900000) = 211110.
    spyOn(Math, "random").and.returnValue(0.123456);

    completarFormulario();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar y Pagar Orden" }));

    expect(alerta).toHaveBeenCalledTimes(1);
    const mensaje = alerta.calls.mostRecent().args[0];
    expect(mensaje).toContain("¡Orden confirmada exitosamente!");
    expect(mensaje).toContain("Número: GH-211110");
    expect(mensaje).toContain("Total pagado: $100.000");
    expect(mensaje).toContain("ana@ejemplo.cl");

    expect(screen.getByText("Página de órdenes")).toBeTruthy();
    expect(almacen.leer(CLAVE_CARRITO)).toEqual([]);
  });
});
