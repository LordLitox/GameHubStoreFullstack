import { useTitulo } from "../hooks/useTitulo.js";
import PaginaEnMigracion from "../components/PaginaEnMigracion.jsx";

export default function Checkout() {
  useTitulo("Checkout — GameHub Store");

  return <PaginaEnMigracion titulo="Checkout" archivoLegacy="checkout.html" />;
}
