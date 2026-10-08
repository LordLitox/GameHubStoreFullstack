import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { PRODUCTOS } from "../data/productos.js";
import { CUPONES } from "../data/cupones.js";
import {
  agregarAlCarrito,
  cambiarCantidad,
  contarItems,
  quitarLinea,
} from "../lib/carrito.js";
import { aplicarCupon, calcularTotales } from "../lib/cupones.js";

/**
 * Estado global del carrito para toda la app.
 *
 * - La lógica de negocio vive en src/lib/ (funciones puras); este contexto
 *   solo la orquesta y expone una API cómoda para los componentes.
 * - Persiste en localStorage con las MISMAS claves que el sitio legacy
 *   (gh_carrito_v1 / gh_cupon_activo_v1), de modo que un carrito armado
 *   en la versión anterior se conserva al entrar a la nueva.
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

  const value = useMemo(() => {
    function agregar(idProducto, cantidad = 1) {
      const res = agregarAlCarrito(estado.items, PRODUCTOS, idProducto, cantidad);
      if (res.exito) dispatch({ type: "REEMPLAZAR_ITEMS", items: res.carrito });
      return res;
    }

    function quitar(idProducto) {
      dispatch({ type: "REEMPLAZAR_ITEMS", items: quitarLinea(estado.items, idProducto) });
    }

    function cambiarCantidadItem(idProducto, cantidad) {
      const res = cambiarCantidad(estado.items, PRODUCTOS, idProducto, cantidad);
      if (res.exito) dispatch({ type: "REEMPLAZAR_ITEMS", items: res.carrito });
      return res;
    }

    function aplicarCuponCodigo(codigo) {
      const res = aplicarCupon(CUPONES, codigo);
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
      agregar,
      quitar,
      cambiarCantidad: cambiarCantidadItem,
      aplicarCupon: aplicarCuponCodigo,
      quitarCupon,
      vaciar,
    };
  }, [estado]);

  return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>;
}

export function useCarrito() {
  const contexto = useContext(CarritoContext);
  if (!contexto) {
    throw new Error("useCarrito debe usarse dentro de <CarritoProvider>");
  }
  return contexto;
}
