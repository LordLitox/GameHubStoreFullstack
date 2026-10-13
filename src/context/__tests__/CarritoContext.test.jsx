import { fireEvent, render, screen } from "@testing-library/react";
import { CarritoProvider, useCarrito } from "../CarritoContext.jsx";
import { PRODUCTOS } from "../../data/productos.js";
import {
  CLAVE_CARRITO,
  CLAVE_CUPON,
  mockLocalStorage,
} from "../../__tests__/ayudas/render.jsx";

/**
 * CarritoContext: estado global (reducer) y su sincronización con
 * localStorage. Se ejercita mediante una sonda que expone la API del contexto
 * en el DOM, igual que lo haría una página.
 */

const PRODUCTO_CON_STOCK = PRODUCTOS.find((p) => p.stockDisponible > 0);

/** Línea de carrito ya guardada, como la deja el sitio en localStorage. */
function lineaGuardada(cantidad, precio = 100000) {
  return {
    id: PRODUCTO_CON_STOCK.id,
    nombre: PRODUCTO_CON_STOCK.nombre,
    marca: PRODUCTO_CON_STOCK.marca,
    precio,
    imagen: PRODUCTO_CON_STOCK.imagen,
    stockDisponible: PRODUCTO_CON_STOCK.stockDisponible,
    cantidad,
  };
}

const CUPON_VALIDO = {
  codigo: "GAMEHUB20",
  porcentaje: 20,
  topeMaximo: 50000,
  expira: "2099-12-31",
};

function SondaCarrito() {
  const {
    items,
    cupon,
    totalItems,
    totales,
    agregar,
    cambiarCantidad,
    aplicarCupon,
    quitarCupon,
    vaciar,
  } = useCarrito();

  return (
    <div>
      <output data-testid="total-items">{totalItems}</output>
      <output data-testid="items">
        {items.map((item) => `${item.id}x${item.cantidad}`).join(",")}
      </output>
      <output data-testid="subtotal">{totales.subtotal}</output>
      <output data-testid="descuento">{totales.descuento}</output>
      <output data-testid="total">{totales.total}</output>
      <output data-testid="cupon">{cupon ? cupon.codigo : "sin-cupon"}</output>

      <button type="button" onClick={() => agregar(PRODUCTO_CON_STOCK.id, 2)}>
        agregar dos
      </button>
      <button type="button" onClick={() => cambiarCantidad(PRODUCTO_CON_STOCK.id, 99)}>
        cantidad excesiva
      </button>
      <button type="button" onClick={() => aplicarCupon("GAMEHUB20")}>
        cupón válido
      </button>
      <button type="button" onClick={() => aplicarCupon("NOEXISTE")}>
        cupón inválido
      </button>
      <button type="button" onClick={quitarCupon}>
        quitar cupón
      </button>
      <button type="button" onClick={vaciar}>
        vaciar
      </button>
    </div>
  );
}

/**
 * Sonda que usa useCarrito fuera del provider y deja el mensaje del error en
 * el DOM. El try/catch es del propio componente: así el error no escapa a React
 * y la prueba queda determinista (sin error global del navegador).
 */
function SondaSinProvider() {
  let mensaje = null;
  try {
    useCarrito();
  } catch (error) {
    mensaje = error.message;
  }
  return <p>{mensaje}</p>;
}

function renderSonda() {
  return render(
    <CarritoProvider>
      <SondaCarrito />
    </CarritoProvider>
  );
}

function valorDe(id) {
  return screen.getByTestId(id).textContent;
}

function pulsar(nombre) {
  fireEvent.click(screen.getByRole("button", { name: nombre }));
}

describe("CarritoContext", () => {
  it("exige estar dentro del provider", () => {
    render(<SondaSinProvider />);

    expect(
      screen.getByText(/useCarrito debe usarse dentro de <CarritoProvider>/)
    ).toBeTruthy();
  });

  it("parte vacío cuando localStorage no tiene nada guardado", () => {
    mockLocalStorage();
    renderSonda();

    expect(valorDe("total-items")).toBe("0");
    expect(valorDe("items")).toBe("");
    expect(valorDe("cupon")).toBe("sin-cupon");
  });

  it("recupera el carrito y el cupón guardados (claves del sitio legacy)", () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [lineaGuardada(2)]);
    almacen.precargar(CLAVE_CUPON, CUPON_VALIDO);

    renderSonda();

    expect(valorDe("total-items")).toBe("2");
    expect(valorDe("cupon")).toBe("GAMEHUB20");
    expect(valorDe("subtotal")).toBe("200000");
    expect(valorDe("descuento")).toBe("40000");
    expect(valorDe("total")).toBe("160000");
  });

  it("ignora un localStorage corrupto y arranca con el carrito vacío", () => {
    spyOn(window.localStorage, "getItem").and.returnValue("{no-es-json");
    spyOn(window.localStorage, "setItem").and.stub();

    renderSonda();

    expect(valorDe("total-items")).toBe("0");
    expect(valorDe("cupon")).toBe("sin-cupon");
  });

  it("agrega productos, recalcula totales y persiste el carrito", () => {
    const almacen = mockLocalStorage();
    renderSonda();

    pulsar("agregar dos");

    expect(valorDe("total-items")).toBe("2");
    expect(valorDe("items")).toBe(`${PRODUCTO_CON_STOCK.id}x2`);

    const guardado = almacen.leer(CLAVE_CARRITO);
    expect(guardado.length).toBe(1);
    expect(guardado[0].cantidad).toBe(2);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      CLAVE_CARRITO,
      JSON.stringify(guardado)
    );
  });

  it("rechaza cantidades sobre el stock sin modificar el estado", () => {
    mockLocalStorage();
    renderSonda();

    pulsar("agregar dos");
    pulsar("cantidad excesiva");

    expect(valorDe("items")).toBe(`${PRODUCTO_CON_STOCK.id}x2`);
    expect(valorDe("total-items")).toBe("2");
  });

  it("aplica un cupón vigente y lo persiste", () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [lineaGuardada(2)]);
    renderSonda();

    pulsar("cupón válido");

    expect(valorDe("cupon")).toBe("GAMEHUB20");
    expect(valorDe("descuento")).toBe("40000");
    expect(valorDe("total")).toBe("160000");
    expect(almacen.leer(CLAVE_CUPON).codigo).toBe("GAMEHUB20");
  });

  it("descarta un cupón inválido y borra el guardado", () => {
    mockLocalStorage();
    renderSonda();

    pulsar("cupón inválido");

    expect(valorDe("cupon")).toBe("sin-cupon");
    expect(window.localStorage.removeItem).toHaveBeenCalledWith(CLAVE_CUPON);
  });

  it("quitar el cupón vuelve a los totales sin descuento", () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [lineaGuardada(1)]);
    almacen.precargar(CLAVE_CUPON, CUPON_VALIDO);
    renderSonda();

    expect(valorDe("total")).toBe("80000");

    pulsar("quitar cupón");

    expect(valorDe("cupon")).toBe("sin-cupon");
    expect(valorDe("descuento")).toBe("0");
    expect(valorDe("total")).toBe("100000");
  });

  it("vaciar deja el carrito y el cupón en cero", () => {
    const almacen = mockLocalStorage();
    almacen.precargar(CLAVE_CARRITO, [lineaGuardada(3)]);
    almacen.precargar(CLAVE_CUPON, CUPON_VALIDO);
    renderSonda();

    expect(valorDe("total-items")).toBe("3");

    pulsar("vaciar");

    expect(valorDe("total-items")).toBe("0");
    expect(valorDe("cupon")).toBe("sin-cupon");
    expect(almacen.leer(CLAVE_CARRITO)).toEqual([]);
  });
});
