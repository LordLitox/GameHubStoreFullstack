import { useTitulo } from "../hooks/useTitulo.js";
import PaginaEnMigracion from "../components/PaginaEnMigracion.jsx";

export default function Carrito() {
  useTitulo("Carrito de compras — GameHub Store");

  return <PaginaEnMigracion titulo="Carrito de compras" archivoLegacy="carrito.html" />;
}
