/**
 * Verificación de humo del flujo completo de la EP3 (Parte 7).
 *
 * Recorre, contra el backend REAL levantado en `localhost:8080`, el mismo
 * camino que hace el frontend: catálogo → detalle → carrito → cupón →
 * checkout → orden → historial → panel del vendedor → panel admin, además de
 * las reglas de acceso por rol. Replica las llamadas del `src/services/` para
 * comprobar que el contrato del Gateway responde como el frontend espera.
 *
 * Uso:  node scripts/verificar-flujo-ep3.mjs
 * Requisitos: los 12 servicios del backend arriba (ver GUIA/arranque local).
 */
const API = "http://localhost:8080/api/v1";
const CLAVE = "clave123";

const CUENTAS = {
  admin: "ana@gamehub.test",
  vendedor: "luis@gamehub.test",
  cliente: "camila@gamehub.test",
};

let correctas = 0;
let fallidas = 0;

function comprobar(condicion, descripcion, extra = "") {
  if (condicion) {
    correctas++;
    console.log(`  OK  ${descripcion}`);
  } else {
    fallidas++;
    console.log(`  X   ${descripcion}${extra ? ` — ${extra}` : ""}`);
  }
}

async function pedir(ruta, { metodo = "GET", cuerpo, token } = {}) {
  const cabeceras = { Accept: "application/json" };
  if (cuerpo) cabeceras["Content-Type"] = "application/json";
  if (token) cabeceras.Authorization = `Bearer ${token}`;
  const respuesta = await fetch(API + ruta, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }
  return { estado: respuesta.status, ok: respuesta.ok, datos };
}

async function login(email) {
  const { datos } = await pedir("/auth/login", {
    metodo: "POST",
    cuerpo: { email, clave: CLAVE },
  });
  return datos?.token ?? null;
}

async function principal() {
  console.log("\n=== EP3 · verificación de flujo contra el backend real ===\n");

  // --- Sesiones por rol ---
  const tokenAdmin = await login(CUENTAS.admin);
  const tokenVendedor = await login(CUENTAS.vendedor);
  const tokenCliente = await login(CUENTAS.cliente);
  comprobar(tokenAdmin, "login ADMIN (ana@gamehub.test)");
  comprobar(tokenVendedor, "login VENDEDOR/OPERADOR (luis@gamehub.test)");
  comprobar(tokenCliente, "login CLIENTE (camila@gamehub.test)");

  // --- Catálogo público ---
  const catalogo = await pedir("/productos");
  comprobar(catalogo.ok && Array.isArray(catalogo.datos) && catalogo.datos.length > 0,
    `catálogo público devuelve productos (${catalogo.datos?.length ?? 0})`);
  const producto = catalogo.datos?.[0];

  const categorias = await pedir("/categorias");
  comprobar(categorias.ok && categorias.datos?.length > 0, "listado de categorías");

  const stock = await pedir(`/inventario/stock?productos=${producto?.id}`);
  comprobar(stock.ok && stock.datos?.length > 0, "stock de inventory-service");

  const detalle = await pedir(`/productos/${producto?.id}`);
  comprobar(detalle.ok && detalle.datos?.id === producto?.id, "detalle de producto");

  const resenas = await pedir(`/productos/${producto?.id}/resenas`);
  comprobar(resenas.ok && Array.isArray(resenas.datos), "reseñas del producto");

  // --- Carrito y cupón ---
  const validacion = await pedir("/carrito/validar", {
    metodo: "POST",
    cuerpo: { lineas: [{ productoId: producto?.id, cantidad: 1 }], cupon: null },
  });
  comprobar(validacion.ok && validacion.datos?.valido === true, "validación del carrito");

  const cupon = await pedir("/promociones/validar?codigo=GAMEHUB20");
  const cuponExiste = cupon.ok || cupon.estado === 404;
  comprobar(cuponExiste, `validación de cupón responde (estado ${cupon.estado})`);

  // --- Crear orden (CLIENTE) ---
  const orden = await pedir("/ordenes", {
    metodo: "POST",
    token: tokenCliente,
    cuerpo: {
      lineas: [{ productoId: producto?.id, cantidad: 1 }],
      cupon: null,
      metodoPago: "DEBITO",
      despacho: {
        nombre: "Camila Rojas",
        correo: "camila@gamehub.test",
        telefono: "912345678",
        region: "Región Metropolitana",
        comuna: "Ñuñoa",
        direccion: "Av. Los Aromos 1450, depto. 32",
      },
    },
  });
  comprobar(orden.ok && /^GH-/.test(orden.datos?.numero ?? ""),
    `orden creada ${orden.datos?.numero ?? ""} (pago ${orden.datos?.pago?.estado ?? "?"})`,
    JSON.stringify(orden.datos?.mensaje ?? ""));

  const historial = await pedir("/ordenes/mias", { token: tokenCliente });
  comprobar(historial.ok && Array.isArray(historial.datos) && historial.datos.length > 0,
    `historial del cliente (${historial.datos?.length ?? 0} órdenes)`);

  // --- Reglas de acceso por rol ---
  const sinToken = await pedir("/ordenes/mias");
  comprobar(sinToken.estado === 401, "sin token → 401 en /ordenes/mias");

  const clienteEnAdmin = await pedir("/admin/productos", { token: tokenCliente });
  comprobar(clienteEnAdmin.estado === 403, "CLIENTE → 403 en /admin/productos");

  const vendedorEnAdmin = await pedir("/admin/productos", { token: tokenVendedor });
  comprobar(vendedorEnAdmin.estado === 403, "OPERADOR → 403 en /admin/productos");

  const adminEnAdmin = await pedir("/admin/productos", { token: tokenAdmin });
  comprobar(adminEnAdmin.ok && Array.isArray(adminEnAdmin.datos), "ADMIN → 200 en /admin/productos");

  // --- Panel del vendedor ---
  const resumenVendedor = await pedir("/operador/resumen", { token: tokenVendedor });
  comprobar(resumenVendedor.ok, "OPERADOR accede a /operador/resumen");

  const bandeja = await pedir("/operador/ordenes", { token: tokenVendedor });
  comprobar(bandeja.ok && Array.isArray(bandeja.datos), "bandeja de órdenes del vendedor");

  const inventario = await pedir("/operador/inventario", { token: tokenVendedor });
  comprobar(inventario.ok && Array.isArray(inventario.datos), "inventario del vendedor");

  const clienteEnOperador = await pedir("/operador/resumen", { token: tokenCliente });
  comprobar(clienteEnOperador.estado === 403, "CLIENTE → 403 en el panel del vendedor");

  // --- Cuenta desactivada ---
  const desactivada = await pedir("/auth/login", {
    metodo: "POST",
    cuerpo: { email: "pedro@gamehub.test", clave: CLAVE },
  });
  comprobar(desactivada.estado === 401 || desactivada.estado === 403,
    "cuenta desactivada no puede iniciar sesión");

  console.log(`\n=== Resultado: ${correctas} OK, ${fallidas} fallidas ===\n`);
  process.exit(fallidas === 0 ? 0 : 1);
}

principal().catch((error) => {
  console.error("Fallo inesperado del humo:", error);
  process.exit(1);
});
