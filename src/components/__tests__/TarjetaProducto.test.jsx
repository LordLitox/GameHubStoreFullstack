import { fireEvent, screen } from "@testing-library/react";
import TarjetaProducto from "../TarjetaProducto.jsx";
import { PRODUCTOS } from "../../data/productos.js";
import {
  CLAVE_CARRITO,
  mockAlert,
  renderConProveedores,
} from "../../__tests__/ayudas/render.jsx";

/**
 * Prueba el renderizado del componente según sus props (stubs de producto)
 * y la manipulación del DOM al agregar al carrito.
 */

// Stubs de producto: datos mínimos que el componente necesita.
function crearProducto(overrides = {}) {
  return {
    id: 1,
    nombre: "Teclado Mecánico RGB",
    marca: "Logitech",
    categoria: "perifericos",
    precio: 100000,
    descuentoVigente: { activo: false, porcentaje: 0 },
    stockDisponible: 5,
    imagen: "/assets/img/producto-teclado.jpg",
    ...overrides,
  };
}

describe("TarjetaProducto (renderizado por props)", () => {
  let alerta;

  beforeEach(() => {
    alerta = mockAlert();
  });

  it("muestra el nombre, la categoría capitalizada y el enlace al detalle", () => {
    const { container } = renderConProveedores(
      <TarjetaProducto producto={crearProducto()} />
    );

    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(
      "Teclado Mecánico RGB"
    );
    expect(container.querySelector(".tarjeta-producto__categoria").textContent).toBe(
      "Perifericos"
    );

    const enlace = screen.getByRole("link", { name: "Teclado Mecánico RGB" });
    expect(enlace.getAttribute("href")).toBe("/detalle/1");
  });

  it("describe la imagen con un alt basado en el nombre del producto", () => {
    renderConProveedores(<TarjetaProducto producto={crearProducto()} />);

    const imagen = screen.getByAltText("Fotografía de Teclado Mecánico RGB");
    expect(imagen.getAttribute("src")).toBe("/assets/img/producto-teclado.jpg");
  });

  it("formatea el precio en pesos chilenos cuando no hay descuento", () => {
    const { container } = renderConProveedores(
      <TarjetaProducto producto={crearProducto({ precio: 100000 })} />
    );

    expect(container.querySelector(".tarjeta-producto__precio").textContent).toBe(
      "$100.000"
    );
  });

  it("aplica el descuento vigente y muestra el precio original tachado", () => {
    const producto = crearProducto({
      precio: 100000,
      descuentoVigente: { activo: true, porcentaje: 20 },
    });
    const { container } = renderConProveedores(<TarjetaProducto producto={producto} />);

    const precio = container.querySelector(".tarjeta-producto__precio");
    // 100.000 con 20% de descuento => 80.000, más el original tachado.
    expect(precio.textContent).toContain("$80.000");
    expect(precio.querySelector("s").textContent).toBe("$100.000");
  });

  it("indica el stock disponible", () => {
    renderConProveedores(
      <TarjetaProducto producto={crearProducto({ stockDisponible: 7 })} />
    );

    expect(screen.getByText("Stock: 7 un.")).toBeTruthy();
  });

  it("con stock 0 muestra el aviso y deshabilita el botón de compra", () => {
    renderConProveedores(
      <TarjetaProducto producto={crearProducto({ stockDisponible: 0 })} />
    );

    expect(screen.getByText("Sin stock disponible")).toBeTruthy();

    const boton = screen.getByRole("button", { name: "Agotado" });
    expect(boton.disabled).toBe(true);
    expect(boton.getAttribute("aria-disabled")).toBe("true");
    expect(screen.queryByRole("button", { name: "Agregar al carrito" })).toBeNull();
  });

  it("al hacer clic agrega una unidad: actualiza el carrito persistido y avisa al usuario", () => {
    // El contexto resuelve el producto por id contra PRODUCTOS, por eso acá
    // se usa un producto real del catálogo.
    const productoReal = PRODUCTOS.find((p) => p.stockDisponible > 0);
    const { almacenamiento } = renderConProveedores(
      <TarjetaProducto producto={productoReal} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Agregar al carrito" }));

    expect(alerta).toHaveBeenCalledWith(`"${productoReal.nombre}" agregado al carrito.`);

    const carritoGuardado = almacenamiento.leer(CLAVE_CARRITO);
    expect(carritoGuardado.length).toBe(1);
    expect(carritoGuardado[0].id).toBe(productoReal.id);
    expect(carritoGuardado[0].cantidad).toBe(1);
  });
});
