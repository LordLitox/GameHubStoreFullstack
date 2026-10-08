import { describe, it, expect } from "vitest";
import {
  validarStock,
  precioFinalProducto,
  agregarAlCarrito,
  quitarLinea,
  cambiarCantidad,
  contarItems,
} from "../carrito.js";

const PRODUCTOS = [
  {
    id: 1,
    nombre: "Producto con descuento",
    marca: "Asus",
    categoria: "consolas",
    precio: 100000,
    descuentoVigente: { activo: true, porcentaje: 10 },
    stockDisponible: 5,
    imagen: "/assets/img/producto-teclado.jpg",
  },
  {
    id: 2,
    nombre: "Producto agotado",
    marca: "Lenovo",
    categoria: "consolas",
    precio: 200000,
    descuentoVigente: { activo: false, porcentaje: 0 },
    stockDisponible: 0,
    imagen: "/assets/img/categoria-consolas.jpg",
  },
];

describe("validarStock", () => {
  it("acepta una cantidad dentro del stock disponible", () => {
    expect(validarStock(PRODUCTOS[0], 3)).toBe(true);
  });

  it("rechaza cantidades mayores al stock", () => {
    expect(validarStock(PRODUCTOS[0], 6)).toBe(false);
  });

  it("rechaza productos sin stock", () => {
    expect(validarStock(PRODUCTOS[1], 1)).toBe(false);
  });

  it("rechaza productos inexistentes", () => {
    expect(validarStock(null, 1)).toBe(false);
  });
});

describe("precioFinalProducto", () => {
  it("aplica el descuento vigente redondeado", () => {
    expect(precioFinalProducto(PRODUCTOS[0])).toBe(90000);
  });

  it("devuelve el precio normal si no hay descuento", () => {
    expect(precioFinalProducto(PRODUCTOS[1])).toBe(200000);
  });
});

describe("agregarAlCarrito", () => {
  it("agrega un producto nuevo con el precio descontado", () => {
    const res = agregarAlCarrito([], PRODUCTOS, 1, 2);
    expect(res.exito).toBe(true);
    expect(res.carrito).toHaveLength(1);
    expect(res.carrito[0].cantidad).toBe(2);
    expect(res.carrito[0].precio).toBe(90000);
    expect(res.carrito[0].precioOriginal).toBe(100000);
  });

  it("suma unidades si el producto ya está en el carrito", () => {
    const carrito = [{ id: 1, cantidad: 2, precio: 90000 }];
    const res = agregarAlCarrito(carrito, PRODUCTOS, 1, 1);
    expect(res.exito).toBe(true);
    expect(res.carrito[0].cantidad).toBe(3);
    expect(res.carrito).toHaveLength(1);
  });

  it("rechaza superar el stock disponible", () => {
    const res = agregarAlCarrito([], PRODUCTOS, 1, 10);
    expect(res.exito).toBe(false);
    expect(res.carrito).toHaveLength(0);
    expect(res.mensaje).toContain("Stock disponible: 5");
  });

  it("rechaza productos agotados", () => {
    const res = agregarAlCarrito([], PRODUCTOS, 2);
    expect(res.exito).toBe(false);
    expect(res.mensaje).toBe("Producto sin stock disponible.");
  });

  it("rechaza productos inexistentes", () => {
    const res = agregarAlCarrito([], PRODUCTOS, 99);
    expect(res.exito).toBe(false);
    expect(res.mensaje).toBe("El producto seleccionado no existe.");
  });

  it("no muta el carrito original", () => {
    const carrito = [{ id: 1, cantidad: 2, precio: 90000 }];
    agregarAlCarrito(carrito, PRODUCTOS, 1, 1);
    expect(carrito[0].cantidad).toBe(2);
  });
});

describe("quitarLinea", () => {
  it("elimina solo la línea indicada", () => {
    const carrito = [
      { id: 1, cantidad: 1 },
      { id: 3, cantidad: 2 },
    ];
    const resultado = quitarLinea(carrito, 1);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe(3);
  });
});

describe("cambiarCantidad", () => {
  const carrito = [{ id: 1, cantidad: 1, precio: 90000 }];

  it("actualiza la cantidad dentro del stock", () => {
    const res = cambiarCantidad(carrito, PRODUCTOS, 1, 4);
    expect(res.exito).toBe(true);
    expect(res.carrito[0].cantidad).toBe(4);
  });

  it("elimina la línea al llegar a cero", () => {
    const res = cambiarCantidad(carrito, PRODUCTOS, 1, 0);
    expect(res.exito).toBe(true);
    expect(res.carrito).toHaveLength(0);
  });

  it("rechaza cantidades sobre el stock", () => {
    const res = cambiarCantidad(carrito, PRODUCTOS, 1, 6);
    expect(res.exito).toBe(false);
  });
});

describe("contarItems", () => {
  it("suma las cantidades de todas las líneas", () => {
    const carrito = [
      { id: 1, cantidad: 2 },
      { id: 3, cantidad: 3 },
    ];
    expect(contarItems(carrito)).toBe(5);
  });

  it("devuelve cero con carrito vacío", () => {
    expect(contarItems([])).toBe(0);
  });
});
