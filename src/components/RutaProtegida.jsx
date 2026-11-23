import { Link, Navigate, useLocation } from "react-router-dom";
import { useSesion } from "../context/SesionContext.jsx";
import { nombreRol } from "../services/adaptadores.js";

/**
 * Guardia de ruta por rol (EP3 · Parte 5).
 *
 * Envuelve una ruta y decide entre tres desenlaces:
 *
 *  1. **sin sesión** → redirige a `/ingresar`, guardando en el estado de
 *     navegación la ruta que se quería abrir para volver a ella tras el login;
 *  2. **con sesión pero sin el rol** → muestra un aviso 403 en el lugar (no
 *     redirige: así el usuario entiende *por qué* no puede entrar);
 *  3. **con el rol correcto** → renderiza el contenido.
 *
 * La comprobación es solo de interfaz: el backend vuelve a validar el rol en
 * cada endpoint, así que ocultar el enlace no es la protección de verdad.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children Contenido a proteger.
 * @param {string[]} props.roles           Roles admitidos (`ADMIN`, `OPERADOR`, `CLIENTE`).
 */
export default function RutaProtegida({ children, roles }) {
  const { autenticado, rol } = useSesion();
  const ubicacion = useLocation();

  if (!autenticado) {
    return <Navigate to="/ingresar" replace state={{ desde: ubicacion.pathname }} />;
  }

  if (roles && !roles.includes(rol)) {
    return (
      <div className="seccion">
        <div className="container">
          <h1>Acceso restringido</h1>
          <div className="alert alert-danger" role="alert">
            <strong>No tienes permiso para ver esta sección.</strong>
            <p className="mb-0 mt-2">
              Tu rol actual es <strong>{nombreRol(rol)}</strong> y esta página es
              para {roles.map(nombreRol).join(" o ")}.
            </p>
          </div>
          <Link className="btn btn-primary" to="/">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
