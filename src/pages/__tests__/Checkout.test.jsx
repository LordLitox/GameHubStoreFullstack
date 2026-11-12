import { fireEvent, screen } from "@testing-library/react";
import { Route } from "react-router-dom";
import Checkout from "../Checkout.jsx";
import {
  CLAVE_CARRITO,
  mockAlert,
  mockLocalStorage,
  renderConRutas,
} from "../../__tests__/ayudas/render.jsx";
import { esperarHasta, simularFetch } from "../../__tests__/ayudas/api.js";

/**
 * Página Checkout: validación en vivo del formulario y creación real de la
 * orden. Desde la EP3 · Parte 6 la orden la crea order-service: el Gateway se
 * simula y la prueba espera la respuesta asíncrona. `window.alert` está
 * mockeado para observar el aviso sin abrir diálogos.
 */

const NOMBRE_PRODUCTO = "Notebook Gamer Asus ROG Strix G16";

/** Respuesta de `POST /ordenes`: la orden con su pago aprobado. */
function ordenCreadaDto(overrides = {}) {
  return {
    id: 20,
    numero: "GH-2026-000020",
    creadaEn: "2026-09-02T10:00:00",
    estado: "PAGADA",
    subtotal: 100000,
    descuento: 0,
    total: 100000,
    lineas: [],
    pago: { estado: "APROBADO" },
    despacho: null,
    ...overrides,
  };
}

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
  let api;

  beforeEach(() => {
    alerta = mockAlert();
    // El Gateway simulado responde la creación de la orden con un pago aprobado.
    api = simularFetch();
    api.responder("POST", "/ordenes", ordenCreadaDto());
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

  it("crea la orden en el backend, avisa al usuario, vacía el carrito y navega a /ordenes", async () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [lineaGuardada()]);
    renderCheckout(almacen);

    completarFormulario();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar y Pagar Orden" }));

    // La orden la confirma el servidor: se espera a que llegue la navegación.
    await esperarHasta(() => screen.queryByText("Página de órdenes"));

    // Se envió la orden con las líneas del carrito y el método de pago mapeado.
    expect(api.ultimaLlamada().metodo).toBe("POST");
    expect(api.ultimaLlamada().ruta).toBe("/ordenes");
    expect(api.ultimaLlamada().cuerpo.lineas).toEqual([{ productoId: 1, cantidad: 1 }]);
    expect(api.ultimaLlamada().cuerpo.metodoPago).toBe("DEBITO");

    expect(alerta).toHaveBeenCalledTimes(1);
    const mensaje = alerta.calls.mostRecent().args[0];
    expect(mensaje).toContain("¡Orden confirmada exitosamente!");
    expect(mensaje).toContain("Número: GH-2026-000020");
    expect(mensaje).toContain("ana@ejemplo.cl");

    expect(almacen.leer(CLAVE_CARRITO)).toEqual([]);
  });

  it("muestra el mensaje del backend si la orden no se puede crear (stock)", async () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [lineaGuardada()]);
    api.responderConError("POST", "/ordenes", 400, {
      mensaje: "No hay stock suficiente para completar la compra.",
    });
    renderCheckout(almacen);

    completarFormulario();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar y Pagar Orden" }));

    await esperarHasta(() => screen.queryByRole("alert")?.textContent.includes("No hay stock suficiente"));
    expect(screen.getByRole("alert").textContent).toContain("No hay stock suficiente");
    // El carrito NO se vacía cuando la orden no se pudo crear.
    expect(almacen.leer(CLAVE_CARRITO).length).toBe(1);
  });
});
