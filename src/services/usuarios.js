/**
 * Perfil del cliente autenticado.
 * Backend: `user-service`. Requiere sesión (rol CLIENTE).
 */

import { obtener, reemplazar } from "./cliente.js";
import { actualizarUsuario } from "./sesion.js";

/** Perfil del usuario con sesión (`{ id, nombre, email, telefono, region, comuna, direccion }`). */
export async function perfil() {
  return obtener("/usuarios/perfil");
}

/** Guarda los cambios del perfil y refresca el usuario de la sesión. */
export async function actualizarPerfil(datos) {
  const guardado = await reemplazar("/usuarios/perfil", datos);
  if (guardado) actualizarUsuario({ ...guardado, rolVisible: undefined });
  return guardado;
}
