/**
 * Verificación de humo del flujo de sesión en un navegador real (EP3 · Partes 4-5).
 *
 * Levanta Chrome headless por CDP (sin dependencias: usa el WebSocket nativo de
 * Node 22+), abre la app en el dev server y comprueba, sobre el DOM renderizado:
 *
 *   1. sin sesión, el menú no ofrece "Administración" y `/admin` redirige a /ingresar;
 *   2. tras un login de CLIENTE, la cabecera muestra su nombre y rol, y `/admin` da 403;
 *   3. tras un login de ADMIN, aparece "Administración" y `/admin` renderiza el panel.
 *
 * Uso: node scripts/verificar-sesion.mjs   (con el backend y `npm run dev` arriba)
 */

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PUERTO = 9222;
const APP = "http://localhost:5173";
const API = "http://localhost:8080/api/v1";

const perfil = mkdtempSync(join(tmpdir(), "gh-chrome-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PUERTO}`,
    `--user-data-dir=${perfil}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "about:blank",
  ],
  { stdio: "ignore" }
);

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function obtenerDestino() {
  for (let intento = 0; intento < 40; intento++) {
    try {
      const lista = await (await fetch(`http://127.0.0.1:${PUERTO}/json/list`)).json();
      const pagina = lista.find((p) => p.type === "page");
      if (pagina?.webSocketDebuggerUrl) return pagina.webSocketDebuggerUrl;
    } catch {
      /* Chrome todavía no escucha */
    }
    await esperar(250);
  }
  throw new Error("Chrome no expuso el puerto de depuración.");
}

/** Cliente CDP mínimo sobre el WebSocket nativo de Node. */
function conectar(url) {
  const ws = new WebSocket(url);
  const pendientes = new Map();
  let siguienteId = 1;

  ws.addEventListener("message", (evento) => {
    const mensaje = JSON.parse(evento.data);
    const pendiente = pendientes.get(mensaje.id);
    if (!pendiente) return;
    pendientes.delete(mensaje.id);
    if (mensaje.error) pendiente.rechazar(new Error(mensaje.error.message));
    else pendiente.resolver(mensaje.result);
  });

  const listo = new Promise((resolver, rechazar) => {
    ws.addEventListener("open", resolver);
    ws.addEventListener("error", () => rechazar(new Error("WebSocket CDP falló")));
  });

  function enviar(metodo, params = {}) {
    const id = siguienteId++;
    return new Promise((resolver, rechazar) => {
      pendientes.set(id, { resolver, rechazar });
      ws.send(JSON.stringify({ id, method: metodo, params }));
    });
  }

  return { listo, enviar, cerrar: () => ws.close() };
}

/** Navega y espera a que la app pinte (Vite + fetch al Gateway tardan un poco). */
async function irA(cdp, url) {
  await cdp.enviar("Page.navigate", { url });
  await esperar(1200);
  // La cabecera la pinta React tras montar; se espera a que exista antes de leer.
  for (let intento = 0; intento < 20; intento++) {
    const { result } = await cdp.enviar("Runtime.evaluate", {
      expression: "!!document.querySelector('.acciones-cabecera')",
      returnByValue: true,
    });
    if (result.value) break;
    await esperar(200);
  }
  await esperar(400);
}

/** Devuelve el texto visible del documento (para comprobar qué se renderizó). */
async function textoVisible(cdp) {
  const { result } = await cdp.enviar("Runtime.evaluate", {
    expression: "document.body.innerText",
    returnByValue: true,
  });
  return result.value ?? "";
}

/**
 * Espera a que la cabecera contenga el fragmento indicado (o se agote el tiempo).
 * La cabecera la pinta React tras leer la sesión, así que puede tardar un poco.
 */
async function esperarEnCabecera(cdp, fragmento, intentos = 25) {
  for (let intento = 0; intento < intentos; intento++) {
    const { result } = await cdp.enviar("Runtime.evaluate", {
      expression: "document.querySelector('.acciones-cabecera')?.textContent ?? ''",
      returnByValue: true,
    });
    if ((result.value ?? "").includes(fragmento)) return true;
    await esperar(200);
  }
  return false;
}

/**
 * Texto del menú de navegación.
 *
 * Se lee `textContent`, no `innerText`: el `<nav>` lleva la clase `collapse` de
 * Bootstrap y, mientras no se despliega, `innerText` puede omitir su contenido.
 */
async function textoDelMenu(cdp) {
  const { result } = await cdp.enviar("Runtime.evaluate", {
    expression: "document.querySelector('.nav-principal')?.textContent ?? ''",
    returnByValue: true,
  });
  return result.value ?? "";
}

/** Inicia sesión desde la propia app, rellenando el formulario y enviándolo. */
async function ingresarComo(cdp, email) {
  await irA(cdp, `${APP}/ingresar`);
  await cdp.enviar("Runtime.evaluate", {
    expression: `(async () => {
      const set = (el, valor) => {
        const descriptor = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, "value");
        descriptor.set.call(el, valor);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      };
      set(document.querySelector("#sesion-email"), ${JSON.stringify(email)});
      set(document.querySelector("#sesion-clave"), "clave123");
      await new Promise((r) => setTimeout(r, 80));
      document.querySelector("form button[type=submit]").click();
      await new Promise((r) => setTimeout(r, 1200));
      return true;
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  // El login navega fuera del formulario: hay que releer el DOM ya en la ruta
  // de destino, no el que devolvió la promesa anterior.
  await esperar(1200);
  return textoVisible(cdp);
}

const resultados = [];
function comprobar(nombre, condicion, detalle = "") {
  resultados.push({ nombre, ok: Boolean(condicion), detalle });
  console.log(`${condicion ? "OK   " : "FALLA"} ${nombre}${detalle ? ` — ${detalle}` : ""}`);
}

let cdp;
try {
  const destino = await obtenerDestino();
  cdp = conectar(destino);
  await cdp.listo;
  await cdp.enviar("Page.enable");
  await cdp.enviar("Runtime.enable");

  // --- 1. Visitante sin sesión -------------------------------------------------
  await irA(cdp, `${APP}/admin`);
  const anonimo = await textoVisible(cdp);
  comprobar(
    "sin sesión, /admin redirige al formulario de ingreso",
    anonimo.includes("Iniciar sesión") && !anonimo.includes("Gestión de productos"),
    anonimo.slice(0, 60).replace(/\n/g, " ")
  );

  await irA(cdp, `${APP}/`);
  const menuAnonimo = await textoDelMenu(cdp);
  comprobar(
    "sin sesión, el menú no ofrece Administración ni Ventas",
    !menuAnonimo.includes("Administración") && !menuAnonimo.includes("Ventas")
  );
  const menuAnonimoNav = await textoDelMenu(cdp);
  comprobar(
    "sin sesión, la cabecera ofrece iniciar sesión",
    menuAnonimoNav.includes("Iniciar sesión") && !menuAnonimoNav.includes("Cerrar sesión")
  );

  // --- 2. Cliente --------------------------------------------------------------
  await ingresarComo(cdp, "camila@gamehub.test");
  comprobar(
    "login CLIENTE deja la sesión activa en la cabecera",
    await esperarEnCabecera(cdp, "Camila Rojas")
  );
  comprobar(
    "la cabecera muestra el rol Cliente",
    await esperarEnCabecera(cdp, "(Cliente)")
  );

  await irA(cdp, `${APP}/admin`);
  const adminCliente = await textoVisible(cdp);
  comprobar(
    "CLIENTE recibe el aviso de acceso restringido en /admin",
    adminCliente.includes("Acceso restringido") &&
      adminCliente.includes("No tienes permiso")
  );

  await irA(cdp, `${APP}/ordenes`);
  const ordenesCliente = await textoVisible(cdp);
  comprobar(
    "CLIENTE sí entra a Mis pedidos",
    !ordenesCliente.includes("Acceso restringido")
  );

  // --- 3. Administrador --------------------------------------------------------
  await cdp.enviar("Runtime.evaluate", { expression: "localStorage.clear()" });
  await ingresarComo(cdp, "ana@gamehub.test");
  comprobar(
    "login ADMIN deja la sesión activa en la cabecera",
    await esperarEnCabecera(cdp, "(Administrador)")
  );
  await irA(cdp, `${APP}/`);
  const menuAdmin = await textoDelMenu(cdp);
  comprobar("ADMIN ve el enlace Administración", menuAdmin.includes("Administración"));
  comprobar("ADMIN ve el enlace Ventas", menuAdmin.includes("Ventas"));

  await irA(cdp, `${APP}/admin`);
  const panelAdmin = await textoVisible(cdp);
  comprobar(
    "ADMIN entra al panel de administración",
    panelAdmin.includes("Administración") && panelAdmin.includes("Gestión de productos")
  );

  // --- 4. Vendedor -------------------------------------------------------------
  await cdp.enviar("Runtime.evaluate", { expression: "localStorage.clear()" });
  await ingresarComo(cdp, "luis@gamehub.test");
  comprobar(
    "login OPERADOR muestra el nombre de la pauta (Vendedor)",
    await esperarEnCabecera(cdp, "(Vendedor)")
  );

  await irA(cdp, `${APP}/`);
  const menuVendedor = await textoDelMenu(cdp);
  comprobar(
    "VENDEDOR no ve Administración pero sí Ventas",
    !menuVendedor.includes("Administración") && menuVendedor.includes("Ventas")
  );

  await irA(cdp, `${APP}/admin`);
  const adminVendedor = await textoVisible(cdp);
  comprobar(
    "VENDEDOR queda bloqueado en /admin",
    adminVendedor.includes("No tienes permiso")
  );

  // --- 5. Persistencia de la sesión (recarga) ----------------------------------
  await cdp.enviar("Page.reload");
  comprobar(
    "la sesión sobrevive a recargar la página",
    await esperarEnCabecera(cdp, "(Vendedor)")
  );
} catch (error) {
  console.log(`ERROR ${error.message}`);
  resultados.push({ nombre: "ejecución", ok: false, detalle: error.message });
} finally {
  cdp?.cerrar();
  chrome.kill();
  await esperar(300);
  try {
    rmSync(perfil, { recursive: true, force: true });
  } catch {
    /* el perfil temporal puede quedar bloqueado un instante en Windows */
  }
}

const fallos = resultados.filter((r) => !r.ok).length;
console.log(`\n== ${resultados.length - fallos} OK, ${fallos} fallos ==`);
process.exit(fallos === 0 ? 0 : 1);
