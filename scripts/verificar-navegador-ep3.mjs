/**
 * Verificación de humo en navegador real del flujo completo de la EP3 (Parte 7).
 *
 * Levanta Chrome headless por CDP (WebSocket nativo de Node, sin dependencias)
 * y recorre la aplicación EN VIVO contra el backend real, comprobando sobre el
 * DOM renderizado:
 *
 *   visitante → catálogo → ficha con reseñas → carrito → login CLIENTE →
 *   checkout → orden real → historial → panel del vendedor → panel admin,
 *   además del menú por rol y los accesos bloqueados.
 *
 * Al final guarda pantallazos en `docs/capturas/` para el manual de usuario.
 *
 * Uso:  node scripts/verificar-navegador-ep3.mjs
 * Requisitos: backend arriba (localhost:8080) y `npm run dev` en localhost:5173.
 */
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PUERTO = 9223;
const APP = "http://localhost:5173";
const CAPTURAS = "docs/capturas";

const perfil = mkdtempSync(join(tmpdir(), "gh-chrome-ep3-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PUERTO}`,
    `--user-data-dir=${perfil}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--window-size=1440,1000",
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

function conectar(url) {
  const ws = new WebSocket(url);
  const pendientes = new Map();
  let siguienteId = 1;

  // Los diálogos nativos (alert) bloquean la página: se aceptan solos.
  let autoAceptar = false;

  ws.addEventListener("message", (evento) => {
    const mensaje = JSON.parse(evento.data);
    if (!mensaje.id) {
      // Evento del navegador (sin id): interesa el diálogo nativo.
      if (autoAceptar && mensaje.method === "Page.javascriptDialogOpening") {
        enviar("Page.handleJavaScriptDialog", { accept: true }).catch(() => {});
      }
      return;
    }
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

  return {
    listo,
    enviar,
    autoAceptarDialogos: () => {
      autoAceptar = true;
    },
    cerrar: () => ws.close(),
  };
}

async function irA(cdp, url, esperaExtra = 1400) {
  await cdp.enviar("Page.navigate", { url });
  await esperar(900);
  for (let intento = 0; intento < 25; intento++) {
    const { result } = await cdp.enviar("Runtime.evaluate", {
      expression: "!!document.querySelector('.acciones-cabecera')",
      returnByValue: true,
    });
    if (result.value) break;
    await esperar(200);
  }
  await esperar(esperaExtra);
}

async function texto(cdp) {
  const { result } = await cdp.enviar("Runtime.evaluate", {
    expression: "document.body.innerText",
    returnByValue: true,
  });
  return result.value ?? "";
}

async function capturar(cdp, nombre) {
  const { data } = await cdp.enviar("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(CAPTURAS, `${nombre}.png`), Buffer.from(data, "base64"));
}

/** Inicia sesión desde la app y espera a que la cabecera refleje la sesión. */
async function ingresarComo(cdp, email) {
  // Cierra la sesión anterior (solo la clave de sesión): cada bloque entra con
  // una cuenta distinta, pero el carrito del visitante debe conservarse.
  await cdp.enviar("Runtime.evaluate", {
    expression: "try { localStorage.removeItem('gh_sesion_v1'); } catch (e) {} true",
    returnByValue: true,
  });
  await irA(cdp, `${APP}/ingresar`);
  await cdp.enviar("Runtime.evaluate", {
    expression: `(async () => {
      const set = (el, valor) => {
        const d = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
        d.set.call(el, valor);
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
  await esperar(1400);
}

const resultados = [];
function comprobar(nombre, condicion, detalle = "") {
  resultados.push({ nombre, ok: Boolean(condicion) });
  console.log(`${condicion ? "OK   " : "FALLA"} ${nombre}${detalle ? ` — ${detalle}` : ""}`);
}

let cdp;
try {
  mkdirSync(CAPTURAS, { recursive: true });
  const destino = await obtenerDestino();
  cdp = conectar(destino);
  await cdp.listo;
  await cdp.enviar("Page.enable");
  await cdp.enviar("Runtime.enable");
  // El checkout usa alert() para confirmar la orden. En headless el diálogo
  // bloquea la página, así que se acepta automáticamente al abrirse.
  await cdp.enviar("Page.setInterceptFileChooserDialog", { enabled: false }).catch(() => {});
  cdp.autoAceptarDialogos?.();

  // --- 1. Catálogo público contra el backend real ---
  await irA(cdp, `${APP}/catalogo`, 2000);
  const catalogo = await texto(cdp);
  comprobar(
    "el catálogo muestra productos del backend",
    catalogo.includes("Notebook") || catalogo.includes("Catálogo de Productos")
  );
  comprobar("el catálogo no queda atascado en 'Cargando'", !catalogo.includes("Cargando catálogo"));
  await capturar(cdp, "01-catalogo");

  // --- 2. Ficha de producto con reseñas reales ---
  await irA(cdp, `${APP}/detalle/1`, 2000);
  const detalle = await texto(cdp);
  comprobar("la ficha carga el producto desde el backend", detalle.includes("Especificaciones"));
  comprobar("la sección de reseñas está presente", detalle.includes("Reseñas de Clientes"));
  await capturar(cdp, "02-detalle");

  // --- 3. Carrito vacío → añadir producto vía la ficha ---
  await cdp.enviar("Runtime.evaluate", {
    expression: `(async () => {
      const boton = [...document.querySelectorAll("button")]
        .find((b) => b.textContent.trim() === "Agregar al carrito");
      if (boton) boton.click();
      await new Promise((r) => setTimeout(r, 600));
      return true;
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  await esperar(800);
  await irA(cdp, `${APP}/carrito`, 1500);
  const carrito = await texto(cdp);
  comprobar("el carrito muestra el producto agregado", !carrito.includes("Tu carrito está actualmente vacío"));
  await capturar(cdp, "03-carrito");

  // --- 4. Login CLIENTE y checkout real ---
  await ingresarComo(cdp, "camila@gamehub.test");
  const trasLogin = await texto(cdp);
  comprobar(
    "el login de cliente muestra su nombre y rol",
    /Camila Rojas/.test(trasLogin) && trasLogin.includes("Cliente")
  );

  await irA(cdp, `${APP}/checkout`, 1500);
  const checkout = await texto(cdp);
  comprobar("el cliente accede al checkout", checkout.includes("Finalizar Compra"));
  await capturar(cdp, "04-checkout");

  // --- 5. Crear la orden rellenando el formulario ---
  const resultadoOrden = await cdp.enviar("Runtime.evaluate", {
    expression: `(async () => {
      const set = (sel, valor) => {
        const el = document.querySelector(sel);
        const d = Object.getOwnPropertyDescriptor(el.constructor.prototype, "value");
        d.set.call(el, valor);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      };
      set("#checkout-nombre", "Camila Rojas");
      set("#checkout-email", "camila@gamehub.test");
      set("#checkout-telefono", "912345678");
      set("#checkout-region", "metropolitana");
      set("#checkout-comuna", "Ñuñoa");
      set("#checkout-direccion", "Av. Los Aromos 1450");
      set("#checkout-pago", "webpay");
      await new Promise((r) => setTimeout(r, 200));
      const boton = [...document.querySelectorAll("button[type=submit]")]
        .find((b) => b.textContent.includes("Confirmar y Pagar"));
      if (boton) boton.click();
      await new Promise((r) => setTimeout(r, 2500));
      return { ruta: location.pathname, texto: document.body.innerText.slice(0, 400) };
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  // El alert() del navegador bloquea: se anula antes de enviar.
  comprobar(
    "el checkout crea la orden real y navega a /ordenes",
    resultadoOrden.result.value?.ruta === "/ordenes",
    JSON.stringify(resultadoOrden.result.value?.ruta)
  );
  await esperar(800);
  const ordenes = await texto(cdp);
  comprobar("el historial muestra las órdenes del cliente", ordenes.includes("Orden #GH-"));
  await capturar(cdp, "05-ordenes");

  // --- 6. Panel del vendedor ---
  await ingresarComo(cdp, "luis@gamehub.test");
  await irA(cdp, `${APP}/vendedor`, 2000);
  const vendedor = await texto(cdp);
  comprobar("el vendedor ve el panel de ventas", vendedor.includes("Panel de Ventas"), vendedor.slice(0, 80).replace(/\n/g, " "));
  comprobar("la bandeja de órdenes carga desde el backend", vendedor.includes("Bandeja de órdenes"));
  await capturar(cdp, "06-vendedor");

  // --- 7. Panel admin ---
  await ingresarComo(cdp, "ana@gamehub.test");
  await irA(cdp, `${APP}/admin`, 2000);
  const admin = await texto(cdp);
  comprobar("el admin ve la gestión de productos", admin.includes("Gestión de productos"));
  comprobar("la tabla de productos carga desde el backend", admin.includes("Catálogo ("));
  await capturar(cdp, "07-admin");

  // --- 8. Regla de acceso: cliente no entra a admin ---
  await ingresarComo(cdp, "camila@gamehub.test");
  await irA(cdp, `${APP}/admin`, 1500);
  const clienteAdmin = await texto(cdp);
  comprobar(
    "un cliente ve 'Acceso restringido' en /admin (no el panel)",
    clienteAdmin.includes("No tienes permiso") && !clienteAdmin.includes("Gestión de productos")
  );
  await capturar(cdp, "08-acceso-restringido");

  const fallidas = resultados.filter((r) => !r.ok).length;
  console.log(`\n=== Resultado navegador: ${resultados.length - fallidas} OK, ${fallidas} fallidas ===`);
  console.log(`Pantallazos en ${CAPTURAS}/\n`);
  cdp.cerrar();
  chrome.kill();
  await esperar(500);
  try {
    rmSync(perfil, { recursive: true, force: true });
  } catch {
    /* en Windows el perfil puede seguir bloqueado un instante: no es un fallo */
  }
  process.exit(fallidas === 0 ? 0 : 1);
} catch (error) {
  console.error("Fallo inesperado del humo de navegador:", error);
  cdp?.cerrar();
  chrome.kill();
  process.exit(1);
}
