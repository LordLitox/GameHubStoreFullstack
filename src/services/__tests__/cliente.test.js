import { ErrorApi, mensajeDeError, peticion, query, URL_API } from "../cliente.js";
import { simularFetch } from "../../__tests__/ayudas/api.js";
import { restablecerSesion, iniciarSesion } from "../sesion.js";

/**
 * Cliente HTTP (EP3 · Parte 7): URL base, cabecera Bearer, normalización de
 * errores `{ mensaje, errores }` a `ErrorApi` y los atajos `query`.
 */

describe("cliente HTTP", () => {
  let api;

  beforeEach(() => {
    api = simularFetch();
    restablecerSesion();
  });

  afterEach(() => restablecerSesion());

  it("apunta a la URL base versionada del Gateway", () => {
    expect(URL_API).toContain("/api/v1");
  });

  it("no envía Authorization cuando la petición es pública (sinAuth)", async () => {
    api.responder("GET", "/productos", []);
    await peticion("/productos", { sinAuth: true });
    const cabeceras = new Headers(api.ultimaLlamada().cabeceras);
    expect(cabeceras.has("Authorization")).toBe(false);
  });

  it("añade el Bearer de la sesión activa", async () => {
    iniciarSesion({ token: "abc123", usuario: { id: 1, rol: "CLIENTE" } });
    api.responder("GET", "/ordenes/mias", []);
    await peticion("/ordenes/mias");
    const cabeceras = new Headers(api.ultimaLlamada().cabeceras);
    expect(cabeceras.get("Authorization")).toBe("Bearer abc123");
  });

  it("convierte un error del backend en ErrorApi con estado y errores", async () => {
    api.responderConError("POST", "/ordenes", 400, {
      mensaje: "Datos inválidos",
      errores: { lineas: "Stock insuficiente" },
    });

    let capturado = null;
    try {
      await peticion("/ordenes", { metodo: "POST", cuerpo: {} });
    } catch (error) {
      capturado = error;
    }

    expect(capturado instanceof ErrorApi).toBe(true);
    expect(capturado.estado).toBe(400);
    expect(capturado.errores.lineas).toBe("Stock insuficiente");
    expect(capturado.esValidacion).toBe(true);
    expect(capturado.esSinSesion).toBe(false);
  });

  it("marca 401 como sesión ausente y 403 como permiso insuficiente", async () => {
    api.responderConError("GET", "/admin/usuarios", 401, { mensaje: "No autenticado" });
    const sinSesion = await peticion("/admin/usuarios").catch((e) => e);
    expect(sinSesion.esSinSesion).toBe(true);

    api.responderConError("GET", "/admin/productos", 403, { mensaje: "Prohibido" });
    const sinPermiso = await peticion("/admin/productos").catch((e) => e);
    expect(sinPermiso.esSinPermiso).toBe(true);
  });

  it("un fallo de red se convierte en ErrorApi con estado 0", async () => {
    // No se registra la ruta: el doble rechaza la promesa como una caída de red.
    const error = await peticion("/inexistente").catch((e) => e);
    expect(error instanceof ErrorApi).toBe(true);
    expect(error.estado).toBe(0);
    expect(mensajeDeError(error)).toContain("No se pudo contactar el servidor");
  });

  it("query omite los valores vacíos y une los arreglos por coma", () => {
    expect(query({ categoria: "", pagina: 2 })).toBe("?pagina=2");
    expect(query({ productos: [1, 2, 3] })).toBe("?productos=1%2C2%2C3");
    expect(query({})).toBe("");
  });
});
