import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTitulo } from "../hooks/useTitulo.js";
import { useCarrito } from "../context/CarritoContext.jsx";
import { ordenes as servicioOrdenes, mensajeDeError } from "../services/index.js";
import { formatearPesosCLP } from "../lib/formato.js";
import {
  validarNombre,
  validarEmail,
  validarTelefono,
  validarSelect,
  validarTextoSimple,
} from "../lib/validaciones.js";

const CAMPOS_INICIALES = {
  nombre: "",
  email: "",
  telefono: "",
  region: "",
  comuna: "",
  direccion: "",
  metodoPago: "",
};

/**
 * Checkout con validación en tiempo real. Migrado desde legacy/checkout.html
 * + legacy/js/validaciones.js: las REGLAS de validación viven en
 * src/lib/validaciones.js (testeable sin DOM) y acá solo se conectan a los
 * eventos blur/change/submit del formulario.
 *
 * EP3 · Parte 6: al confirmar se crea la **orden real** en order-service (que a
 * su vez registra el pago simulado y descuenta el stock). Ya no se inventa un
 * número de orden en el navegador: la respuesta del backend trae el número
 * definitivo y el estado del pago.
 */
export default function Checkout() {
  useTitulo("Checkout — GameHub Store");

  const navigate = useNavigate();
  const { items, cupon, totales, vaciar } = useCarrito();

  const [campos, setCampos] = useState(CAMPOS_INICIALES);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorOrden, setErrorOrden] = useState(null);
  const carritoVacio = items.length === 0;

  function validarCampo(nombreCampo, valor) {
    let resultado;
    switch (nombreCampo) {
      case "nombre":
        resultado = validarNombre(valor);
        break;
      case "email":
        resultado = validarEmail(valor);
        break;
      case "telefono":
        resultado = validarTelefono(valor);
        break;
      case "region":
        resultado = validarSelect(valor, "región");
        break;
      case "comuna":
        resultado = validarTextoSimple(valor, "comuna");
        break;
      case "direccion":
        resultado = validarTextoSimple(valor, "dirección");
        break;
      case "metodoPago":
        resultado = validarSelect(valor, "método de pago");
        break;
      default:
        resultado = { valido: true, mensaje: "" };
    }
    return resultado;
  }

  function actualizarCampo(nombreCampo, valor) {
    setCampos((previo) => ({ ...previo, [nombreCampo]: valor }));
  }

  // Revalida en vivo solo los campos que ya marcaron error (igual que el
  // legacy: validar en "input" únicamente si el campo estaba inválido)
  function manejarCambio(nombreCampo, valor) {
    actualizarCampo(nombreCampo, valor);
    if (errores[nombreCampo]) {
      const res = validarCampo(nombreCampo, valor);
      setErrores((previo) => ({ ...previo, [nombreCampo]: res }));
    }
  }

  function manejarBlur(nombreCampo) {
    const res = validarCampo(nombreCampo, campos[nombreCampo]);
    setErrores((previo) => ({ ...previo, [nombreCampo]: res }));
  }

  async function manejarSubmit(evento) {
    evento.preventDefault();

    if (carritoVacio) {
      alert("No puedes procesar la compra porque el carrito está vacío.");
      return;
    }

    // Ejecutar todas las validaciones al enviar
    const nuevosErrores = {};
    let formularioValido = true;
    for (const nombreCampo of Object.keys(CAMPOS_INICIALES)) {
      const res = validarCampo(nombreCampo, campos[nombreCampo]);
      nuevosErrores[nombreCampo] = res;
      if (!res.valido) formularioValido = false;
    }
    setErrores(nuevosErrores);

    if (!formularioValido) {
      document
        .querySelector("#formulario-checkout [aria-invalid='true']")
        ?.focus();
      return;
    }

    setEnviando(true);
    setErrorOrden(null);
    try {
      const orden = await servicioOrdenes.crear({
        items,
        cupon: cupon?.codigo ?? null,
        metodoPago: campos.metodoPago,
        despacho: campos,
      });

      // El pago simulado puede quedar APROBADO o RECHAZADO según las reglas
      // del backend (por ejemplo, transferencias quedan pendientes). Se informa
      // el resultado real en vez de asumir que siempre se aprueba.
      const aprobado = orden.pago?.estado === "APROBADO";
      alert(
        `¡Orden confirmada exitosamente!\nNúmero: ${orden.numero}\n` +
          `Total: ${formatearPesosCLP(orden.total ?? totales.total)}\n` +
          `Estado del pago: ${orden.pago?.estado ?? "registrado"}\n` +
          `Enviaremos el seguimiento a: ${campos.email}`
      );

      vaciar();
      navigate("/ordenes");
      return aprobado;
    } catch (error) {
      // El backend puede rechazar la orden (stock insuficiente, cupón vencido,
      // 401 sin sesión…): se muestra su mensaje sin perder el carrito.
      setErrorOrden(mensajeDeError(error));
    } finally {
      setEnviando(false);
    }
  }

  const propsCampo = (nombreCampo) => ({
    value: campos[nombreCampo],
    onChange: (e) => manejarCambio(nombreCampo, e.target.value),
    onBlur: () => manejarBlur(nombreCampo),
    "aria-invalid": errores[nombreCampo]?.valido === false ? "true" : undefined,
  });

  const MensajeError = ({ nombreCampo }) =>
    errores[nombreCampo]?.valido === false ? (
      <span className="texto-error mt-1" role="alert">
        {errores[nombreCampo].mensaje}
      </span>
    ) : null;

  return (
    <div className="seccion">
      <div className="container">
        <h1>Finalizar Compra</h1>
        <p>
          Ingresa los datos para el despacho de tus productos gamer y selecciona
          tu método de pago simulado.
        </p>

        {carritoVacio && (
          <div className="alert alert-danger" role="alert">
            <span aria-hidden="true">⚠</span>{" "}
            <strong>Tu carrito está vacío.</strong> Debes agregar productos
            antes de poder completar el pedido.
            <p className="mt-2 mb-0">
              <Link className="btn btn-outline-primary" to="/catalogo">Ir al catálogo</Link>
            </p>
          </div>
        )}

        <div className="row g-4 align-items-start">
          {/* Formulario de Despacho y Pago */}
          <div className="col-12 col-lg-7">
            <form id="formulario-checkout" noValidate onSubmit={manejarSubmit}>
              <fieldset className="border rounded-3 p-3 mb-3">
                <legend className="float-none w-auto px-1 fs-6 fw-bold text-body-emphasis">
                  1. Datos de Despacho
                </legend>

                {/* Nombre */}
                <div className="mb-3">
                  <label className="form-label" htmlFor="checkout-nombre">Nombre y Apellido *</label>
                  <input
                    className="form-control"
                    type="text"
                    id="checkout-nombre"
                    name="nombre"
                    autoComplete="name"
                    placeholder="Ej. Constanza Morales"
                    aria-describedby="ayuda-nombre error-nombre"
                    {...propsCampo("nombre")}
                  />
                  <span id="ayuda-nombre" className="texto-ayuda">
                    Nombre de quien recibirá el paquete.
                  </span>
                  <MensajeError nombreCampo="nombre" />
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label className="form-label" htmlFor="checkout-email">Correo Electrónico *</label>
                  <input
                    className="form-control"
                    type="email"
                    id="checkout-email"
                    name="email"
                    autoComplete="email"
                    placeholder="tu_correo@ejemplo.cl"
                    aria-describedby="ayuda-email error-email"
                    {...propsCampo("email")}
                  />
                  <span id="ayuda-email" className="texto-ayuda">
                    Enviaremos el comprobante y seguimiento de la orden.
                  </span>
                  <MensajeError nombreCampo="email" />
                </div>

                {/* Teléfono */}
                <div className="mb-3">
                  <label className="form-label" htmlFor="checkout-telefono">Teléfono Móvil (Chile) *</label>
                  <input
                    className="form-control"
                    type="tel"
                    id="checkout-telefono"
                    name="telefono"
                    autoComplete="tel"
                    placeholder="912345678"
                    maxLength="9"
                    aria-describedby="ayuda-telefono error-telefono"
                    {...propsCampo("telefono")}
                  />
                  <span id="ayuda-telefono" className="texto-ayuda">
                    9 dígitos sin espacios ni código de país (+56).
                  </span>
                  <MensajeError nombreCampo="telefono" />
                </div>

                {/* Región */}
                <div className="mb-3">
                  <label className="form-label" htmlFor="checkout-region">Región *</label>
                  <select
                    className="form-select"
                    id="checkout-region"
                    name="region"
                    aria-describedby="error-region"
                    {...propsCampo("region")}
                  >
                    <option value="">Selecciona tu región...</option>
                    <option value="metropolitana">Región Metropolitana</option>
                    <option value="valparaiso">Región de Valparaíso</option>
                    <option value="biobio">Región del Biobío</option>
                  </select>
                  <MensajeError nombreCampo="region" />
                </div>

                {/* Comuna */}
                <div className="mb-3">
                  <label className="form-label" htmlFor="checkout-comuna">Comuna *</label>
                  <input
                    className="form-control"
                    type="text"
                    id="checkout-comuna"
                    name="comuna"
                    autoComplete="address-level2"
                    placeholder="Ej. Santiago Centro, Maipú, Viña del Mar"
                    aria-describedby="error-comuna"
                    {...propsCampo("comuna")}
                  />
                  <MensajeError nombreCampo="comuna" />
                </div>

                {/* Dirección */}
                <div className="mb-0">
                  <label className="form-label" htmlFor="checkout-direccion">
                    Dirección exacta y número (o depto) *
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    id="checkout-direccion"
                    name="direccion"
                    autoComplete="street-address"
                    placeholder="Ej. Av. Providencia 1234, Depto 501"
                    aria-describedby="ayuda-direccion error-direccion"
                    {...propsCampo("direccion")}
                  />
                  <span id="ayuda-direccion" className="texto-ayuda">
                    Incluye calle, número de vivienda y bloque/depto si aplica.
                  </span>
                  <MensajeError nombreCampo="direccion" />
                </div>
              </fieldset>

              <fieldset className="border rounded-3 p-3 mb-3">
                <legend className="float-none w-auto px-1 fs-6 fw-bold text-body-emphasis">
                  2. Medio de Pago Simulado
                </legend>
                <div className="mb-0">
                  <label className="form-label" htmlFor="checkout-pago">Método de pago *</label>
                  <select
                    className="form-select"
                    id="checkout-pago"
                    name="metodoPago"
                    aria-describedby="error-pago"
                    {...propsCampo("metodoPago")}
                  >
                    <option value="">Elige una opción...</option>
                    <option value="webpay">Webpay Plus (Débito / Crédito)</option>
                    <option value="transferencia">Transferencia Bancaria Directa</option>
                    <option value="mach">MACH / Prepago Digital</option>
                  </select>
                  <MensajeError nombreCampo="metodoPago" />
                </div>
              </fieldset>

              {errorOrden && (
                <div className="alert alert-danger" role="alert">
                  <span aria-hidden="true">⚠</span> {errorOrden}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={carritoVacio || enviando}
              >
                {enviando ? "Procesando pago…" : "Confirmar y Pagar Orden"}
              </button>
            </form>
          </div>

          {/* Resumen lateral de la orden */}
          <aside className="col-12 col-lg-5 resumen-pedido" aria-labelledby="titulo-resumen">
            <h2 id="titulo-resumen" className="h5">Resumen del Pedido</h2>
            <div className="mb-2">
              {items.map((item) => (
                <div key={item.id} className="d-flex justify-content-between small mb-1">
                  <span>
                    {item.cantidad}x {item.nombre}
                  </span>
                  <span>{formatearPesosCLP(item.precio * item.cantidad)}</span>
                </div>
              ))}
            </div>

            <div className="resumen-pedido__fila">
              <span>Subtotal:</span>
              <span>{formatearPesosCLP(totales.subtotal)}</span>
            </div>
            <div className="resumen-pedido__fila">
              <span>Descuento Cupón:</span>
              <span style={{ color: "var(--color-acento)" }}>
                -{formatearPesosCLP(totales.descuento)}
              </span>
            </div>
            <div className="resumen-pedido__fila resumen-pedido__fila--total">
              <span>Total a Pagar:</span>
              <span>{formatearPesosCLP(totales.total)}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}