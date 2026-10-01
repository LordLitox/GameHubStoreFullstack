/**
 * GameHub Store — js/data.js
 * Datos simulados para la entrega EP1
 */

const PRODUCTOS = [
  {
    id: 1,
    nombre: "Notebook Gamer Asus ROG Strix G16",
    marca: "Asus",
    categoria: "consolas", // o categoria notebooks
    precio: 1499990,
    descuentoVigente: { activo: true, porcentaje: 10 },
    stockDisponible: 5,
    destacado: true,
    imagen: "assets/img/producto-teclado.jpg",
    descripcion: "Intel Core i7-13650HX, 16GB RAM DDR5, 512GB SSD NVMe, NVIDIA RTX 4060.",
    especificaciones: {
      procesador: "Intel Core i7-13650HX",
      ram: "16GB DDR5",
      almacenamiento: "512GB SSD",
      gpu: "NVIDIA GeForce RTX 4060 8GB"
    }
  },
  {
    id: 2,
    nombre: "Notebook Lenovo Legion Pro 5",
    marca: "Lenovo",
    categoria: "consolas",
    precio: 1699990,
    descuentoVigente: { activo: false, porcentaje: 0 },
    stockDisponible: 0, // CASO DE PRUEBA: SIN STOCK
    destacado: false,
    imagen: "assets/img/categoria-consolas.jpg",
    descripcion: "AMD Ryzen 7 7745HX, 32GB RAM DDR5, 1TB SSD, NVIDIA RTX 4070.",
    especificaciones: {
      procesador: "AMD Ryzen 7 7745HX",
      ram: "32GB DDR5",
      almacenamiento: "1TB SSD",
      gpu: "NVIDIA GeForce RTX 4070 8GB"
    }
  },
  {
    id: 3,
    nombre: "Tarjeta de Video MSI RTX 4070 Super Ventus",
    marca: "MSI",
    categoria: "accesorios",
    precio: 729990,
    descuentoVigente: { activo: true, porcentaje: 15 },
    stockDisponible: 7,
    destacado: true,
    imagen: "assets/img/categoria-accesorios.jpg",
    descripcion: "12GB GDDR6X, refrigeración Torx Fan 4.0 con backplate reforzado.",
    especificaciones: {
      memoria: "12GB GDDR6X",
      bus: "192-bit",
      consumo: "220W",
      refrigeracion: "Torx Fan 4.0"
    }
  },
  {
    id: 4,
    nombre: "Mouse Inalámbrico RGB Pro",
    marca: "Logitech",
    categoria: "perifericos",
    precio: 29999,
    descuentoVigente: { activo: false, porcentaje: 0 },
    stockDisponible: 12,
    destacado: true,
    imagen: "assets/img/producto-mouse-rgb.jpg",
    descripcion: "Sensor óptico de alta precisión, iluminación RGB y conexión 2.4GHz.",
    especificaciones: {
      sensor: "Óptico 16000 DPI",
      peso: "68g",
      autonomia: "Hasta 60 horas",
      conectividad: "Inalámbrico 2.4GHz"
    }
  },
  {
    id: 5,
    nombre: "Audífonos Surround 7.1 Pro",
    marca: "HyperX",
    categoria: "perifericos",
    precio: 45990,
    descuentoVigente: { activo: true, porcentaje: 10 },
    stockDisponible: 8,
    destacado: true,
    imagen: "assets/img/producto-audifonos.jpg",
    descripcion: "Audio espacial 7.1 virtual, micrófono con cancelación pasiva y almohadillas memory foam.",
    especificaciones: {
      audio: "Surround 7.1",
      drivers: "53mm",
      microfono: "Desmontable con cancelación",
      conexion: "Jack 3.5mm + USB DAC"
    }
  },
  {
    id: 6,
    nombre: "Teclado Mecánico TKL RGB",
    marca: "Redragon",
    categoria: "perifericos",
    precio: 59990,
    descuentoVigente: { activo: false, porcentaje: 0 },
    stockDisponible: 0, // CASO DE PRUEBA: SIN STOCK
    destacado: true,
    imagen: "assets/img/producto-teclado.jpg",
    descripcion: "Formato tenkeyless 80%, switches mecánicos lineales e iluminación RGB programable.",
    especificaciones: {
      switches: "Mecánicos Red Lineal",
      formato: "TKL (87 teclas)",
      chasis: "Aluminio cepillado",
      iluminacion: "RGB tecla a tecla"
    }
  },
  {
    id: 7,
    nombre: "Silla Gamer ProSeries Ergonómica",
    marca: "Cougar",
    categoria: "sillas",
    precio: 189990,
    descuentoVigente: { activo: true, porcentaje: 5 },
    stockDisponible: 4,
    destacado: true,
    imagen: "assets/img/producto-silla.jpg",
    descripcion: "Estructura de acero, soporte lumbar ajustable y pistón de gas clase 4.",
    especificaciones: {
      material: "Cuero sintético transpirable",
      reclinacion: "Hasta 170°",
      reposabrazos: "4D ajustables",
      pesoMaximo: "140 kg"
    }
  },
  {
    id: 8,
    nombre: "Monitor Gamer Curvo 27\" 165Hz",
    marca: "Samsung",
    categoria: "consolas",
    precio: 219990,
    descuentoVigente: { activo: false, porcentaje: 0 },
    stockDisponible: 6,
    destacado: false,
    imagen: "assets/img/categoria-consolas.jpg",
    descripcion: "Panel VA Full HD 1500R, 1ms MPRT y soporte AMD FreeSync Premium.",
    especificaciones: {
      pantalla: "27 pulgadas curva 1500R",
      resolucion: "1920x1080 FHD",
      tasaRefresco: "165Hz",
      tiempoRespuesta: "1ms"
    }
  }
];

const CUPONES = [
  {
    codigo: "GAMEHUB20",
    porcentaje: 20,
    topeMaximo: 50000,
    expira: "2026-12-31" // Vigente
  },
  {
    codigo: "BIENVENIDO10",
    porcentaje: 10,
    topeMaximo: 20000,
    expira: "2025-01-01" // Expirado (falla cuponVigente)
  }
];

const PERFILES_USUARIO = [
  { rol: "Visitante", permisos: ["navegar", "armar_carrito"] },
  { rol: "Cliente", permisos: ["navegar", "armar_carrito", "comprar", "resenar", "garantia"] },
  { rol: "Operador", permisos: ["gestionar_ordenes", "stock", "despachos"] },
  { rol: "Administrador", permisos: ["todo"] }
];