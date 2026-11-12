import { render } from "@testing-library/react";
import { MemoryRouter, Routes } from "react-router-dom";
import { CarritoProvider } from "../../context/CarritoContext.jsx";
import { SesionProvider } from "../../context/SesionContext.jsx";
import { rehidratarSesion, restablecerSesion } from "../../services/sesion.js";

/**
 * Utilidades compartidas por las pruebas de componentes (EP2/EP3).
 * No es un archivo de pruebas: solo lo importan los *.test.jsx.
 */

// Mismas claves que CarritoContext (y el sitio legacy).
export const CLAVE_CARRITO = "gh_carrito_v1";
export const CLAVE_CUPON = "gh_cupon_activo_v1";
// Clave de la sesión (EP3 · Parte 4), igual que src/services/sesion.js.
export const CLAVE_SESION = "gh_sesion_v1";

// Almacén falso de la prueba en curso, para no espiar dos veces el mismo método.
let almacenActual = null;

/**
 * Jasmine restaura los spies entre specs, así que el almacén se descarta.
 *
 * La sesión (EP3 · Parte 4) vive en un módulo que lee `localStorage` una sola
 * vez, al importarse: sin este reinicio, el primer spec que inicia sesión
 * dejaría la sesión "pegada" para todos los siguientes del mismo navegador.
 */
afterEach(() => {
  almacenActual = null;
  restablecerSesion();
});

/**
 * Mock de localStorage: reemplaza los métodos reales del navegador por un
 * almacén en memoria. Sirve para dos cosas a la vez:
 *  - aislar cada prueba (el navegador arranca sin datos previos),
 *  - poder verificar las escrituras con jasmine spies.
 */
export function mockLocalStorage() {
  if (almacenActual) return almacenActual;

  const datos = new Map();

  spyOn(window.localStorage, "getItem").and.callFake((clave) =>
    datos.has(clave) ? datos.get(clave) : null
  );
  spyOn(window.localStorage, "setItem").and.callFake((clave, valor) => {
    datos.set(clave, String(valor));
  });
  spyOn(window.localStorage, "removeItem").and.callFake((clave) => {
    datos.delete(clave);
  });
  spyOn(window.localStorage, "clear").and.callFake(() => {
    datos.clear();
  });

  almacenActual = {
    /** Deja un valor ya "guardado" antes de montar el componente. */
    precargar(clave, valor) {
      datos.set(clave, JSON.stringify(valor));
    },
    /** Devuelve el valor guardado, ya parseado (o null). */
    leer(clave) {
      return datos.has(clave) ? JSON.parse(datos.get(clave)) : null;
    },
    /** Claves existentes en el almacén falso. */
    claves() {
      return [...datos.keys()];
    },
  };

  return almacenActual;
}

/** Sustituye window.alert para poder observar sus llamadas sin abrir diálogos. */
export function mockAlert() {
  return spyOn(window, "alert").and.stub();
}

/**
 * Monta un componente con el router y los contextos que la app le da
 * en producción (sesión + carrito), para poder probarlo en condiciones reales.
 */
export function renderConProveedores(ui, { ruta = "/", almacen } = {}) {
  const almacenamiento = almacen || mockLocalStorage();
  // La sesión se lee al importar el módulo: hay que releerla ya con el
  // almacén de esta prueba en su sitio, o el `precargar` no surtiría efecto.
  rehidratarSesion();
  const resultado = render(
    <MemoryRouter initialEntries={[ruta]}>
      <SesionProvider>
        <CarritoProvider>{ui}</CarritoProvider>
      </SesionProvider>
    </MemoryRouter>
  );
  return { ...resultado, almacenamiento };
}

/**
 * Igual que la anterior pero con <Routes>: permite verificar navegación real
 * (por ejemplo, que Checkout lleve a /ordenes) sin espiar useNavigate.
 */
export function renderConRutas(rutas, { ruta = "/", almacen } = {}) {
  const almacenamiento = almacen || mockLocalStorage();
  rehidratarSesion();
  const resultado = render(
    <MemoryRouter initialEntries={[ruta]}>
      <SesionProvider>
        <CarritoProvider>
          <Routes>{rutas}</Routes>
        </CarritoProvider>
      </SesionProvider>
    </MemoryRouter>
  );
  return { ...resultado, almacenamiento };
}
