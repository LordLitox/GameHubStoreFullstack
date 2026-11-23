import { simularFetch, productoDto, cuponDto, ordenResumenDto } from "../../__tests__/ayudas/api.js";
import * as servicioProductos from "../productos.js";
import * as servicioCupones from "../cupones.js";
import * as servicioOrdenes from "../ordenes.js";
import * as servicioResenas from "../resenas.js";
import * as cache from "../catalogoCache.js";
import { restablecerSesion, iniciarSesion } from "../sesion.js";

/**
 * Módulos de recurso (EP3 · Parte 7): comprueban que cada función llama al
 * endpoint correcto y adapta la respuesta. El Gateway se simula.
 */

describe("servicio de productos", () => {
  let api;

  beforeEach(() => {
    api = simularFetch();
    restablecerSesion();
  });

  afterEach(() => cache.invalidar());

  it("lista el catálogo pegando el stock de inventory-service", async () => {
    api.responder("GET", "/productos", [productoDto({ id: 1 }), productoDto({ id: 2 })]);
    api.responder("GET", "/inventario/stock", [
      { productoId: 1, stock: 5 },
      { productoId: 2, stock: 0 },
    ]);

    const catalogo = await servicioProductos.listarConStock();
    expect(catalogo.length).toBe(2);
    expect(catalogo[0].stockDisponible).toBe(5);
    expect(catalogo[1].stockDisponible).toBe(0);
    // Dos peticiones: productos + stock.
    expect(api.llamadas.length).toBe(2);
  });

  it("detalle pide el producto y su stock", async () => {
    api.responder("GET", "/productos/1", productoDto({ id: 1, nombre: "Mouse" }));
    api.responder("GET", "/inventario/stock", [{ productoId: 1, stock: 9 }]);

    const producto = await servicioProductos.detalle(1);
    expect(producto.nombre).toBe("Mouse");
    expect(producto.stockDisponible).toBe(9);
  });
});

describe("servicio de cupones", () => {
  let api;

  beforeEach(() => {
    api = simularFetch();
    restablecerSesion();
  });

  it("valida un cupón vigente y devuelve exito true", async () => {
    api.responder("GET", "/promociones/validar", cuponDto());
    const res = await servicioCupones.validar("GAMEHUB20");
    expect(res.exito).toBe(true);
    expect(res.cupon.codigo).toBe("GAMEHUB20");
  });

  it("un cupón inexistente llega como exito false, no como excepción", async () => {
    api.responderConError("GET", "/promociones/validar", 404, { mensaje: "No existe" });
    const res = await servicioCupones.validar("NOEXISTE");
    expect(res.exito).toBe(false);
    expect(res.cupon).toBeNull();
  });

  it("un código vacío no llega a consultar al servidor", async () => {
    const res = await servicioCupones.validar("  ");
    expect(res.exito).toBe(false);
    expect(api.llamadas.length).toBe(0);
  });
});

describe("servicio de órdenes", () => {
  let api;

  beforeEach(() => {
    api = simularFetch();
    restablecerSesion();
  });

  afterEach(() => restablecerSesion());

  it("crear envía las líneas, el cupón y el método de pago mapeado", async () => {
    iniciarSesion({ token: "t", usuario: { id: 1, rol: "CLIENTE" } });
    api.responder("POST", "/ordenes", { id: 1, numero: "GH-1", total: 1000, pago: { estado: "APROBADO" }, lineas: [] });

    await servicioOrdenes.crear({
      items: [{ id: 1, cantidad: 2 }],
      cupon: "GAMEHUB20",
      metodoPago: "transferencia",
      despacho: { nombre: "Ana", email: "a@x.cl" },
    });

    const cuerpo = api.ultimaLlamada().cuerpo;
    expect(cuerpo.lineas).toEqual([{ productoId: 1, cantidad: 2 }]);
    expect(cuerpo.cupon).toBe("GAMEHUB20");
    expect(cuerpo.metodoPago).toBe("TRANSFERENCIA");
    expect(cuerpo.despacho.correo).toBe("a@x.cl");
  });

  it("mias lista las órdenes del cliente autenticado", async () => {
    iniciarSesion({ token: "t", usuario: { id: 1, rol: "CLIENTE" } });
    api.responder("GET", "/ordenes/mias", [ordenResumenDto({ numero: "GH-9" })]);

    const ordenes = await servicioOrdenes.mias();
    expect(ordenes[0].numero).toBe("GH-9");
  });
});

describe("servicio de reseñas", () => {
  let api;

  beforeEach(() => {
    api = simularFetch();
    restablecerSesion();
  });

  it("deProducto devuelve las reseñas aprobadas", async () => {
    api.responder("GET", "/productos/1/resenas", [
      { id: 1, autor: "Ana", puntuacion: 5, comentario: "Genial", fecha: "2026-01-01" },
    ]);
    const resenas = await servicioResenas.deProducto(1);
    expect(resenas[0].autor).toBe("Ana");
    expect(resenas[0].puntaje).toBe(5);
  });

  it("resumenPorProducto arma un Map por productoId", async () => {
    api.responder("GET", "/resenas/resumen", [
      { productoId: 1, puntuacion: 4.5, cantidad: 2 },
      { productoId: 2, puntuacion: 5, cantidad: 1 },
    ]);
    const mapa = await servicioResenas.resumenPorProducto([1, 2]);
    expect(mapa.get(1).puntuacion).toBe(4.5);
    expect(mapa.get(2).cantidad).toBe(1);
  });
});

describe("caché del catálogo", () => {
  let api;

  beforeEach(() => {
    api = simularFetch();
    cache.invalidar();
  });

  afterEach(() => cache.invalidar());

  it("memoiza la petición: la segunda llamada no vuelve a pedir el catálogo", async () => {
    api.responder("GET", "/productos", [productoDto({ id: 1 })]);
    api.responder("GET", "/inventario/stock", [{ productoId: 1, stock: 1 }]);

    const a = await cache.obtener();
    const b = await cache.obtener();

    expect(a).toBe(b);
    // Solo una ronda de peticiones para las dos llamadas.
    expect(api.llamadas.filter((l) => l.ruta === "/productos").length).toBe(1);
  });

  it("invalidar fuerza una nueva consulta", async () => {
    api.responder("GET", "/productos", [productoDto({ id: 1 })]);
    api.responder("GET", "/inventario/stock", [{ productoId: 1, stock: 1 }]);

    await cache.obtener();
    cache.invalidar();
    await cache.obtener();

    expect(api.llamadas.filter((l) => l.ruta === "/productos").length).toBe(2);
  });

  it("semilla() devuelve una copia del catálogo local", () => {
    const copia = cache.semilla();
    expect(Array.isArray(copia)).toBe(true);
    expect(copia.length).toBeGreaterThan(0);
    // Es una copia: mutarla no afecta a la siguiente llamada.
    copia[0].nombre = "mutado";
    expect(cache.semilla()[0].nombre).not.toBe("mutado");
  });
});
