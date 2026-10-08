import { Link } from "react-router-dom";
import { useTitulo } from "../hooks/useTitulo.js";

export default function NoEncontrada() {
  useTitulo("Página no encontrada — GameHub Store");

  return (
    <section className="seccion" aria-labelledby="titulo-404">
      <div className="contenedor">
        <h1 id="titulo-404">Página no encontrada</h1>
        <p>La dirección que buscas no existe o fue movida durante la migración.</p>
        <Link className="boton-primario" to="/">
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
