import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTitulo } from "../hooks/useTitulo.js";
import { useCarrito } from "../context/CarritoContext.jsx";
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
 */
export default function Checkout() {
  useTitulo("Checkout — GameHub Store");

  const navigate = useNavigate();
  const { items, totales, vaciar } = useCarrito();

  const [campos, setCampos] = useState(CAMPOS_INICIALES);
  const [errores, setErrores] = useState({});
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

  function manejarSubmit(evento) {
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

    // Simular creación de orden exitosa
    const numeroOrden = "GH-" + Math.floor(100000 + Math.random() * 900000);
    alert(
      `¡Orden confirmada exitosamente!\nNúmero: ${numeroOrden}\n` +
        `Total pagado: ${formatearPesosCLP(totales.total)}\n` +
        `Enviaremos el seguimiento a: ${campos.email}`
    );

    vaciar();
    navigate("/ordenes");
  }

  const propsCampo = (nombreCampo) => ({
    value: campos[nombreCampo],
    onChange: (e) => manejarCambio(nombreCampo, e.target.value),
    onBlur: () => manejarBlur(nombreCampo),
    "aria-invalid": errores[nombreCampo]?.valido === false ? "true" : undefined,
  });

  const MensajeError = ({ nombreCampo }) =>
    errores[nombreCampo]?.valido === false ? (
      <span className="texto-error" style={{ display: "flex" }} role="alert">
        {errores[nombreCampo].mensaje}
      </span>
    ) : null;

  return (
    <div className="seccion">
      <div className="contenedor">
        <h1>Finalizar Compra</h1>
        <p>
          Ingresa los datos para el despacho de tus productos gamer y selecciona
          tu método de pago simulado.
        </p>

        {carritoVacio && (
          <div className="mensaje-alerta" role="alert">
            <span className="mensaje-alerta__icono" aria-hidden="true">⚠</span>
            <div>
              <strong>Tu carrito está vacío.</strong> Debes agregar productos
              antes de poder completar el pedido.
              <p style={{ margin: "0.5rem 0 0 0" }}>
                <Link className="boton-secundario" to="/catalogo">Ir al catálogo</Link>
              </p>
            </div>
          </div>
        )}

        <div
          className="grid-hero"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: "var(--espacio-lg)",
            alignItems: "start",
          }}
        >
          {/* Formulario de Despacho y Pago */}
          <form id="formulario-checkout" noValidate onSubmit={manejarSubmit}>
            <fieldset
              style={{
                border: "1px solid var(--color-borde)",
                borderRadius: "var(--radio-md)",
                padding: "var(--espacio-md)",
                marginBottom: "var(--espacio-md)",
              }}
            >
              <legend style={{ color: "var(--color-texto-alto)", fontWeight: 700, padding: "0 var(--espacio-xs)" }}>
                1. Datos de Despacho
              </legend>

              {/* Nombre */}
              <div className="campo-formulario">
                <label htmlFor="checkout-nombre">Nombre y Apellido *</label>
                <input
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
              <div className="campo-formulario">
                <label htmlFor="checkout-email">Correo Electrónico *</label>
                <input
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
              <div className="campo-formulario">
                <label htmlFor="checkout-telefono">Teléfono Móvil (Chile) *</label>
                <input
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
              <div className="campo-formulario">
                <label htmlFor="checkout-region">Región *</label>
                <select
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
              <div className="campo-formulario">
                <label htmlFor="checkout-comuna">Comuna *</label>
                <input
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
              <div className="campo-formulario">
                <label htmlFor="checkout-direccion">
                  Dirección exacta y número (o depto) *
                </label>
                <input
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

            <fieldset
              style={{
                border: "1px solid var(--color-borde)",
                borderRadius: "var(--radio-md)",
                padding: "var(--espacio-md)",
                marginBottom: "var(--espacio-md)",
              }}
            >
              <legend style={{ color: "var(--color-texto-alto)", fontWeight: 700, padding: "0 var(--espacio-xs)" }}>
                2. Medio de Pago Simulado
              </legend>
              <div className="campo-formulario">
                <label htmlFor="checkout-pago">Método de pago *</label>
                <select
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

            <button
              type="submit"
              className={`boton-primario${carritoVacio ? " boton-deshabilitado" : ""}`}
              style={{ width: "100%" }}
              disabled={carritoVacio}
            >
              Confirmar y Pagar Orden
            </button>
          </form>

          {/* Resumen lateral de la orden */}
          <aside className="resumen-pedido" aria-labelledby="titulo-resumen">
            <h2 id="titulo-resumen">Resumen del Pedido</h2>
            <div style={{ marginBottom: "var(--espacio-sm)" }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "var(--tam-pequeno)",
                    marginBottom: "0.3rem",
                  }}
                >
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