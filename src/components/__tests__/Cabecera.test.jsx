import { fireEvent, screen } from "@testing-library/react";
import Cabecera from "../Cabecera.jsx";
import {
  CLAVE_CARRITO,
  mockLocalStorage,
  renderConProveedores,
} from "../../__tests__/ayudas/render.jsx";

/**
 * Cabecera: contador de unidades del carrito y menú móvil. El contador lee el
 * estado global del CarritoContext, por lo que se precarga localStorage con el
 * mock para simular un carrito ya armado.
 */

const ITEM_NOTEBOOK = {
  id: 1,
  nombre: "Notebook Gamer Asus ROG Strix G16",
  marca: "Asus",
  precio: 1349991,
  imagen: "/assets/img/producto-teclado.jpg",
  stockDisponible: 5,
  cantidad: 2,
};

describe("Cabecera (contador del carrito y menú)", () => {
  it("muestra 0 unidades cuando el carrito está vacío", () => {
    renderConProveedores(<Cabecera />);

    expect(screen.getByText("0")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Ver carrito de compras, 0 productos" })
    ).toBeTruthy();
  });

  it("suma las cantidades del carrito guardado en localStorage", () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [ITEM_NOTEBOOK]);

    renderConProveedores(<Cabecera />, { almacen });

    expect(screen.getByText("2")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Ver carrito de compras, 2 productos" })
    ).toBeTruthy();
  });

  it("usa el singular cuando hay exactamente una unidad", () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [{ ...ITEM_NOTEBOOK, cantidad: 1 }]);

    renderConProveedores(<Cabecera />, { almacen });

    expect(
      screen.getByRole("link", { name: "Ver carrito de compras, 1 producto" })
    ).toBeTruthy();
  });

  it("abre y cierra el menú móvil cambiando el DOM y aria-expanded", () => {
    const { container } = renderConProveedores(<Cabecera />);

    const botonMenu = screen.getByRole("button", { name: /Menú/ });
    const nav = container.querySelector("#navPrincipal");
    expect(botonMenu.getAttribute("aria-expanded")).toBe("false");
    expect(nav.classList.contains("esta-abierto")).toBe(false);

    fireEvent.click(botonMenu);
    expect(botonMenu.getAttribute("aria-expanded")).toBe("true");
    expect(nav.classList.contains("esta-abierto")).toBe(true);

    fireEvent.click(botonMenu);
    expect(botonMenu.getAttribute("aria-expanded")).toBe("false");
    expect(nav.classList.contains("esta-abierto")).toBe(false);
  });

  it("marca con aria-current el enlace de la sección activa", () => {
    renderConProveedores(<Cabecera />, { ruta: "/catalogo" });

    const enlaceCatalogo = screen.getByRole("link", { name: "Catálogo" });
    expect(enlaceCatalogo.getAttribute("aria-current")).toBe("page");
    expect(
      screen.getByRole("link", { name: "Inicio" }).getAttribute("aria-current")
    ).toBeNull();
  });
});
