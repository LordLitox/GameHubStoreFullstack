import { useTitulo } from "../hooks/useTitulo.js";
import PaginaEnMigracion from "../components/PaginaEnMigracion.jsx";

export default function Ordenes() {
  useTitulo("Mis pedidos — GameHub Store");

  return <PaginaEnMigracion titulo="Mis pedidos" archivoLegacy="ordenes.html" />;
}
