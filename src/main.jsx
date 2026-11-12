import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { CarritoProvider } from "./context/CarritoContext.jsx";
import { SesionProvider } from "./context/SesionContext.jsx";
// Bootstrap primero y nuestra hoja después: la marca sobreescribe el tema.
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";
// Bundle de Bootstrap (collapse, modal, offcanvas...) para los componentes con JS.
import "bootstrap/dist/js/bootstrap.bundle.min.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <SesionProvider>
        <CarritoProvider>
          <App />
        </CarritoProvider>
      </SesionProvider>
    </BrowserRouter>
  </React.StrictMode>
);
