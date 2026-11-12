import { fireEvent, screen, within } from "@testing-library/react";
import Admin from "../Admin.jsx";
import { renderConProveedores } from "../../__tests__/ayudas/render.jsx";
import { esperarHasta, simularFetch } from "../../__tests__/ayudas/api.js";

/**
 * Página Admin (EP3 · Parte 6-7): el mantenedor ya no trabaja sobre
 * `src/data/*.js`, sino contra `/api/v1/admin/**`. Las pruebas simulan el
 * Gateway y comprueban que cada acción (crear, editar, activar) llama al
 * endpoint correcto y refresca la tabla con lo que responde el servidor.
 */

/** Producto como lo devuelve product-service en el mantenedor. */
function productoAdminDto(overrides = {}) {
  return {
    id: 1,
    sku: "NOTE-001",
    nombre: "Notebook Gamer Asus ROG Strix G16",
    marca: "Asus",
    categoriaId: 1,
    categoria: "Consolas y Notebooks",
    precio: 1349991,
    precioNormal: null,
    activo: true,
    imagen: "notebook",
    resumen: "",
    descripcion: "",
    especificaciones: {},
    ...overrides,
  };
}

/** Promoción como la devuelve promotion-service en el mantenedor. */
function promocionDto(overrides = {}) {
  return {
    id: 1,
    codigo: "GAMEHUB20",
    porcentaje: 20,
    topeMaximo: 50000,
    inicio: "2026-01-01",
    expira: "2099-12-31",
    usosMaximos: 100,
    usos: 3,
    activa: true,
    estado: "VIGENTE",
    ...overrides,
  };
}

describe("Admin", () => {
  let api;
  // Lista mutable que la API simulada devuelve; las escrituras la modifican.
  let productos;
  let promociones;

  beforeEach(() => {
    productos = [
      productoAdminDto(),
      productoAdminDto({ id: 2, sku: "PER-002", nombre: "Mouse RGB Pro", marca: "Logitech" }),
    ];
    promociones = [promocionDto(), promocionDto({ id: 2, codigo: "BIENVENIDO10", porcentaje: 10 })];

    api = simularFetch();

    // Lecturas
    api.responder("GET", "/admin/productos", () => productos);
    api.responder("GET", "/admin/promociones", () => promociones);
    api.responder("GET", "/admin/categorias", [
      { id: 1, nombre: "Consolas y Notebooks", slug: "consolas", cantidadProductos: 2 },
    ]);

    // Escrituras de productos
    api.responder("POST", "/admin/productos", (op) => {
      const nuevo = productoAdminDto({
        id: 99,
        nombre: op.cuerpo.nombre,
        marca: op.cuerpo.marca,
        precio: op.cuerpo.precio,
      });
      productos = [...productos, nuevo];
      return nuevo;
    });
    api.responder("PUT", "/admin/productos/1", (op) => {
      productos = productos.map((p) => (p.id === 1 ? { ...p, nombre: op.cuerpo.nombre } : p));
      return productos[0];
    });
    api.responder("PATCH", "/admin/productos/1/activo", (op) => {
      productos = productos.map((p) => (p.id === 1 ? { ...p, activo: op.cuerpo.activo } : p));
      return productos[0];
    });

    // Escrituras de promociones
    api.responder("POST", "/admin/promociones", (op) => {
      const nueva = promocionDto({
        id: 99,
        codigo: String(op.cuerpo.codigo).toUpperCase(),
        porcentaje: op.cuerpo.porcentaje,
      });
      promociones = [...promociones, nueva];
      return nueva;
    });
    api.responder("PATCH", "/admin/promociones/1/activo", (op) => {
      promociones = promociones.map((p) => (p.id === 1 ? { ...p, activa: op.cuerpo.activa } : p));
      return promociones[0];
    });
  });

  function montar() {
    return renderConProveedores(<Admin />);
  }

  it("lista los productos que entrega el backend", async () => {
    montar();

    await esperarHasta(() => screen.queryByText("Notebook Gamer Asus ROG Strix G16"));
    const tabla = screen.getByRole("table");
    expect(within(tabla).getByText("Mouse RGB Pro")).toBeTruthy();
  });

  it("crea un producto llamando a POST /admin/productos", async () => {
    montar();
    await esperarHasta(() => screen.queryByText("Notebook Gamer Asus ROG Strix G16"));

    fireEvent.change(screen.getByLabelText(/^Nombre/), { target: { value: "Mouse de prueba" } });
    fireEvent.change(screen.getByLabelText(/^Marca/), { target: { value: "Genérico" } });
    fireEvent.change(screen.getByLabelText(/^Categoría/), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Precio ($) *"), { target: { value: "19990" } });

    fireEvent.click(screen.getByRole("button", { name: "Crear producto" }));

    await esperarHasta(() => screen.queryByRole("status")?.textContent.includes("creado"));
    expect(screen.getByText("Mouse de prueba")).toBeTruthy();
    expect(api.llamadas.some((l) => l.metodo === "POST" && l.ruta === "/admin/productos")).toBe(true);
  });

  it("edita un producto y refleja el nombre guardado por el servidor", async () => {
    montar();
    await esperarHasta(() => screen.queryByText("Notebook Gamer Asus ROG Strix G16"));

    fireEvent.click(
      screen.getByRole("button", { name: "Editar Notebook Gamer Asus ROG Strix G16" })
    );

    const campoNombre = screen.getByLabelText(/^Nombre/);
    expect(campoNombre.value).toBe("Notebook Gamer Asus ROG Strix G16");

    fireEvent.change(campoNombre, { target: { value: "Notebook Asus ROG (editado)" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await esperarHasta(() => screen.queryByText("Notebook Asus ROG (editado)"));
    expect(api.llamadas.some((l) => l.metodo === "PUT" && l.ruta === "/admin/productos/1")).toBe(true);
  });

  it("desactiva un producto con PATCH .../activo", async () => {
    montar();
    await esperarHasta(() => screen.queryByText("Notebook Gamer Asus ROG Strix G16"));

    fireEvent.click(
      screen.getByRole("button", { name: "Desactivar Notebook Gamer Asus ROG Strix G16" })
    );

    await esperarHasta(() => screen.queryByRole("status")?.textContent.includes("desactivado"));
    expect(api.llamadas.some((l) => l.metodo === "PATCH" && l.ruta === "/admin/productos/1/activo")).toBe(
      true
    );
  });

  describe("sección Cupones", () => {
    function abrirCupones() {
      fireEvent.click(screen.getByRole("tab", { name: "Cupones" }));
    }

    it("lista los cupones que entrega el backend", async () => {
      montar();
      abrirCupones();

      await esperarHasta(() => screen.queryByText("GAMEHUB20"));
      expect(screen.getByText("BIENVENIDO10")).toBeTruthy();
    });

    it("crea un cupón llamando a POST /admin/promociones", async () => {
      montar();
      abrirCupones();
      await esperarHasta(() => screen.queryByText("GAMEHUB20"));

      fireEvent.change(screen.getByLabelText(/^Código/), { target: { value: "nuevo15" } });
      fireEvent.change(screen.getByLabelText(/^Descuento/), { target: { value: "15" } });
      fireEvent.change(screen.getByLabelText(/^Tope/), { target: { value: "30000" } });
      fireEvent.change(screen.getByLabelText(/^Vigente desde/), { target: { value: "2026-01-01" } });
      fireEvent.change(screen.getByLabelText(/^Expira/), { target: { value: "2030-06-30" } });

      fireEvent.click(screen.getByRole("button", { name: "Crear cupón" }));

      await esperarHasta(() => screen.queryByRole("status")?.textContent.includes("creado"));
      // El código se normaliza a mayúsculas en el servicio.
      expect(screen.getByText("NUEVO15")).toBeTruthy();
      expect(api.llamadas.some((l) => l.metodo === "POST" && l.ruta === "/admin/promociones")).toBe(true);
    });
  });
});
