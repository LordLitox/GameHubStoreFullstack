/**
 * Autenticación y sesión.
 * Backend: `auth-service`.
 *
 * Estos métodos guardan (o borran) la sesión en `src/services/sesion.js`;
 * el contexto de React de la Parte 4 se apoya en ellos.
 */

import { enviar } from "./cliente.js";
import { aSesion } from "./adaptadores.js";
import { cerrarSesion, iniciarSesion, restablecerSesion } from "./sesion.js";

/**
 * Inicia sesión y deja la sesión guardada.
 * @param {{ email: string, clave: string }} credenciales
 */
export async function login({ email, clave }) {
  const dto = await enviar("/auth/login", { email, clave }, { sinAuth: true });
  return iniciarSesion(aSesion(dto));
}

/**
 * Registra una cuenta de cliente y deja la sesión iniciada.
 * Los campos son los del formulario de registro (`RegistroSolicitud`):
 * nombre, email, clave, telefono, region, comuna y direccion.
 */
export async function registro(datos) {
  const dto = await enviar("/auth/registro", datos, { sinAuth: true });
  return iniciarSesion(aSesion(dto));
}

/** Renueva el token antes de que venza y actualiza la sesión guardada. */
export async function renovar() {
  const dto = await enviar("/auth/renovar", undefined);
  return iniciarSesion(aSesion(dto));
}

/** Cierra la sesión local (el JWT es sin estado: no hay que avisarle al servidor). */
export { cerrarSesion, restablecerSesion };
