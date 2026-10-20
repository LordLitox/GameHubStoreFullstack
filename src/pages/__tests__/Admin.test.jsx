import { fireEvent, screen, within } from "@testing-library/react";
import Admin from "../Admin.jsx";
import { renderConProveedores } from "../../__tests__/ayudas/render.jsx";
import { restablecerProductos, listarProductos } from "../../data/productos.js";
import { restablecerCupones, listarCupones } from "../../data/cupones.js";

/**
 * Página Admin: consume las operaciones CRUD de src/data. Como las colecciones
 * son estado de módulo compartido, cada prueba las restablece a su semilla
 * para no filtrar datos entre specs.
 */
describe("Admin", () => {
  beforeEach(() => {
    restablecerProductos();
    restablecerCupones();
    spyOn(window, "confirm").and.returnValue(true);
  });

  afterEach(() => {
    restablecerProductos();
    restablecerCupones();
  });

  function montar() {
    return renderConProveedores(<Admin />);
  }

  it("lista los productos iniciales en la tabla", () => {
    montar();

    const tabla = screen.getByRole("table");
    // Encabezado + 8 productos de la semilla.
    expect(within(tabla).getAllByRole("row").length).toBe(9);
    expect(within(tabla).getByText("Notebook Gamer Asus ROG Strix G16")).toBeTruthy();
  });

  it("crea un producto y lo agrega a la tabla", () => {
    montar();

    fireEvent.change(screen.getByLabelText(/^Nombre/), {
      target: { value: "Mouse de prueba" },
    });
    fireEvent.change(screen.getByLabelText(/^Marca/), { target: { value: "Genérico" } });
    fireEvent.change(screen.getByLabelText(/^Precio/), { target: { value: "19990" } });
    fireEvent.change(screen.getByLabelText(/^Stock/), { target: { value: "3" } });

    fireEvent.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(screen.getByRole("status").textContent).toContain("creado");
    const tabla = screen.getByRole("table");
    expect(within(tabla).getByText("Mouse de prueba")).toBeTruthy();
    // La colección en memoria también recibió el nuevo producto.
    expect(listarProductos().length).toBe(9);
  });

  it("muestra el error de validación si falta el nombre", () => {
    montar();

    fireEvent.change(screen.getByLabelText(/^Precio/), { target: { value: "1000" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(screen.getByRole("alert").textContent).toContain(
      "El nombre del producto es obligatorio."
    );
    expect(listarProductos().length).toBe(8);
  });

  it("edita un producto existente y refleja el cambio", () => {
    montar();

    fireEvent.click(
      screen.getByRole("button", { name: "Editar Notebook Gamer Asus ROG Strix G16" })
    );

    const campoNombre = screen.getByLabelText(/^Nombre/);
    expect(campoNombre.value).toBe("Notebook Gamer Asus ROG Strix G16");

    fireEvent.change(campoNombre, { target: { value: "Notebook Asus ROG (editado)" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    const tabla = screen.getByRole("table");
    expect(within(tabla).getByText("Notebook Asus ROG (editado)")).toBeTruthy();
    expect(listarProductos()[0].nombre).toBe("Notebook Asus ROG (editado)");
  });

  it("elimina un producto tras confirmar", () => {
    montar();

    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar Notebook Gamer Asus ROG Strix G16" })
    );

    expect(window.confirm).toHaveBeenCalled();
    expect(listarProductos().length).toBe(7);
    expect(
      within(screen.getByRole("table")).queryByText("Notebook Gamer Asus ROG Strix G16")
    ).toBeNull();
  });

  it("no elimina si el usuario cancela la confirmación", () => {
    window.confirm.and.returnValue(false);
    montar();

    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar Notebook Gamer Asus ROG Strix G16" })
    );

    expect(listarProductos().length).toBe(8);
  });

  describe("sección Cupones", () => {
    function abrirCupones() {
      fireEvent.click(screen.getByRole("tab", { name: "Cupones" }));
    }

    it("lista los cupones iniciales", () => {
      montar();
      abrirCupones();

      expect(screen.getByText("GAMEHUB20")).toBeTruthy();
      expect(screen.getByText("BIENVENIDO10")).toBeTruthy();
    });

    it("crea un cupón nuevo", () => {
      montar();
      abrirCupones();

      fireEvent.change(screen.getByLabelText(/^Código/), { target: { value: "nuevo15" } });
      fireEvent.change(screen.getByLabelText(/^Descuento/), { target: { value: "15" } });
      fireEvent.change(screen.getByLabelText(/^Tope/), { target: { value: "30000" } });
      fireEvent.change(screen.getByLabelText(/^Expira/), { target: { value: "2030-06-30" } });

      fireEvent.click(screen.getByRole("button", { name: "Crear cupón" }));

      expect(screen.getByRole("status").textContent).toContain("creado");
      // El código se normaliza a mayúsculas.
      expect(screen.getByText("NUEVO15")).toBeTruthy();
      expect(listarCupones().length).toBe(3);
    });

    it("rechaza un cupón con código duplicado", () => {
      montar();
      abrirCupones();

      fireEvent.change(screen.getByLabelText(/^Código/), { target: { value: "GAMEHUB20" } });
      fireEvent.change(screen.getByLabelText(/^Descuento/), { target: { value: "5" } });
      fireEvent.change(screen.getByLabelText(/^Expira/), { target: { value: "2030-06-30" } });

      fireEvent.click(screen.getByRole("button", { name: "Crear cupón" }));

      expect(screen.getByRole("alert").textContent).toContain("Ya existe un cupón");
      expect(listarCupones().length).toBe(2);
    });
  });
});
