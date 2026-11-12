import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import * as catalogo from "../services/catalogoCache.js";
import * as servicioCupones from "../services/cupones.js";
import {
  agregarAlCarrito,
  cambiarCantidad,
  contarItems,
  quitarLinea,
} from "../lib/carrito.js";
import { calcularTotales } from "../lib/cupones.js";

/**
 * Estado global del carrito para toda la app (EP3 · Parte 6).
 *
 * Diferencias con la versión de la EP2:
 *
 * - El catálogo usado para validar stock ya **no** es `src/data/productos.js`:
 *   lo entrega el backend (product-service + inventory-service) a través de
 *   `services/catalogoCache.js`, que además evita repetir la petición en cada
 *   tarjeta del catálogo. Si el backend no está disponible, el catálogo cae a
 *   la semilla local para que el carrito siga siendo usable.
 * - El cupón se valida **contra el servidor** (`promotion-service`); el cálculo
 *   del descuento sigue siendo local (`lib/cupones.js`) porque el total final
 *   lo vuelve a validar el backend al crear la orden.
 *
 * El estado del carrito (líneas y cupón) sigue persistiendo en localStorage con
 * las MISMAS claves del sitio legacy (gh_carrito_v1 / gh_cupon_activo_v1).
 */

const STORAGE_KEY_CARRITO = "gh_carrito_v1";
const STORAGE_KEY_CUPON = "gh_cupon_activo_v1";

function leerStorage(clave, valorPorDefecto) {
  try {
    const data = localStorage.getItem(clave);
    return data ? JSON.parse(data) : valorPorDefecto;
  } catch (e) {
    return valorPorDefecto;
  }
}

function cargarEstadoInicial() {
  return {
    items: leerStorage(STORAGE_KEY_CARRITO, []),
    cupon: leerStorage(STORAGE_KEY_CUPON, null),
  };
}

function reductor(estado, accion) {
  switch (accion.type) {
    case "REEMPLAZAR_ITEMS":
      return { ...estado, items: accion.items };
    case "ESTABLECER_CUPON":
      return { ...estado, cupon: accion.cupon };
    case "VACIAR":
      return { items: [], cupon: null };
    default:
      return estado;
  }
}

const CarritoContext = createContext(null);

export function CarritoProvider({ children }) {
  const [estado, dispatch] = useReducer(reductor, undefined, cargarEstadoInicial);
  // Catálogo para validar stock. Arranca con la semilla local (sincrónica) para
  // que el primer render y las pruebas sin backend funcionen; cuando llegan los
  // datos reales de la API se reemplaza.
  const [productos, setProductos] = useState(() => catalogo.semilla());

  // Sincronización con localStorage (equivalente a guardarCarrito del legacy)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CARRITO, JSON.stringify(estado.items));
  }, [estado.items]);

  useEffect(() => {
    if (estado.cupon) {
      localStorage.setItem(STORAGE_KEY_CUPON, JSON.stringify(estado.cupon));
    } else {
      localStorage.removeItem(STORAGE_KEY_CUPON);
    }
  }, [estado.cupon]);

  // El catálogo real se pide una sola vez (la promesa se memoiza en catalogoCache).
  useEffect(() => {
    let vigente = true;
    catalogo
      .obtener()
      .then((lista) => {
        if (vigente && Array.isArray(lista) && lista.length > 0) setProductos(lista);
      })
      .catch(() => {
        /* sin backend se conserva la semilla local */
      });
    return () => {
      vigente = false;
    };
  }, []);

  const value = useMemo(() => {
    function agregar(idProducto, cantidad = 1) {
      const res = agregarAlCarrito(estado.items, productos, idProducto, cantidad);
      if (res.exito) dispatch({ type: "REEMPLAZAR_ITEMS", items: res.carrito });
      return res;
    }

    function quitar(idProducto) {
      dispatch({ type: "REEMPLAZAR_ITEMS", items: quitarLinea(estado.items, idProducto) });
    }

    function cambiarCantidadItem(idProducto, cantidad) {
      const res = cambiarCantidad(estado.items, productos, idProducto, cantidad);
      if (res.exito) dispatch({ type: "REEMPLAZAR_ITEMS", items: res.carrito });
      return res;
    }

    /**
     * Valida el cupón en el servidor y lo deja aplicado.
     * Devuelve siempre `{ exito, cupon, mensaje }`, igual que la versión local
     * de la EP2 (la vista del carrito no cambia por ser asíncrono).
     */
    async function aplicarCuponCodigo(codigo) {
      const res = await servicioCupones.validar(codigo);
      dispatch({ type: "ESTABLECER_CUPON", cupon: res.exito ? res.cupon : null });
      return res;
    }

    function quitarCupon() {
      dispatch({ type: "ESTABLECER_CUPON", cupon: null });
    }

    function vaciar() {
      dispatch({ type: "VACIAR" });
    }

    return {
      items: estado.items,
      cupon: estado.cupon,
      totalItems: contarItems(estado.items),
      totales: calcularTotales(estado.items, estado.cupon),
      productos,
      agregar,
      quitar,
      cambiarCantidad: cambiarCantidadItem,
      aplicarCupon: aplicarCuponCodigo,
      quitarCupon,
      vaciar,
    };
  }, [estado, productos]);

  return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>;
}

export function useCarrito() {
  const contexto = useContext(CarritoContext);
  if (!contexto) {
    throw new Error("useCarrito debe usarse dentro de <CarritoProvider>");
  }
  return contexto;
}
