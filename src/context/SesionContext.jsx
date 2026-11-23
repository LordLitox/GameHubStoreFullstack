import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as autenticacion from "../services/autenticacion.js";
import {
  alCambiarSesion,
  cerrarSesion as cerrarSesionLocal,
  sesionActual,
} from "../services/sesion.js";
import { nombreRol } from "../services/adaptadores.js";

/**
 * Sesión del usuario para toda la aplicación (EP3 · Parte 4).
 *
 * La verdad sobre el token vive en `src/services/sesion.js` (sin React, porque
 * el cliente HTTP lo necesita). Este contexto solo la **observa**: se suscribe
 * a los cambios de sesión y los vuelca en el estado de React para que las
 * vistas se vuelvan a pintar al entrar, salir o renovar.
 *
 * Ventaja de ese reparto: si el backend responde 401 en mitad de una petición
 * cualquiera, `cliente.js` cierra la sesión y la interfaz reacciona sola, sin
 * que ninguna vista tenga que avisar.
 *
 * Como la sesión se guarda en `localStorage`, recargar la página no la pierde:
 * el estado inicial se lee de ahí (rehidratación).
 */

const SesionContext = createContext(null);

export function SesionProvider({ children }) {
  const [sesion, setSesion] = useState(() => sesionActual());
  const [renovando, setRenovando] = useState(false);

  // La sesión cambia desde fuera de React (login, logout, 401): nos suscribimos.
  useEffect(() => alCambiarSesion(setSesion), []);

  const valor = useMemo(() => {
    const usuario = sesion.usuario;
    const rol = usuario?.rol ?? null;

    return {
      usuario,
      rol,
      rolVisible: nombreRol(rol),
      token: sesion.token,
      autenticado: Boolean(sesion.token),
      /** Aviso del último cierre de sesión forzado (`"expirada"`). */
      motivoSalida: sesion.motivo ?? null,
      renovando,

      /** `true` si hay sesión y el rol coincide con alguno de los indicados. */
      tieneRol: (...roles) => Boolean(rol) && roles.flat().includes(rol),

      /** Entra con correo y clave. Los errores del backend llegan como `ErrorApi`. */
      async entrar(credenciales) {
        return autenticacion.login(credenciales);
      },

      /** Crea la cuenta de cliente y deja la sesión iniciada. */
      async registrar(datos) {
        return autenticacion.registro(datos);
      },

      /**
       * Pide un token nuevo antes de que venza. Se apoya en el endpoint
       * `/auth/renovar`, que exige un token vigente.
       */
      async renovar() {
        setRenovando(true);
        try {
          return await autenticacion.renovar();
        } finally {
          setRenovando(false);
        }
      },

      salir() {
        return cerrarSesionLocal("manual");
      },
    };
  }, [sesion, renovando]);

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export function useSesion() {
  const contexto = useContext(SesionContext);
  if (!contexto) {
    throw new Error("useSesion debe usarse dentro de <SesionProvider>");
  }
  return contexto;
}
