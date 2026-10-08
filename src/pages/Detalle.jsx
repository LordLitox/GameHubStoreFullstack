import { useTitulo } from "../hooks/useTitulo.js";
import PaginaEnMigracion from "../components/PaginaEnMigracion.jsx";

export default function Detalle() {
  useTitulo("Detalle de producto — GameHub Store");

  return <PaginaEnMigracion titulo="Detalle de producto" archivoLegacy="detalle.html" />;
}
