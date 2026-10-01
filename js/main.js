/* ==========================================================================
   GameHub Store — main.js
   JavaScript Vanilla. Comportamiento común a las 6 vistas: menú móvil.
   Cada vista específica (catálogo, detalle, carrito, checkout, órdenes)
   debe cargar además su propio archivo JS con la lógica de esa página.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const botonMenu = document.getElementById("botonMenu");
  const navPrincipal = document.getElementById("navPrincipal");

  if (!botonMenu || !navPrincipal) return;

  botonMenu.addEventListener("click", () => {
    const estaAbierto = navPrincipal.classList.toggle("esta-abierto");
    botonMenu.setAttribute("aria-expanded", String(estaAbierto));
  });

  // Cierra el menú móvil al navegar (mejora la experiencia en pantallas pequeñas)
  navPrincipal.querySelectorAll("a").forEach((enlace) => {
    enlace.addEventListener("click", () => {
      navPrincipal.classList.remove("esta-abierto");
      botonMenu.setAttribute("aria-expanded", "false");
    });
  });
});
