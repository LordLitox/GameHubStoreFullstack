/**
 * Persistencia de la sesión (token + usuario).
 *
 * Es una pieza **sin React** a propósito: el cliente HTTP necesita leer el
 * token sin depender del árbol de componentes. En la Parte 4 se construye
 * encima el contexto de React que avisa a las vistas cuando la sesión cambia.
 *
 * La sesión sobrevive a recargar la página porque vive en `localStorage`.
 */

const CLAVE_SESION = "gh_sesion_v1";

/** Sesión vacía (visitante). */
const SESION_VACIA = { token: null, usuario: null };

let sesion = leerDeStorage();
const suscriptores = new Set();

function leerDeStorage() {
  try {
    const crudo = localStorage.getItem(CLAVE_SESION);
    if (!crudo) return { ...SESION_VACIA };
    const guardada = JSON.parse(crudo);
    if (!guardada || typeof guardada.token !== "string") return { ...SESION_VACIA };
    return { token: guardada.token, usuario: guardada.usuario ?? null };
  } catch {
    return { ...SESION_VACIA };
  }
}

function escribirEnStorage(nueva) {
  try {
    if (nueva.token) {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(nueva));
    } else {
      localStorage.removeItem(CLAVE_SESION);
    }
  } catch {
    // Modo privado o cuota llena: la sesión sigue viva en memoria.
  }
}

function publicar() {
  suscriptores.forEach((aviso) => aviso({ ...sesion }));
}

/** Sesión actual (copia inmutable). */
export function sesionActual() {
  return { ...sesion };
}

/** Token vigente o `null`. Lo usa el cliente HTTP en cada petición. */
export function tokenActual() {
  return sesion.token;
}

/** Usuario de la sesión (`{ id, nombre, email, rol }`) o `null`. */
export function usuarioActual() {
  return sesion.usuario;
}

/**
 * Guarda la sesión que devolvió `login`, `registro` o `renovar`.
 * @param {{ token: string, usuario: object }} datos
 */
export function iniciarSesion(datos) {
  sesion = { token: datos.token, usuario: datos.usuario ?? null };
  escribirEnStorage(sesion);
  publicar();
  return sesionActual();
}

/** Actualiza solo los datos del usuario (por ejemplo tras editar el perfil). */
export function actualizarUsuario(usuario) {
  if (!sesion.token) return sesionActual();
  sesion = { ...sesion, usuario };
  escribirEnStorage(sesion);
  publicar();
  return sesionActual();
}

/**
 * Cierra la sesión.
 * @param {string} [motivo] `"expirada"` cuando la cerró el servidor (HTTP 401);
 *   las vistas lo usan para mostrar el aviso correspondiente.
 */
export function cerrarSesion(motivo = "manual") {
  if (!sesion.token && !sesion.usuario) return sesionActual();
  sesion = { ...SESION_VACIA };
  escribirEnStorage(sesion);
  suscriptores.forEach((aviso) => aviso({ ...sesion, motivo }));
  return sesionActual();
}

/** Atajo que usa el cliente HTTP cuando el servidor responde 401. */
export function cerrarSesionPorExpiracion() {
  return cerrarSesion("expirada");
}

/**
 * Suscribe una función a los cambios de sesión (entrar, salir, renovar).
 * @returns {() => void} Función para cancelar la suscripción.
 */
export function alCambiarSesion(aviso) {
  suscriptores.add(aviso);
  return () => suscriptores.delete(aviso);
}

/** Borra la sesión guardada. Pensado para las pruebas. */
export function restablecerSesion() {
  sesion = { ...SESION_VACIA };
  try {
    localStorage.removeItem(CLAVE_SESION);
  } catch {
    /* sin localStorage no hay nada que borrar */
  }
}

/**
 * Vuelve a leer la sesión desde `localStorage`.
 *
 * El estado inicial se lee una sola vez, al importar el módulo. Las pruebas
 * necesitan forzar esa lectura después de preparar su almacén falso, y en la
 * aplicación sirve para rehidratar tras un evento externo (por ejemplo, otra
 * pestaña que inició sesión).
 */
export function rehidratarSesion() {
  sesion = leerDeStorage();
  publicar();
  return sesionActual();
}
