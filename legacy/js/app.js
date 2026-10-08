/**
 * GameHub Store — js/app.js
 * Estado global, lógica del carrito y renderizado DOM
 */

const STORAGE_KEY_CARRITO = "gh_carrito_v1";
const STORAGE_KEY_CUPON = "gh_cupon_activo_v1";
const STORAGE_KEY_PERFIL = "gh_perfil_rol_v1";

/* ==========================================================================
   1. PERSISTENCIA EN LOCALSTORAGE Y PERFILES
   ========================================================================== */
function obtenerCarrito() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_CARRITO);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function guardarCarrito(carrito) {
  localStorage.setItem(STORAGE_KEY_CARRITO, JSON.stringify(carrito));
  sincronizarContadorCabecera();
}

function obtenerCuponActivo() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_CUPON);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

function guardarCuponActivo(cupon) {
  if (cupon) {
    localStorage.setItem(STORAGE_KEY_CUPON, JSON.stringify(cupon));
  } else {
    localStorage.removeItem(STORAGE_KEY_CUPON);
  }
}

function obtenerPerfilActivo() {
  return localStorage.getItem(STORAGE_KEY_PERFIL) || "Cliente";
}

function establecerPerfilActivo(rol) {
  localStorage.setItem(STORAGE_KEY_PERFIL, rol);
}

/* ==========================================================================
   2. REGLAS DE NEGOCIO Y CÁLCULOS (Jasmine EP2 ready)
   ========================================================================== */
function validarStock(producto, cantidadDeseada) {
  if (!producto || typeof producto.stockDisponible !== "number") return false;
  if (producto.stockDisponible <= 0) return false;
  return cantidadDeseada <= producto.stockDisponible;
}

function agregarAlCarrito(idProducto, cantidad = 1) {
  const producto = PRODUCTOS.find(p => p.id === idProducto);
  if (!producto) {
    return { exito: false, mensaje: "El producto seleccionado no existe." };
  }

  if (producto.stockDisponible <= 0) {
    return { exito: false, mensaje: "Producto sin stock disponible." };
  }

  const carrito = obtenerCarrito();
  const indice = carrito.findIndex(item => item.id === idProducto);
  const cantidadActual = indice !== -1 ? carrito[indice].cantidad : 0;
  const nuevaCantidad = cantidadActual + cantidad;

  if (!validarStock(producto, nuevaCantidad)) {
    return {
      exito: false,
      mensaje: `No es posible agregar más unidades. Stock disponible: ${producto.stockDisponible}.`
    };
  }

  const precioFinal = producto.descuentoVigente.activo
    ? Math.round(producto.precio * (1 - producto.descuentoVigente.porcentaje / 100))
    : producto.precio;

  if (indice !== -1) {
    carrito[indice].cantidad = nuevaCantidad;
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      marca: producto.marca,
      categoria: producto.categoria,
      precio: precioFinal,
      precioOriginal: producto.precio,
      imagen: producto.imagen,
      stockDisponible: producto.stockDisponible,
      cantidad: nuevaCantidad
    });
  }

  guardarCarrito(carrito);
  return { exito: true, mensaje: `"${producto.nombre}" agregado al carrito.` };
}

function quitarLinea(idProducto) {
  let carrito = obtenerCarrito();
  carrito = carrito.filter(item => item.id !== idProducto);
  guardarCarrito(carrito);
}

function calcularSubtotal() {
  const carrito = obtenerCarrito();
  return carrito.reduce((acumulado, item) => acumulado + (item.precio * item.cantidad), 0);
}

function cuponVigente(cupon) {
  if (!cupon || !cupon.expira) return false;
  const hoy = new Date();
  const fechaExp = new Date(cupon.expira + "T23:59:59");
  return hoy <= fechaExp;
}

function aplicarCupon(codigo) {
  if (!codigo || codigo.trim() === "") {
    guardarCuponActivo(null);
    return { exito: false, mensaje: "Debes ingresar un código de cupón." };
  }

  const limpio = codigo.trim().toUpperCase();
  const cupon = CUPONES.find(c => c.codigo === limpio);

  if (!cupon) {
    guardarCuponActivo(null);
    return { exito: false, mensaje: "El cupón no existe o no es válido." };
  }

  if (!cuponVigente(cupon)) {
    guardarCuponActivo(null);
    return { exito: false, mensaje: "El cupón ha expirado." };
  }

  guardarCuponActivo(cupon);
  return { exito: true, mensaje: `Cupón ${cupon.codigo} aplicado con éxito (${cupon.porcentaje}% dscto).` };
}

function calcularTotal() {
  const subtotal = calcularSubtotal();
  if (subtotal <= 0) return { subtotal: 0, descuento: 0, total: 0 };

  const cupon = obtenerCuponActivo();
  let descuento = 0;

  if (cupon && cuponVigente(cupon)) {
    const descuentoTeorico = Math.round(subtotal * (cupon.porcentaje / 100));
    descuento = Math.min(descuentoTeorico, cupon.topeMaximo);
  }

  const total = Math.max(0, subtotal - descuento);
  return { subtotal, descuento, total };
}

/* ==========================================================================
   3. MANIPULACIÓN SEGURA DEL DOM (Creación de tarjetas de producto)
   ========================================================================== */
function formatearPesosCLP(monto) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(monto);
}

function crearTarjetaProductoDOM(producto) {
  const article = document.createElement("article");
  article.className = "tarjeta-producto";

  // Imagen con atributo alt descriptivo
  const img = document.createElement("img");
  img.className = "tarjeta-producto__imagen";
  img.src = producto.imagen;
  img.alt = `Fotografía de ${producto.nombre}`;
  img.loading = "lazy";

  // Cuerpo de la tarjeta
  const cuerpo = document.createElement("div");
  cuerpo.className = "tarjeta-producto__cuerpo";

  const pCat = document.createElement("p");
  pCat.className = "tarjeta-producto__categoria";
  pCat.textContent = producto.categoria.charAt(0).toUpperCase() + producto.categoria.slice(1);

  const h3 = document.createElement("h3");
  h3.className = "tarjeta-producto__titulo";

  const enlaceDetalle = document.createElement("a");
  enlaceDetalle.href = `detalle.html?id=${producto.id}`;
  enlaceDetalle.textContent = producto.nombre;
  h3.appendChild(enlaceDetalle);

  // Precio y ofertas
  const pPrecio = document.createElement("p");
  pPrecio.className = "tarjeta-producto__precio";

  if (producto.descuentoVigente.activo) {
    const precioDesc = Math.round(producto.precio * (1 - producto.descuentoVigente.porcentaje / 100));
    pPrecio.innerHTML = `${formatearPesosCLP(precioDesc)} <s style="font-size: var(--tam-pequeno); color: var(--color-texto-tenue);">${formatearPesosCLP(producto.precio)}</s>`;
  } else {
    pPrecio.textContent = formatearPesosCLP(producto.precio);
  }

  // Stock
  const pStock = document.createElement("p");
  pStock.style.fontSize = "var(--tam-pequeno)";
  pStock.style.color = producto.stockDisponible > 0 ? "var(--color-texto-tenue)" : "var(--color-error)";
  pStock.textContent = producto.stockDisponible > 0 
    ? `Stock: ${producto.stockDisponible} un.` 
    : "Sin stock disponible";

  // Botón comprar / agotado
  const btn = document.createElement("button");
  btn.type = "button";

  if (producto.stockDisponible > 0) {
    btn.className = "boton-primario";
    btn.textContent = "Agregar al carrito";
    btn.addEventListener("click", () => {
      const res = agregarAlCarrito(producto.id, 1);
      alert(res.mensaje);
    });
  } else {
    btn.className = "boton-deshabilitado";
    btn.textContent = "Agotado";
    btn.disabled = true;
    btn.setAttribute("aria-disabled", "true");
  }

  cuerpo.appendChild(pCat);
  cuerpo.appendChild(h3);
  cuerpo.appendChild(pStock);
  cuerpo.appendChild(pPrecio);
  cuerpo.appendChild(btn);

  article.appendChild(img);
  article.appendChild(cuerpo);

  return article;
}

function renderizarListaEnContenedor(contenedor, productos) {
  contenedor.innerHTML = "";

  if (!productos || productos.length === 0) {
    const aviso = document.createElement("div");
    aviso.className = "mensaje-alerta";
    aviso.innerHTML = `<span class="mensaje-alerta__icono">ℹ</span> No se encontraron productos que coincidan con los filtros seleccionados.`;
    contenedor.appendChild(aviso);
    return;
  }

  const fragment = document.createDocumentFragment();
  productos.forEach(prod => {
    fragment.appendChild(crearTarjetaProductoDOM(prod));
  });
  contenedor.appendChild(fragment);
}

/* ==========================================================================
   4. FILTROS Y ORDENAMIENTO DINÁMICO (catalogo.html)
   ========================================================================== */
function inicializarFiltrosCatalogo() {
  const catalogoGrid = document.getElementById("catalogo-grid");
  if (!catalogoGrid) return; // No estamos en catalogo.html

  const selectCat = document.getElementById("filtro-categoria");
  const selectMarca = document.getElementById("filtro-marca");
  const inputMin = document.getElementById("filtro-precio-min");
  const inputMax = document.getElementById("filtro-precio-max");
  const selectOrden = document.getElementById("filtro-orden");
  const errorFiltro = document.getElementById("error-filtro-precio");

  function aplicarFiltros() {
    let resultado = [...PRODUCTOS];
    const cat = selectCat ? selectCat.value : "todas";
    const marca = selectMarca ? selectMarca.value : "todas";
    const valMin = inputMin && inputMin.value !== "" ? Number(inputMin.value) : 0;
    const valMax = inputMax && inputMax.value !== "" ? Number(inputMax.value) : Infinity;

    // Validación obligatoria de rango de precio
    if (valMin > valMax) {
      if (errorFiltro) {
        errorFiltro.style.display = "flex";
        errorFiltro.textContent = "El precio mínimo no puede ser mayor que el precio máximo.";
      }
      return;
    } else {
      if (errorFiltro) {
        errorFiltro.style.display = "none";
        errorFiltro.textContent = "";
      }
    }

    if (cat !== "todas") {
      resultado = resultado.filter(p => p.categoria === cat);
    }

    if (marca !== "todas") {
      resultado = resultado.filter(p => p.marca.toLowerCase() === marca.toLowerCase());
    }

    resultado = resultado.filter(p => p.precio >= valMin && p.precio <= valMax);

    const orden = selectOrden ? selectOrden.value : "defecto";
    if (orden === "precio-asc") resultado.sort((a, b) => a.precio - b.precio);
    if (orden === "precio-desc") resultado.sort((a, b) => b.precio - a.precio);
    if (orden === "nombre-asc") resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));

    renderizarListaEnContenedor(catalogoGrid, resultado);
  }

  [selectCat, selectMarca, inputMin, inputMax, selectOrden].forEach(control => {
    if (control) {
      control.addEventListener("input", aplicarFiltros);
      control.addEventListener("change", aplicarFiltros);
    }
  });

  aplicarFiltros();
}

/* ==========================================================================
   5. SINCRONIZACIÓN DE CABECERA Y MENÚ MÓVIL
   ========================================================================== */
function sincronizarContadorCabecera() {
  const contador = document.querySelector(".icono-carrito__contador");
  if (contador) {
    const carrito = obtenerCarrito();
    const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    contador.textContent = totalItems;
    
    // Accesibilidad para lectores de pantalla
    const enlaceCarrito = document.querySelector(".icono-carrito");
    if (enlaceCarrito) {
      enlaceCarrito.setAttribute("aria-label", `Ver carrito de compras, ${totalItems} productos`);
    }
  }
}

function inicializarMenuMovil() {
  const botonMenu = document.getElementById("botonMenu");
  const navPrincipal = document.getElementById("navPrincipal");
  if (botonMenu && navPrincipal) {
    botonMenu.addEventListener("click", () => {
      const estaAbierto = navPrincipal.classList.toggle("esta-abierto");
      botonMenu.setAttribute("aria-expanded", String(estaAbierto));
    });
  }
}

/* ==========================================================================
   6. INICIALIZACIÓN
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  inicializarMenuMovil();
  sincronizarContadorCabecera();

  // Si estamos en index.html y existe el contenedor de destacados
  const contenedorDestacados = document.getElementById("destacados-grid");
  if (contenedorDestacados) {
    const destacados = PRODUCTOS.filter(p => p.destacado);
    renderizarListaEnContenedor(contenedorDestacados, destacados);
  }

  // Inicializar catálogo si corresponde
  inicializarFiltrosCatalogo();
});