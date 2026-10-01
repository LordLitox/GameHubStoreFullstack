GameHub Store

   
Plataforma web de comercio electrónico orientada a la venta de hardware, periféricos y accesorios gamer de alto rendimiento. Proyecto desarrollado como base de interfaz y lógica cliente para la asignatura Desarrollo FullStack II (DSY1104).  Descripción del ProyectoGameHub Store simula un flujo completo de adquisición de productos tecnológicos sin requerir APIs externas ni bases de datos activas en su primera fase (EP1). La navegación entre vistas, el filtrado interactivo, el cálculo comercial del carrito y la persistencia de datos se resuelven íntegramente en el cliente mediante JavaScript nativo y almacenamiento local (localStorage).
   
 Características Principales
 
  Estructura semántica y accesible (WCAG 2.1 AA): Marcado en HTML5 (<main>, <article>, <section>, <nav>, <aside>) con contraste visual optimizado (mínimo    4.5:1), enlaces de salto y etiquetas accesibles.
 
 Catálogo interactivo dinámico: Inyección segura en el DOM con document.createElement y DocumentFragment, filtros por categoría, marca, ordenación y validación cruzada de rango de precios (mínimo $\le$ máximo).
 
Gestión de carrito de compras: Control de inventario en tiempo real, bloqueo de productos agotados, persistencia entre pestañas y páginas vía localStorage.  

Motor de cupones y totales: Algoritmo modular para cupones con porcentaje de descuento, topes máximos en pesos y fechas de caducidad, asegurando totales no negativos.

Formularios con validación en tiempo real: Eventos input, blur y submit en checkout.html y solicitud de garantías post-venta en ordenes.html con retroalimentación visual e iconográfica.  


Estructura del Repositorio

Gamehub_Store-main/
├── index.html              # Portada principal y vitrina de productos destacados
├── catalogo.html           # Grilla de productos con filtros y ordenamiento
├── detalle.html            # Ficha técnica, selector de stock y reseñas
├── carrito.html            # Tabla dinámica de compra y aplicación de cupones
├── checkout.html           # Formulario validado de despacho y método de pago
├── ordenes.html            # Historial de compras simuladas y formulario de garantía
├── css/
│   └── styles.css          # Hoja de estilos centralizada con variables CSS nativas
├── js/
│   ├── data.js             # Colección simulada de productos, cupones y roles
│   ├── app.js              # Lógica de negocio del carrito, cálculos y render DOM
│   ├── validaciones.js     # Validaciones nativas en tiempo real para formularios
│   └── main.js             # Controladores auxiliares de navegación y UI
└── README.md               # Documentación general del proyecto

Paleta de Diseño: Vitrina Oscura
La interfaz implementa un esquema de colores centralizado mediante variables en el :root de css/styles.css: 

Variable CSS  ZIPCódigo HEX  ZIPUso en la Interfaz  ZIP--color-fondo#171A21  Fondo general del sitio web  --color-superficie#1B2838  Fondo de tarjetas, tablas y bloques secundarios--color-primario#66C0F4  Botones de acción, enlaces y componentes activos--color-acento#ACD550  Precios en descuento, stock disponible y confirmaciones  --color-texto#C7D5E0  Texto regular de lectura con ratio de contraste legible  --color-error#FF6B6B  Mensajes de advertencia, errores de validación y stock agotado
