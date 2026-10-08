import { useTitulo } from "../hooks/useTitulo.js";
import PaginaEnMigracion from "../components/PaginaEnMigracion.jsx";

export default function Catalogo() {
  useTitulo("Catálogo — GameHub Store");

  return <PaginaEnMigracion titulo="Catálogo" archivoLegacy="catalogo.html" />;
}
