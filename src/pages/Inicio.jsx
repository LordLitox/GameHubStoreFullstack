import { useTitulo } from "../hooks/useTitulo.js";
import PaginaEnMigracion from "../components/PaginaEnMigracion.jsx";

export default function Inicio() {
  useTitulo("GameHub Store — Tu tienda gamer de confianza");

  return <PaginaEnMigracion titulo="Inicio" archivoLegacy="index.html" />;
}
