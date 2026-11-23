import { useEffect } from "react";

// Sincroniza el <title> del documento con el título de cada página,
// igual que lo hacía cada archivo HTML del sitio legacy.
//
// Desde la EP3 el título puede depender de datos que llegan por HTTP (por
// ejemplo el nombre del producto en la ficha). Por eso se acepta un segundo
// argumento `listo`: mientras sea `false` el título no se cambia, y así no se
// escribe "Producto no encontrado" durante el instante en que la vista todavía
// está cargando.
export function useTitulo(titulo, listo = true) {
  useEffect(() => {
    if (listo && titulo) document.title = titulo;
  }, [titulo, listo]);
}
