import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import RutaProtegida from "./components/RutaProtegida.jsx";
import Inicio from "./pages/Inicio.jsx";
import Catalogo from "./pages/Catalogo.jsx";
import Detalle from "./pages/Detalle.jsx";
import Carrito from "./pages/Carrito.jsx";
import Checkout from "./pages/Checkout.jsx";
import Ordenes from "./pages/Ordenes.jsx";
import Admin from "./pages/Admin.jsx";
import Ingresar from "./pages/Ingresar.jsx";
import NoEncontrada from "./pages/NoEncontrada.jsx";

/**
 * Rutas de la aplicación.
 *
 * Las vistas de compra (`/checkout`, `/ordenes`) exigen rol CLIENTE y el panel
 * de administración, rol ADMIN (EP3 · Parte 5). El catálogo, la ficha de
 * producto y el carrito son públicos: se puede mirar y armar el carrito sin
 * cuenta, pero no cerrar la compra.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/detalle/:id" element={<Detalle />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/ingresar" element={<Ingresar />} />

        <Route
          path="/checkout"
          element={
            <RutaProtegida roles={["CLIENTE"]}>
              <Checkout />
            </RutaProtegida>
          }
        />
        <Route
          path="/ordenes"
          element={
            <RutaProtegida roles={["CLIENTE"]}>
              <Ordenes />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin"
          element={
            <RutaProtegida roles={["ADMIN"]}>
              <Admin />
            </RutaProtegida>
          }
        />

        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
