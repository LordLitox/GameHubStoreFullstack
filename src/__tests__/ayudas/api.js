/**
 * Doble de la API para las pruebas (EP3 · Parte 7).
 *
 * Desde la Parte 6 las vistas hablan con el backend por HTTP, así que las
 * pruebas ya no pueden depender de `src/data/*.js`: necesitan simular las
 * respuestas del Gateway. Este módulo sustituye `window.fetch` por un enrutador
 * en memoria que responde según la ruta y el método.
 *
 *   const api = simularFetch();
 *   api.responder("GET", "/productos", [ { id: 1, nombre: "…" } ]);
 *   api.responder("POST", "/ordenes", (opciones) => ({ numero: "GH-1" }));
 *
 * El enrutador devuelve siempre el mismo formato que `cliente.js` espera:
 * `{ ok, status, text() }` con un cuerpo JSON serializado.
 */

/**
 * Espera a que una condición se cumpla, dejando que React aplique el cambio.
 *
 * Reemplaza a `waitFor` de Testing Library en este proyecto por dos razones:
 *
 *  1. Bajo Karma + ChromeHeadless, `waitFor` no detecta de forma fiable las
 *     actualizaciones de estado que llegan desde una promesa y expira aunque el
 *     DOM ya se haya actualizado.
 *  2. Las vistas hacen `fetch` en un `useEffect` y actualizan estado **fuera**
 *     de `act()` (React avisa "not wrapped in act"). Sin envolver la espera en
 *     `act`, React 18 deja el cambio pendiente y el DOM no se actualiza.
 *
 * Por eso cada turno de sondeo se ejecuta dentro de `act(async …)`: dentro de
 * act, React vacía la cola de actualizaciones y el DOM queda al día.
 *
 *   await esperarHasta(() => screen.getByText("GH-1"));
 *
 * @param {() => any} condicion   Devuelve algo truthy cuando ya se cumplió.
 * @param {{ tiempoMaximo?: number, intervalo?: number, mensaje?: string }} [opciones]
 */
export function esperarHasta(condicion, opciones = {}) {
  const { tiempoMaximo = 1500, intervalo = 25, mensaje = "condición no alcanzada" } = opciones;

  return new Promise((resolve, reject) => {
    const limite = Date.now() + tiempoMaximo;
    let ultimoError = null;

    const id = setInterval(() => {
      try {
        const resultado = condicion();
        if (resultado) {
          clearInterval(id);
          resolve(resultado);
          return;
        }
      } catch (error) {
        ultimoError = error;
      }

      if (Date.now() > limite) {
        clearInterval(id);
        reject(ultimoError ?? new Error(`Tiempo agotado esperando: ${mensaje}`));
      }
    }, intervalo);
  });
}

/** Normaliza la ruta: descarta el prefijo de la URL base y la cadena de query. */
function normalizar(ruta) {
  const sinBase = String(ruta).replace(/^https?:\/\/[^/]+\/api\/v1/, "");
  const [rutaLimpia] = sinBase.split("?");
  return rutaLimpia || "/";
}

/**
 * Instala el doble de `fetch`.
 * @returns {{
 *   responder: (metodo: string, ruta: string, respuesta: any) => void,
 *   responderConError: (metodo: string, ruta: string, estado: number, cuerpo: object) => void,
 *   llamadas: Array<{ metodo: string, ruta: string, cuerpo: any, cabeceras: object }>,
 *   ultimaLlamada: () => object|null,
 * }}
 */
export function simularFetch() {
  const rutas = [];
  const llamadas = [];

  function registrar(metodo, ruta, manejador) {
    rutas.push({ metodo: metodo.toUpperCase(), ruta: normalizar(ruta), manejador });
  }

  /**
   * Respuesta exitosa (200). `respuesta` puede ser:
   *  - un valor (se serializa tal cual),
   *  - una función(opciones) que devuelve el valor, o
   *  - una función(opciones) que devuelve `{ status, cuerpo }` para casos
   *    mixtos (por ejemplo, un 404 según el parámetro de la query).
   */
  function responder(metodo, ruta, respuesta) {
    registrar(metodo, ruta, (opciones) => {
      const valor = typeof respuesta === "function" ? respuesta(opciones) : respuesta;
      if (valor && typeof valor === "object" && "status" in valor && "cuerpo" in valor) {
        return valor;
      }
      return { status: 200, cuerpo: valor };
    });
  }

  /** Respuesta de error con el formato del backend `{ mensaje, errores }`. */
  function responderConError(metodo, ruta, estado, cuerpo) {
    registrar(metodo, ruta, () => ({ status: estado, cuerpo: cuerpo ?? {} }));
  }

  const fetchFalso = (url, opciones = {}) => {
    const metodo = (opciones.method || "GET").toUpperCase();
    const ruta = normalizar(url);
    const cuerpoEnviado = opciones.body ? JSON.parse(opciones.body) : undefined;

    llamadas.push({ metodo, ruta, cuerpo: cuerpoEnviado, cabeceras: opciones.headers });

    // Gana la ÚLTIMA ruta registrada para ese método+ruta: así una prueba puede
    // sobrescribir con `responderConError` la respuesta por defecto del arreglo.
    const candidatas = rutas.filter((r) => r.metodo === metodo && r.ruta === ruta);
    const coincidencia = candidatas[candidatas.length - 1];

    if (!coincidencia) {
      // Una ruta no simulada es un fallo de red explícito: el cliente la
      // convierte en ErrorApi con `estado: 0`.
      return Promise.reject(new TypeError(`Ruta no simulada: ${metodo} ${ruta}`));
    }

    const resultado = coincidencia.manejador({ metodo, ruta, cuerpo: cuerpoEnviado, url });
    const { status, cuerpo } = resultado;

    // La respuesta se entrega en una macrotarea (setTimeout 0), igual que un
    // fetch real: así el estado se actualiza después de que la prueba ceda el
    // hilo y  pueda observarlo.
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: status >= 200 && status < 300,
          status,
          text: () => Promise.resolve(cuerpo === null ? "" : JSON.stringify(cuerpo)),
        });
      }, 0);
    });
  };

  spyOn(window, "fetch").and.callFake(fetchFalso);

  return {
    responder,
    responderConError,
    llamadas,
    ultimaLlamada: () => llamadas[llamadas.length - 1] ?? null,
  };
}

// ---------------------------------------------------------------------------
// Respuestas de fábrica: reproducen la forma que entrega cada microservicio.
// ---------------------------------------------------------------------------

/** Producto como lo devuelve product-service (ProductoResumenDto). */
export function productoDto(overrides = {}) {
  return {
    id: 1,
    sku: "TEC-001",
    nombre: "Teclado Mecánico RGB",
    marca: "Logitech",
    categoria: "Periféricos",
    categoriaSlug: "perifericos",
    precio: 100000,
    precioNormal: null,
    imagen: "teclado",
    resumen: "Teclado gamer",
    descripcion: "Teclado mecánico retroiluminado.",
    especificaciones: [{ clave: "switch", valor: "Red" }],
    ofertaHasta: null,
    ...overrides,
  };
}

/** Reseña como la devuelve review-service (ResenaDto). */
export function resenaDto(overrides = {}) {
  return {
    id: 10,
    autor: "Felipe R.",
    puntuacion: 5,
    comentario: "Excelente producto.",
    fecha: "2026-08-28T12:00:00",
    estado: "APROBADA",
    ...overrides,
  };
}

/** Orden como la devuelve order-service (OrdenResumenDto). */
export function ordenResumenDto(overrides = {}) {
  return {
    id: 20,
    numero: "GH-2026-000020",
    creadaEn: "2026-09-02T10:00:00",
    estado: "PAGADA",
    total: 100000,
    unidades: 1,
    ...overrides,
  };
}

/** Cupón como lo devuelve promotion-service (CuponDto). */
export function cuponDto(overrides = {}) {
  return {
    codigo: "GAMEHUB20",
    porcentaje: 20,
    tope: 50000,
    inicio: "2026-01-01",
    termino: "2099-12-31",
    ...overrides,
  };
}
