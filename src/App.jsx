import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Inicio from "./pages/Inicio.jsx";
import Catalogo from "./pages/Catalogo.jsx";
import Detalle from "./pages/Detalle.jsx";
import Carrito from "./pages/Carrito.jsx";
import Checkout from "./pages/Checkout.jsx";
import Ordenes from "./pages/Ordenes.jsx";
import NoEncontrada from "./pages/NoEncontrada.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/detalle/:id" element={<Detalle />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/ordenes" element={<Ordenes />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
