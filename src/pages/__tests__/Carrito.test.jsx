import { fireEvent, screen, within } from "@testing-library/react";
import Carrito from "../Carrito.jsx";
import {
  CLAVE_CARRITO,
  CLAVE_CUPON,
  mockLocalStorage,
  renderConProveedores,
} from "../../__tests__/ayudas/render.jsx";
import { cuponDto, esperarHasta, simularFetch } from "../../__tests__/ayudas/api.js";

/**
 * Página Carrito: estado vacío, tabla de líneas, control de cantidades,
 * cupones y totales. La tabla se manipula con clicks reales sobre el DOM.
 *
 * EP3 · Parte 7: el cupón ahora se valida en promotion-service, así que el
 * Gateway se simula y las pruebas de cupón esperan la respuesta asíncrona.
 */

const NOMBRE = "Notebook Gamer Asus ROG Strix G16";

function lineaGuardada(cantidad, precio = 100000) {
  return {
    id: 1,
    nombre: NOMBRE,
    marca: "Asus",
    precio,
    imagen: "/assets/img/producto-teclado.jpg",
    stockDisponible: 5,
    cantidad,
  };
}

function renderCarrito(almacen, ruta = "/carrito") {
  return renderConProveedores(<Carrito />, { ruta, almacen });
}

describe("Carrito", () => {
  beforeEach(() => {
    // El cupón se valida en el Gateway simulado; el catálogo cae a la semilla.
    const api = simularFetch();
    api.responder("GET", "/promociones/validar", (opciones) =>
      /NOEXISTE/i.test(opciones.url)
        ? { status: 404, cuerpo: { mensaje: "El cupón no existe o no es válido." } }
        : { status: 200, cuerpo: cuponDto() }
    );
  });

  it("muestra el estado vacío con el enlace al catálogo", () => {
    mockLocalStorage();
    renderCarrito();

    expect(screen.getByText("Tu carrito está actualmente vacío.", { exact: false })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Explorar catálogo" })).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("lista las líneas guardadas con su cantidad y subtotal", () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [lineaGuardada(2, 50000)]);

    const { container } = renderCarrito(almacen);

    const fila = within(screen.getByRole("table")).getAllByRole("row")[1];
    expect(within(fila).getByText(NOMBRE)).toBeTruthy();
    expect(within(fila).getByText("2")).toBeTruthy();
    expect(within(fila).getByText("$50.000")).toBeTruthy();
    // Subtotal de la línea: $50.000 x 2 unidades.
    expect(within(fila).getByText("$100.000")).toBeTruthy();

    expect(container.textContent).toContain("Total a Pagar:");
    expect(container.textContent).toContain("$100.000");
  });

  it("suma y resta unidades actualizando el DOM y el carrito persistido", () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [lineaGuardada(1, 100000)]);
    renderCarrito(almacen);

    fireEvent.click(screen.getByRole("button", { name: `Sumar una unidad de ${NOMBRE}` }));

    const fila = within(screen.getByRole("table")).getAllByRole("row")[1];
    expect(within(fila).getByText("2")).toBeTruthy();
    expect(within(fila).getByText("$200.000")).toBeTruthy();
    expect(almacen.leer(CLAVE_CARRITO)[0].cantidad).toBe(2);

    fireEvent.click(screen.getByRole("button", { name: `Restar una unidad de ${NOMBRE}` }));

    expect(almacen.leer(CLAVE_CARRITO)[0].cantidad).toBe(1);
  });

  it("quitar una línea vuelve al estado vacío", () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [lineaGuardada(1)]);
    renderCarrito(almacen);

    fireEvent.click(screen.getByRole("button", { name: "Quitar" }));

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByRole("link", { name: "Explorar catálogo" })).toBeTruthy();
    expect(almacen.leer(CLAVE_CARRITO)).toEqual([]);
  });

  it("informa el error cuando el cupón no existe", async () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [lineaGuardada(1)]);
    renderCarrito(almacen);

    fireEvent.change(screen.getByLabelText("Cupón de descuento:"), {
      target: { value: "NOEXISTE" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    await esperarHasta(() =>
      screen.queryByText(/El cupón no existe o no es válido\./)
    );
    expect(screen.getByRole("alert").textContent).toContain("El cupón no existe o no es válido.");
    expect(almacen.leer(CLAVE_CUPON)).toBeNull();
  });

  it("aplica un cupón vigente y descuenta el total", async () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [lineaGuardada(1, 100000)]);
    const { container } = renderCarrito(almacen);

    fireEvent.change(screen.getByLabelText("Cupón de descuento:"), {
      target: { value: "gamehub20" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    await esperarHasta(() => screen.queryByText("GAMEHUB20 (20% dscto activo)"));
    expect(screen.getByRole("alert").textContent).toContain("aplicado con éxito");
    expect(almacen.leer(CLAVE_CUPON).codigo).toBe("GAMEHUB20");

    // El input se limpia cuando el cupón se aplica.
    expect(screen.getByLabelText("Cupón de descuento:").value).toBe("");

    // Totales: subtotal $100.000, descuento 20% = $20.000, total $80.000.
    expect(container.textContent).toContain("-$20.000");
    expect(container.textContent).toContain("$80.000");

    fireEvent.click(screen.getByRole("button", { name: "Quitar cupón aplicado" }));
    expect(almacen.leer(CLAVE_CUPON)).toBeNull();
  });

  it("vaciar el carrito deja el estado vacío y limpia el cupón", () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [lineaGuardada(3)]);
    almacen.precargar(CLAVE_CUPON, { codigo: "GAMEHUB20", porcentaje: 20, topeMaximo: 50000 });
    renderCarrito(almacen);

    fireEvent.click(screen.getByRole("button", { name: "Vaciar carrito" }));

    expect(screen.queryByRole("table")).toBeNull();
    expect(almacen.leer(CLAVE_CARRITO)).toEqual([]);
    expect(window.localStorage.removeItem).toHaveBeenCalledWith(CLAVE_CUPON);
  });
});
