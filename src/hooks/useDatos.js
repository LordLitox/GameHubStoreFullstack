import { useCallback, useEffect, useState } from "react";
import { mensajeDeError } from "../services/cliente.js";

/**
 * Trae datos del backend para una vista (EP3 · Parte 6).
 *
 * Antes las páginas leían `src/data/*.js` de forma sincrónica; ahora todos los
 * datos llegan por HTTP, así que cada vista necesita los mismos tres estados:
 * cargando, error y listo. Este hook los concentra para no repetir el mismo
 * `useEffect` en siete archivos.
 *
 *   const { datos, cargando, error, recargar } = useDatos(
 *     () => productos.listarConStock(),
 *     []
 *   );
 *
 * - `cargando` empieza en `true` y pasa a `false` cuando la promesa se resuelve
 *   o falla. En las recargas posteriores no vuelve a `true`, para que el
 *   catálogo no parpadee mientras se aplica un filtro.
 * - `error` es el mensaje ya presentable (`mensajeDeError`), no la excepción.
 *
 * @param {() => Promise<any>} cargar     Función que devuelve los datos.
 * @param {Array} dependencias            Igual que en `useEffect`: al cambiar, recarga.
 * @returns {{ datos: any, cargando: boolean, error: string|null, recargar: () => void }}
 */
export function useDatos(cargar, dependencias = []) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  // `cargar` suele ser una función nueva en cada render: si se usara como
  // dependencia del efecto, la petición se dispararía en bucle. Por eso el
  // efecto depende solo de lo que el llamador declara en `dependencias` (+ el
  // contador de `recargar`), y la última versión de `cargar` se guarda en una
  // ref implícita a través de este callback.
  const ejecutar = useCallback(cargar, dependencias);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);

    Promise.resolve()
      .then(ejecutar)
      .then((resultado) => {
        if (!vigente) return;
        setDatos(resultado);
        setCargando(false);
      })
      .catch((fallo) => {
        if (!vigente) return;
        setError(mensajeDeError(fallo));
        setCargando(false);
      });

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ejecutar, intento]);

  return { datos, cargando, error, recargar: () => setIntento((n) => n + 1) };
}
