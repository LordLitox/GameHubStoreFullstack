/**
 * GameHub Store — js/validaciones.js
 * Validaciones nativas en cliente para la entrega EP1.
 */

// Utilidad para mostrar u ocultar errores accesibles
function gestionarErrorCampo(input, esValido, mensaje = "") {
  const contenedor = input.closest(".campo-formulario");
  if (!contenedor) return;

  const idError = `error-${input.name || input.id}`;
  let elementoError = document.getElementById(idError);

  if (!elementoError) {
    elementoError = contenedor.querySelector(".texto-error");
  }

  if (!esValido) {
    input.setAttribute("aria-invalid", "true");
    if (elementoError) {
      elementoError.textContent = mensaje;
      elementoError.style.display = "flex";
    }
  } else {
    input.removeAttribute("aria-invalid");
    if (elementoError) {
      elementoError.textContent = "";
      elementoError.style.display = "none";
    }
  }
}

// 1. VALIDACIÓN FORMULARIO CHECKOUT
function inicializarValidacionCheckout() {
  const form = document.getElementById("formulario-checkout");
  if (!form) return;

  const nombre = document.getElementById("checkout-nombre");
  const email = document.getElementById("checkout-email");
  const telefono = document.getElementById("checkout-telefono");
  const region = document.getElementById("checkout-region");
  const comuna = document.getElementById("checkout-comuna");
  const direccion = document.getElementById("checkout-direccion");
  const pago = document.getElementById("checkout-pago");
  const alertaVacio = document.getElementById("alerta-carrito-vacio");
  const btnSubmit = document.getElementById("btn-confirmar-orden");

  // Reglas unitarias
  function validarNombre() {
    const val = nombre.value.trim();
    if (val === "") {
      gestionarErrorCampo(nombre, false, "El nombre completo es obligatorio.");
      return false;
    }
    if (val.length < 5 || !val.includes(" ")) {
      gestionarErrorCampo(nombre, false, "Ingresa al menos nombre y apellido válidos.");
      return false;
    }
    gestionarErrorCampo(nombre, true);
    return true;
  }

  function validarEmail() {
    const val = email.value.trim();
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (val === "") {
      gestionarErrorCampo(email, false, "El correo electrónico es obligatorio.");
      return false;
    }
    if (!regexEmail.test(val)) {
      gestionarErrorCampo(email, false, "Formato de correo no válido (ej. usuario@dominio.cl).");
      return false;
    }
    gestionarErrorCampo(email, true);
    return true;
  }

  function validarTelefono() {
    const val = telefono.value.trim();
    const regexTel = /^9\d{8}$/; // Formato móvil Chile: 9 dígitos comenzando con 9
    if (val === "") {
      gestionarErrorCampo(telefono, false, "El número de teléfono es obligatorio.");
      return false;
    }
    if (!regexTel.test(val)) {
      gestionarErrorCampo(telefono, false, "Debe tener exactamente 9 dígitos y comenzar con 9.");
      return false;
    }
    gestionarErrorCampo(telefono, true);
    return true;
  }

  function validarSelect(elem, campo) {
    if (elem.value === "") {
      gestionarErrorCampo(elem, false, `Debes seleccionar una opción de ${campo}.`);
      return false;
    }
    gestionarErrorCampo(elem, true);
    return true;
  }

  function validarTextoSimple(elem, campo) {
    if (elem.value.trim().length < 4) {
      gestionarErrorCampo(elem, false, `La ${campo} debe contener al menos 4 caracteres.`);
      return false;
    }
    gestionarErrorCampo(elem, true);
    return true;
  }

  // Escuchadores en tiempo real
  nombre.addEventListener("blur", validarNombre);
  nombre.addEventListener("input", () => { if (nombre.getAttribute("aria-invalid")) validarNombre(); });

  email.addEventListener("blur", validarEmail);
  email.addEventListener("input", () => { if (email.getAttribute("aria-invalid")) validarEmail(); });

  telefono.addEventListener("blur", validarTelefono);
  telefono.addEventListener("input", () => { if (telefono.getAttribute("aria-invalid")) validarTelefono(); });

  region.addEventListener("change", () => validarSelect(region, "región"));
  comuna.addEventListener("blur", () => validarTextoSimple(comuna, "comuna"));
  direccion.addEventListener("blur", () => validarTextoSimple(direccion, "dirección"));
  pago.addEventListener("change", () => validarSelect(pago, "método de pago"));

  // Verificación de carrito al renderizar el checkout
  function actualizarResumenCheckout() {
    const carrito = obtenerCarrito();
    const contenedorItems = document.getElementById("checkout-items-resumen");
    const subtotalEl = document.getElementById("resumen-subtotal");
    const descEl = document.getElementById("resumen-descuento");
    const totalEl = document.getElementById("resumen-total");

    if (carrito.length === 0) {
      if (alertaVacio) alertaVacio.style.display = "flex";
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.classList.add("boton-deshabilitado");
      }
    } else {
      if (alertaVacio) alertaVacio.style.display = "none";
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.classList.remove("boton-deshabilitado");
      }
    }

    if (contenedorItems) {
      contenedorItems.innerHTML = carrito.map(item => `
        <div style="display: flex; justify-content: space-between; font-size: var(--tam-pequeno); margin-bottom: 0.3rem;">
          <span>${item.cantidad}x ${item.nombre}</span>
          <span>${formatearPesosCLP(item.precio * item.cantidad)}</span>
        </div>
      `).join("");
    }

    const { subtotal, descuento, total } = calcularTotal();
    if (subtotalEl) subtotalEl.textContent = formatearPesosCLP(subtotal);
    if (descEl) descEl.textContent = `-${formatearPesosCLP(descuento)}`;
    if (totalEl) totalEl.textContent = formatearPesosCLP(total);
  }

  actualizarResumenCheckout();

  // Envío del formulario
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const carrito = obtenerCarrito();
    if (carrito.length === 0) {
      alert("No puedes procesar la compra porque el carrito está vacío.");
      return;
    }

    // Ejecutar todas las validaciones
    const esNombreValido = validarNombre();
    const esEmailValido = validarEmail();
    const esTelValido = validarTelefono();
    const esRegionValida = validarSelect(region, "región");
    const esComunaValida = validarTextoSimple(comuna, "comuna");
    const esDirValida = validarTextoSimple(direccion, "dirección");
    const esPagoValido = validarSelect(pago, "método de pago");

    const formularioValido = esNombreValido && esEmailValido && esTelValido &&
                             esRegionValida && esComunaValida && esDirValida && esPagoValido;

    if (!formularioValido) {
      const primerInvalido = form.querySelector("[aria-invalid='true']");
      if (primerInvalido) primerInvalido.focus();
      return;
    }

    // Simular creación de orden exitosa
    const numeroOrden = "GH-" + Math.floor(100000 + Math.random() * 900000);
    const { total } = calcularTotal();

    alert(`¡Orden confirmada exitosamente!\nNúmero: ${numeroOrden}\nTotal pagado: ${formatearPesosCLP(total)}\nEnviaremos el seguimiento a: ${email.value}`);

    // Limpiar carrito tras la compra y redirigir
    localStorage.removeItem("gh_carrito_v1");
    localStorage.removeItem("gh_cupon_activo_v1");
    window.location.href = "ordenes.html";
  });
}

// 2. FORMULARIO SECUNDARIO: GARANTÍA / RESEÑA (ordenes.html)
function inicializarValidacionGarantia() {
  const formGarantia = document.getElementById("formulario-garantia");
  if (!formGarantia) return;

  const inputFechaCompra = document.getElementById("garantia-fecha");
  const selectMotivo = document.getElementById("garantia-motivo");
  const textareaDetalle = document.getElementById("garantia-detalle");

  function validarPlazoFecha() {
    if (!inputFechaCompra.value) {
      gestionarErrorCampo(inputFechaCompra, false, "Selecciona la fecha de recepción del pedido.");
      return false;
    }

    const fechaCompra = new Date(inputFechaCompra.value);
    const fechaActual = new Date();
    const diferenciaDias = Math.floor((fechaActual - fechaCompra) / (1000 * 60 * 60 * 24));

    if (diferenciaDias < 0) {
      gestionarErrorCampo(inputFechaCompra, false, "La fecha no puede ser futura.");
      return false;
    }

    // Coherencia: Garantía legal máxima de 180 días (6 meses)
    if (diferenciaDias > 180) {
      gestionarErrorCampo(inputFechaCompra, false, `Plazo de garantía vencido (${diferenciaDias} días transcurridos. Máximo: 180 días).`);
      return false;
    }

    gestionarErrorCampo(inputFechaCompra, true);
    return true;
  }

  function validarDetalle() {
    if (textareaDetalle.value.trim().length < 20) {
      gestionarErrorCampo(textareaDetalle, false, "Describe detalladamente la falla (mínimo 20 caracteres).");
      return false;
    }
    gestionarErrorCampo(textareaDetalle, true);
    return true;
  }

  inputFechaCompra.addEventListener("change", validarPlazoFecha);
  textareaDetalle.addEventListener("blur", validarDetalle);

  formGarantia.addEventListener("submit", (e) => {
    e.preventDefault();
    const fechaOk = validarPlazoFecha();
    const detalleOk = validarDetalle();
    const motivoOk = selectMotivo.value !== "";

    if (!motivoOk) {
      gestionarErrorCampo(selectMotivo, false, "Selecciona el motivo del reclamo.");
    } else {
      gestionarErrorCampo(selectMotivo, true);
    }

    if (fechaOk && detalleOk && motivoOk) {
      alert("Solicitud de garantía ingresada correctamente. Nuestro equipo técnico responderá en 48 horas hábiles.");
      formGarantia.reset();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  inicializarValidacionCheckout();
  inicializarValidacionGarantia();
});