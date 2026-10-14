# Créditos de las imágenes

Todas las fotografías de esta carpeta provienen de [Unsplash](https://unsplash.com)
y se usan bajo la [Licencia de Unsplash](https://unsplash.com/es/licencia)
(uso gratuito, incluso comercial, sin necesidad de atribución; la atribución se
incluye aquí como buena práctica).

## Imágenes de producto

| Archivo | Producto | Fuente |
| --- | --- | --- |
| `producto-notebook-asus.jpg` | Notebook Gamer Asus ROG Strix G16 | https://unsplash.com/photos/vX63GM_I7LM |
| `producto-notebook-lenovo.jpg` | Notebook Lenovo Legion Pro 5 | https://unsplash.com/photos/auf3GwpVaOM |
| `producto-tarjeta-video.jpg` | Tarjeta de Video MSI RTX 4070 Super | https://unsplash.com/photos/3GUW88tRmv8 |
| `producto-mouse-rgb.jpg` | Mouse Inalámbrico RGB Pro | https://unsplash.com/photos/2mBKkeklHbI |
| `producto-teclado.jpg` | Teclado Mecánico TKL RGB | https://unsplash.com/photos/7bECH55TP0k |
| `producto-monitor.jpg` | Monitor Gamer Curvo 27" 165Hz | https://unsplash.com/photos/9ixBVUCo6NU |

## Imágenes de categoría

| Archivo | Categoría | Fuente |
| --- | --- | --- |
| `categoria-accesorios.jpg` | accesorios | https://unsplash.com/photos/8yesL5ZPjIU |

## Imágenes sin cambio

`categoria-consolas.jpg`, `categoria-perifericos.jpg`, `categoria-sillas.jpg`,
`producto-audifonos.jpg`, `producto-silla.jpg` y `poster-setup-gamer.jpg`
se mantienen del set original del proyecto.

## Cómo se descargaron

Para reemplazar o ampliar el set se puede usar el endpoint público de descarga
de Unsplash (no requiere API key), indicando el ancho deseado:

```bash
curl -L -o destino.jpg "https://unsplash.com/photos/<ID_DE_LA_FOTO>/download?force=true&w=1400&q=80"
```

El ID es el sufijo del slug de la foto (por ejemplo, en
`https://unsplash.com/photos/a-laptop-with-a-red-light-vX63GM_I7LM` el ID es
`vX63GM_I7LM`). Algunas fotos del catálogo de Unsplash+ devuelven `403` y hay que
elegir otra.
