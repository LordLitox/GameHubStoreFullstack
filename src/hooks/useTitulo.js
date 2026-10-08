import { useEffect } from "react";

// Sincroniza el <title> del documento con el título de cada página,
// igual que lo hacía cada archivo HTML del sitio legacy.
export function useTitulo(titulo) {
  useEffect(() => {
    document.title = titulo;
  }, [titulo]);
}
