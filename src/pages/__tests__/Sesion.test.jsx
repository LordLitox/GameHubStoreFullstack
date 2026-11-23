import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import Ingresar from "../Ingresar.jsx";
import RutaProtegida from "../../components/RutaProtegida.jsx";
import Cabecera from "../../components/Cabecera.jsx";
import {
  CLAVE_SESION,
  mockLocalStorage,
  renderConProveedores,
} from "../../__tests__/ayudas/render.jsx";

/**
 * EP3 · Partes 4 y 5 — sesión, login, guards por rol y menú filtrado.
 *
 * Las llamadas al backend se sustituyen con `spyOn(window, "fetch")`: lo que
 * se prueba aquí es la interfaz (formulario, guardia, cabecera), no el
 * microservicio.
 */

/** Respuesta de `POST /auth/login` como la entrega el backend. */
function respuestaLogin(rol = "CLIENTE", nombre = "Camila Rojas") {
  return {
    ok: true,
    status: 200,
    text: () =>
      Promise.resolve(
        JSON.stringify({
          token: "token-de-prueba",
          usuario: { id: 3, nombre, email: "camila@gamehub.test", rol },
        })
      ),
  };
}

function respuestaError(mensaje, estado = 401) {
  return {
    ok: false,
    status: estado,
    text: () => Promise.resolve(JSON.stringify({ mensaje })),
  };
}

/** Deja una sesión ya guardada antes de montar el componente. */
function precargarSesion(almacen, rol, nombre = "Usuario de prueba") {
  almacen.precargar(CLAVE_SESION, {
    token: "token-guardado",
    usuario: { id: 1, nombre, email: "quien@gamehub.test", rol },
  });
}

describe("Ingresar (Parte 4)", () => {
  it("guarda la sesión y navega tras un login correcto", async () => {
    const almacen = mockLocalStorage();
    spyOn(window, "fetch").and.returnValue(Promise.resolve(respuestaLogin("CLIENTE")));

    renderConProveedores(
      <Routes>
        <Route path="/ingresar" element={<Ingresar />} />
        {/* `Ingresar` navega al inicio cuando no hay ruta de origen guardada. */}
        <Route path="/" element={<p>Catálogo cargado</p>} />
      </Routes>,
      { ruta: "/ingresar", almacen }
    );

    fireEvent.change(screen.getByLabelText("Correo electrónico *"), {
      target: { value: "camila@gamehub.test" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña *"), {
      target: { value: "clave123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() =>
      expect(screen.getByText("Catálogo cargado")).toBeTruthy()
    );
    expect(almacen.leer(CLAVE_SESION).token).toBe("token-de-prueba");
    expect(almacen.leer(CLAVE_SESION).usuario.rol).toBe("CLIENTE");
  });

  it("muestra el mensaje del backend cuando las credenciales fallan", async () => {
    mockLocalStorage();
    spyOn(window, "fetch").and.returnValue(
      Promise.resolve(respuestaError("Credenciales incorrectas."))
    );

    renderConProveedores(<Ingresar />, { ruta: "/ingresar" });

    fireEvent.change(screen.getByLabelText("Correo electrónico *"), {
      target: { value: "nadie@gamehub.test" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña *"), {
      target: { value: "mala" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() =>
      expect(screen.getByText("Credenciales incorrectas.")).toBeTruthy()
    );
  });

  it("pinta los errores de validación junto al campo (400 con `errores`)", async () => {
    mockLocalStorage();
    spyOn(window, "fetch").and.returnValue(
      Promise.resolve({
        ok: false,
        status: 400,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              mensaje: "Revisa los datos enviados.",
              errores: { email: "El correo ya está registrado." },
            })
          ),
      })
    );

    renderConProveedores(<Ingresar />, { ruta: "/ingresar" });

    fireEvent.click(screen.getByRole("button", { name: "Regístrate aquí" }));
    fireEvent.change(screen.getByLabelText("Correo electrónico *"), {
      target: { value: "camila@gamehub.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() =>
      expect(screen.getByText("El correo ya está registrado.")).toBeTruthy()
    );
  });

  it("reconoce una sesión guardada al recargar (rehidratación)", () => {
    const almacen = mockLocalStorage();
    precargarSesion(almacen, "ADMIN", "Ana Silva");

    renderConProveedores(<Ingresar />, { ruta: "/ingresar", almacen });

    expect(screen.getByText("Sesión activa")).toBeTruthy();
    expect(screen.getByText("Ana Silva")).toBeTruthy();
  });
});

describe("RutaProtegida (Parte 5)", () => {
  const rutas = (
    <Routes>
      <Route path="/ingresar" element={<p>Formulario de ingreso</p>} />
      <Route
        path="/admin"
        element={
          <RutaProtegida roles={["ADMIN"]}>
            <p>Panel de administración</p>
          </RutaProtegida>
        }
      />
    </Routes>
  );

  it("redirige al login cuando no hay sesión", () => {
    mockLocalStorage();
    renderConProveedores(rutas, { ruta: "/admin" });

    expect(screen.getByText("Formulario de ingreso")).toBeTruthy();
    expect(screen.queryByText("Panel de administración")).toBeNull();
  });

  it("bloquea con aviso 403 a un rol distinto", () => {
    const almacen = mockLocalStorage();
    precargarSesion(almacen, "CLIENTE");

    renderConProveedores(rutas, { ruta: "/admin", almacen });

    expect(screen.getByText("No tienes permiso para ver esta sección.")).toBeTruthy();
    expect(screen.queryByText("Panel de administración")).toBeNull();
  });

  it("deja pasar al rol correcto", () => {
    const almacen = mockLocalStorage();
    precargarSesion(almacen, "ADMIN");

    renderConProveedores(rutas, { ruta: "/admin", almacen });

    expect(screen.getByText("Panel de administración")).toBeTruthy();
  });
});

describe("Cabecera con sesión (Parte 5)", () => {
  it("muestra el nombre, el rol de la pauta y el botón de salir", () => {
    const almacen = mockLocalStorage();
    precargarSesion(almacen, "OPERADOR", "Luis Pérez");

    renderConProveedores(<Cabecera />, { almacen });

    expect(screen.getByText(/Luis Pérez/)).toBeTruthy();
    // El enum del backend es OPERADOR, pero la interfaz muestra "Vendedor".
    expect(screen.getByText("(Vendedor)")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeTruthy();
  });

  it("oculta Administración al cliente y la muestra al administrador", () => {
    const almacen = mockLocalStorage();
    precargarSesion(almacen, "CLIENTE");

    const { unmount } = renderConProveedores(<Cabecera />, { almacen });
    expect(screen.queryByRole("link", { name: "Administración" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Ventas" })).toBeNull();
    unmount();

    // La sesión vive en el módulo de servicios: se reinicia antes del 2º caso.
    window.localStorage.removeItem(CLAVE_SESION);
    const almacenAdmin = mockLocalStorage();
    precargarSesion(almacenAdmin, "ADMIN", "Ana Silva");
    renderConProveedores(<Cabecera />, { almacen: almacenAdmin });

    expect(screen.getByRole("link", { name: "Administración" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ventas" })).toBeTruthy();
  });

  it("cierra la sesión al pulsar el botón", async () => {
    const almacen = mockLocalStorage();
    precargarSesion(almacen, "CLIENTE", "Camila Rojas");

    renderConProveedores(<Cabecera />, { almacen });
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Iniciar sesión" })).toBeTruthy()
    );
    expect(almacen.leer(CLAVE_SESION)).toBeNull();
  });
});
