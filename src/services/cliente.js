/**
 * Cliente HTTP único de la aplicación (EP3 · Parte 3).
 *
 * Todo el frontend habla **solo** con el API Gateway: no hay ni una llamada
 * directa a un microservicio. Aquí se concentran tres cosas:
 *
 *  1. la URL base versionada (`/api/v1`, configurable con `VITE_API_URL`);
 *  2. la cabecera `Authorization: Bearer <token>` de la sesión activa;
 *  3. el formato de error del backend `{ mensaje, errores }`, que se convierte
 *     en un `ErrorApi` para que las vistas no tengan que saber de códigos HTTP.
 */

import { tokenActual, cerrarSesionPorExpiracion } from "./sesion.js";

/** URL base de la API. En producción se cambia con la variable `VITE_API_URL`. */
export const URL_API = (
  import.meta.env?.VITE_API_URL ?? "http://localhost:8080/api/v1"
).replace(/\/+$/, "");

/**
 * Error de la API. Lleva el código HTTP y, en los errores de validación, el
 * detalle por campo que entrega el backend en `errores`.
 */
export class ErrorApi extends Error {
  constructor(mensaje, { estado = 0, errores = null } = {}) {
    super(mensaje);
    this.name = "ErrorApi";
    this.estado = estado;
    this.errores = errores;
  }

  /** `true` cuando el backend rechazó por reglas de negocio del cuerpo enviado. */
  get esValidacion() {
    return this.estado === 400 && this.errores !== null;
  }

  /** `true` cuando no hubo sesión o el token ya venció. */
  get esSinSesion() {
    return this.estado === 401;
  }

  /** `true` cuando hay sesión pero el rol no alcanza. */
  get esSinPermiso() {
    return this.estado === 403;
  }
}

/** Texto presentable de cualquier fallo, sin exponer detalles técnicos. */
export function mensajeDeError(error) {
  if (error instanceof ErrorApi) return error.message;
  if (error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}

async function leerCuerpo(respuesta) {
  if (respuesta.status === 204) return null;
  const texto = await respuesta.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    // Una respuesta que no es JSON (por ejemplo el HTML de un 502 del proxy)
    // no debe romper la aplicación.
    return { mensaje: texto.slice(0, 200) };
  }
}

/**
 * Ejecuta una petición contra el Gateway.
 *
 * @param {string} ruta        Ruta relativa a la URL base, por ejemplo `/productos`.
 * @param {object} [opciones]
 * @param {string} [opciones.metodo="GET"]
 * @param {object} [opciones.cuerpo]      Se serializa a JSON.
 * @param {object} [opciones.cabeceras]   Cabeceras extra.
 * @param {boolean} [opciones.sinAuth]    Omite el `Bearer` (login, registro, catálogo).
 * @param {AbortSignal} [opciones.senal]  Para cancelar la petición.
 * @returns {Promise<any>} El cuerpo ya convertido desde JSON (`null` si no hay).
 * @throws {ErrorApi}
 */
export async function peticion(ruta, opciones = {}) {
  const {
    metodo = "GET",
    cuerpo,
    cabeceras = {},
    sinAuth = false,
    senal,
  } = opciones;

  const envio = new Headers({ Accept: "application/json" });
  if (cuerpo !== undefined) envio.set("Content-Type", "application/json");

  const token = sinAuth ? null : tokenActual();
  if (token) envio.set("Authorization", `Bearer ${token}`);
  new Headers(cabeceras).forEach((valor, clave) => envio.set(clave, valor));

  let respuesta;
  try {
    respuesta = await fetch(URL_API + ruta, {
      method: metodo,
      headers: envio,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: senal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ErrorApi(
      "No se pudo contactar el servidor. Revisa que el backend esté en línea.",
      { estado: 0 }
    );
  }

  const datos = await leerCuerpo(respuesta);

  if (respuesta.ok) return datos;

  const mensaje =
    (datos && typeof datos.mensaje === "string" && datos.mensaje) ||
    `La operación falló (HTTP ${respuesta.status}).`;

  // El token existía y el servidor lo rechazó: la sesión venció.
  if (respuesta.status === 401 && token) cerrarSesionPorExpiracion();

  throw new ErrorApi(mensaje, {
    estado: respuesta.status,
    errores: (datos && datos.errores) || null,
  });
}

/** Atajos por verbo, para que los módulos de recurso queden declarativos. */
export const obtener = (ruta, opciones) => peticion(ruta, opciones);
export const enviar = (ruta, cuerpo, opciones) =>
  peticion(ruta, { ...opciones, metodo: "POST", cuerpo });
export const reemplazar = (ruta, cuerpo, opciones) =>
  peticion(ruta, { ...opciones, metodo: "PUT", cuerpo });
export const modificar = (ruta, cuerpo, opciones) =>
  peticion(ruta, { ...opciones, metodo: "PATCH", cuerpo });
export const borrar = (ruta, opciones) =>
  peticion(ruta, { ...opciones, metodo: "DELETE" });

/** Arma un `?a=1&b=2` omitiendo los valores vacíos. */
export function query(parametros = {}) {
  const partes = new URLSearchParams();
  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor === undefined || valor === null || valor === "") return;
    partes.set(clave, Array.isArray(valor) ? valor.join(",") : String(valor));
  });
  const texto = partes.toString();
  return texto ? `?${texto}` : "";
}
