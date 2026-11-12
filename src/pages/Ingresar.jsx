import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTitulo } from "../hooks/useTitulo.js";
import { useSesion } from "../context/SesionContext.jsx";
import { mensajeDeError } from "../services/cliente.js";

/**
 * Inicio de sesión y registro (EP3 · Parte 4).
 *
 * Las dos operaciones las resuelve `SesionContext` contra `/api/v1/auth/**`;
 * aquí solo se recogen los datos y se muestran los errores. Los mensajes de
 * validación por campo que devuelve el backend (`ErrorApi.errores`) se pintan
 * junto al campo correspondiente.
 */

const CAMPOS_REGISTRO = {
  nombre: "",
  email: "",
  clave: "",
  telefono: "",
  region: "",
  comuna: "",
  direccion: "",
};

export default function Ingresar() {
  const navigate = useNavigate();
  const ubicacion = useLocation();
  const { entrar, registrar, autenticado, usuario, salir } = useSesion();

  const [modo, setModo] = useState("entrar"); // "entrar" | "registrar"
  const [credenciales, setCredenciales] = useState({ email: "", clave: "" });
  const [registro, setRegistro] = useState(CAMPOS_REGISTRO);
  const [error, setError] = useState("");
  const [erroresCampo, setErroresCampo] = useState({});
  const [enviando, setEnviando] = useState(false);

  // A dónde volver tras entrar: la ruta que el guardia interceptó, o el inicio.
  const destino = ubicacion.state?.desde ?? "/";

  useTitulo(
    modo === "entrar" ? "Iniciar sesión — GameHub Store" : "Crear cuenta — GameHub Store"
  );

  if (autenticado) {
    return (
      <div className="seccion">
        <div className="container" style={{ maxWidth: "520px" }}>
          <h1>Sesión activa</h1>
          <p>
            Ya iniciaste sesión como <strong>{usuario?.nombre}</strong> (
            {usuario?.rolVisible ?? usuario?.rol}).
          </p>
          <div className="d-flex gap-2">
            <Link className="btn btn-primary" to="/catalogo">
              Ir al catálogo
            </Link>
            <button type="button" className="btn btn-outline-secondary" onClick={salir}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  function cambiarModo(nuevoModo) {
    setModo(nuevoModo);
    setError("");
    setErroresCampo({});
  }

  function capturarError(fallo) {
    setError(mensajeDeError(fallo));
    // `errores` solo viene en los 400 de validación; el resto se queda en el aviso general.
    setErroresCampo(fallo?.errores ?? {});
  }

  async function manejarEntrar(evento) {
    evento.preventDefault();
    setError("");
    setErroresCampo({});
    setEnviando(true);
    try {
      await entrar(credenciales);
      navigate(destino, { replace: true });
    } catch (fallo) {
      capturarError(fallo);
    } finally {
      setEnviando(false);
    }
  }

  async function manejarRegistrar(evento) {
    evento.preventDefault();
    setError("");
    setErroresCampo({});
    setEnviando(true);
    try {
      await registrar(registro);
      navigate(destino, { replace: true });
    } catch (fallo) {
      capturarError(fallo);
    } finally {
      setEnviando(false);
    }
  }

  const ErrorCampo = ({ nombre }) =>
    erroresCampo[nombre] ? (
      <span className="texto-error mt-1" role="alert">
        {erroresCampo[nombre]}
      </span>
    ) : null;

  return (
    <div className="seccion">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <h1>{modo === "entrar" ? "Iniciar sesión" : "Crear cuenta de cliente"}</h1>
            <p>
              {modo === "entrar"
                ? "Entra con tu cuenta para comprar, ver tus pedidos o administrar la tienda."
                : "Regístrate para comprar, seguir tus pedidos y solicitar garantías."}
            </p>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <div className="card">
              <div className="card-body p-4">
                {modo === "entrar" ? (
                  <form onSubmit={manejarEntrar} noValidate>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="sesion-email">Correo electrónico *</label>
                      <input
                        className="form-control"
                        type="email"
                        id="sesion-email"
                        autoComplete="email"
                        value={credenciales.email}
                        onChange={(e) =>
                          setCredenciales((previo) => ({ ...previo, email: e.target.value }))
                        }
                      />
                      <ErrorCampo nombre="email" />
                    </div>

                    <div className="mb-3">
                      <label className="form-label" htmlFor="sesion-clave">Contraseña *</label>
                      <input
                        className="form-control"
                        type="password"
                        id="sesion-clave"
                        autoComplete="current-password"
                        value={credenciales.clave}
                        onChange={(e) =>
                          setCredenciales((previo) => ({ ...previo, clave: e.target.value }))
                        }
                      />
                      <ErrorCampo nombre="clave" />
                    </div>

                    <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
                      {enviando ? "Entrando…" : "Iniciar sesión"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={manejarRegistrar} noValidate>
                    {[
                      { campo: "nombre", etiqueta: "Nombre y apellido", tipo: "text" },
                      { campo: "email", etiqueta: "Correo electrónico", tipo: "email" },
                      { campo: "clave", etiqueta: "Contraseña", tipo: "password" },
                      { campo: "telefono", etiqueta: "Teléfono móvil", tipo: "tel" },
                      { campo: "region", etiqueta: "Región", tipo: "text" },
                      { campo: "comuna", etiqueta: "Comuna", tipo: "text" },
                      { campo: "direccion", etiqueta: "Dirección", tipo: "text" },
                    ].map(({ campo, etiqueta, tipo }) => (
                      <div className="mb-3" key={campo}>
                        <label className="form-label" htmlFor={`registro-${campo}`}>
                          {etiqueta} *
                        </label>
                        <input
                          className="form-control"
                          type={tipo}
                          id={`registro-${campo}`}
                          value={registro[campo]}
                          onChange={(e) =>
                            setRegistro((previo) => ({ ...previo, [campo]: e.target.value }))
                          }
                        />
                        <ErrorCampo nombre={campo} />
                      </div>
                    ))}

                    <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
                      {enviando ? "Creando cuenta…" : "Crear cuenta"}
                    </button>
                  </form>
                )}
              </div>
            </div>

            <p className="mt-3 mb-0">
              {modo === "entrar" ? (
                <>
                  ¿No tienes cuenta?{" "}
                  <button
                    type="button"
                    className="btn btn-link p-0 align-baseline"
                    onClick={() => cambiarModo("registrar")}
                  >
                    Regístrate aquí
                  </button>
                </>
              ) : (
                <>
                  ¿Ya tienes cuenta?{" "}
                  <button
                    type="button"
                    className="btn btn-link p-0 align-baseline"
                    onClick={() => cambiarModo("entrar")}
                  >
                    Inicia sesión
                  </button>
                </>
              )}
            </p>

            <p className="small text-body-secondary mt-3">
              Cuentas de prueba (clave <code>clave123</code>):{" "}
              <code>ana@gamehub.test</code> (Administrador),{" "}
              <code>luis@gamehub.test</code> (Vendedor),{" "}
              <code>camila@gamehub.test</code> (Cliente).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
