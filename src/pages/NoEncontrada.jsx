import { Link } from "react-router-dom";
import { useTitulo } from "../hooks/useTitulo.js";

export default function NoEncontrada() {
  useTitulo("Página no encontrada — GameHub Store");

  return (
    <section className="seccion" aria-labelledby="titulo-404">
      <div className="container text-center py-5">
        <h1 id="titulo-404" className="display-4">Página no encontrada</h1>
        <p>La dirección que buscas no existe o fue movida durante la migración.</p>
        <Link className="btn btn-primary" to="/">
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
