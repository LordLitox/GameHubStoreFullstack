# -*- coding: utf-8 -*-
"""
Genera los entregables DOCX de la EP3 a partir de las plantillas oficiales
(Anexo 2 y Anexo 4) de la Evaluación Parcial 3.

Uso:  python docs/build_docx.py
Salida: docs/DSY1104_EP3_Anexo2_Documentacion_API_e_Integracion.docx
        docs/DSY1104_EP3_Anexo4_Manual_de_Usuario.docx
"""
import copy
import os
import docx
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn

BASE = os.path.dirname(os.path.abspath(__file__))
DOWNLOADS = r"C:\Users\litox\Downloads"
PLANTILLA_ANEXO2 = os.path.join(DOWNLOADS, "DSY1104 Evaluación Parcial 3 - Anexo 2 Documentación APIs e Integración.docx")
PLANTILLA_ANEXO4 = os.path.join(DOWNLOADS, "DSY1104 Evaluación Parcial 3 - Anexo 4 Manual de usuario.docx")
CAPTURAS = os.path.join(BASE, "capturas")

PROYECTO = "GameHub Store"
VERSION = "1.0"
FECHA = "noviembre de 2026"


def borrar_desde(doc, indice):
    """Elimina todos los párrafos desde `indice` hacia el final (conserva los previos)."""
    cuerpo = doc.element.body
    parrafos = list(doc.paragraphs)
    for p in parrafos[indice:]:
        cuerpo.remove(p._element)


def clonar_estilo(doc, texto, estilo):
    p = doc.add_paragraph(texto, style=estilo)
    return p


def parrafo(doc, texto):
    return doc.add_paragraph(texto)


def vineta(doc, texto):
    return doc.add_paragraph(texto, style="List Paragraph")


def _negrita_parrafo(p):
    """Deja todo el párrafo en negrita (títulos de grupo de endpoints)."""
    for run in p.runs:
        run.bold = True
    return p


def negrita(parrafo_obj, prefijo):
    """Deja `prefijo` en negrita dentro de un párrafo que empieza con él."""
    if not parrafo_obj.runs:
        parrafo_obj.add_run(prefijo)
        return parrafo_obj
    run = parrafo_obj.runs[0]
    run.text = prefijo + run.text[len(prefijo):] if run.text.startswith(prefijo) else run.text
    run.bold = True
    return parrafo_obj


def imagen_con_nota(doc, nombre_archivo, titulo, numero, nota):
    """Inserta una imagen con borde, numerada y con su nota (formato del Anexo 4)."""
    doc.add_paragraph(f"{numero}. {titulo}", style="List Paragraph")
    ruta = os.path.join(CAPTURAS, nombre_archivo)
    if os.path.exists(ruta):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(ruta, width=Cm(15))
        # Borde negro 1px alrededor de la imagen.
        _borde_parrafo(p)
    doc.add_paragraph(f"Nota: {nota}", style="List Paragraph")


def _borde_parrafo(p):
    pPr = p._p.get_or_add_pPr()
    pbdr = pPr.makeelement(qn("w:pBdr"), {})
    for lado in ("top", "left", "bottom", "right"):
        b = pPr.makeelement(qn(f"w:{lado}"), {
            qn("w:val"): "single", qn("w:sz"): "4", qn("w:space"): "4", qn("w:color"): "000000",
        })
        pbdr.append(b)
    pPr.append(pbdr)


# ---------------------------------------------------------------------------
# Anexo 4 — Manual de Usuario
# ---------------------------------------------------------------------------
def construir_anexo4():
    doc = docx.Document(PLANTILLA_ANEXO4)
    # Cabecera: título y subtítulo.
    doc.paragraphs[5].text = "Manual de Usuario"
    doc.paragraphs[6].text = PROYECTO
    doc.paragraphs[26].text = f"Versión del Documento: {VERSION}"
    doc.paragraphs[27].text = f"Fecha de Creación: {FECHA}"

    # Se elimina la "hoja de evidencia" y todo el texto de relleno.
    borrar_desde(doc, 28)

    doc.add_paragraph("Introducción", style="Heading 4")
    vineta(doc, "Propósito del documento:")
    parrafo(doc, "Este manual describe, paso a paso, cómo usar GameHub Store: una tienda en "
                 "línea de productos gamer. Está dirigido a los tres perfiles del sistema "
                 "(Cliente, Vendedor y Administrador).")
    vineta(doc, "Descripción del sistema:")
    parrafo(doc, "GameHub Store permite explorar un catálogo de productos gamer, armar un "
                 "carrito, aplicar cupones y completar una compra con despacho. Los perfiles "
                 "internos gestionan los pedidos (pagos y despachos), el inventario y el "
                 "mantenedor de productos, categorías y promociones.")
    vineta(doc, "Cómo usar este manual:")
    parrafo(doc, "Cada sección corresponde a una tarea. Las imágenes van numeradas, con su "
                 "título y una nota; las que muestran un perfil específico lo indican.")

    doc.add_paragraph("Requisitos del Sistema", style="Heading 4")
    vineta(doc, "Hardware necesario:")
    parrafo(doc, "Un computador con al menos 4 GB de RAM, conexión a Internet y una pantalla "
                 "de 1280×720 px o superior. No se requiere hardware especial.")
    vineta(doc, "Software necesario:")
    parrafo(doc, "Un navegador web moderno (Chrome, Edge, Firefox o Safari). Para el entorno de "
                 "desarrollo: Node.js 20+ y el backend de microservicios en ejecución.")

    doc.add_paragraph("Instalación y Configuración", style="Heading 4")
    vineta(doc, "Instrucciones de instalación paso a paso:")
    parrafo(doc, "1) Levantar el backend (los 14 módulos, Eureka primero) en el puerto 8080. "
                 "2) En la carpeta del frontend, ejecutar `npm install` y luego `npm run dev`. "
                 "3) Abrir http://localhost:5173 en el navegador.")
    vineta(doc, "Configuración inicial:")
    parrafo(doc, "La aplicación apunta por defecto al API Gateway en "
                 "http://localhost:8080/api/v1. Ese valor se puede cambiar con la variable de "
                 "entorno VITE_API_URL al construir el proyecto.")

    doc.add_paragraph("Comenzando", style="Heading 4")
    vineta(doc, "Crear una cuenta / Iniciar sesión:")
    parrafo(doc, "Pulsa «Iniciar sesión» en la cabecera. Ingresa tu correo y contraseña, o usa "
                 "«Regístrate aquí» para crear una cuenta de cliente. Cuentas de prueba: "
                 "ana@gamehub.test (Administrador), luis@gamehub.test (Vendedor), "
                 "camila@gamehub.test (Cliente), todas con la clave `clave123`.")
    imagen_con_nota(doc, "04-checkout.png", "Ingreso de datos en el checkout", 1,
                    "El checkout exige sesión de Cliente; los campos se validan en vivo.")
    vineta(doc, "Interfaz de usuario inicial:")
    parrafo(doc, "La pantalla principal muestra el menú (filtrado por rol), el contador del "
                 "carrito y el bloque de sesión con tu nombre y rol.")

    doc.add_paragraph("Uso del Software", style="Heading 4")
    vineta(doc, "Funciones principales:")
    parrafo(doc, "Catálogo: filtra por categoría, marca y precio, y ordena el listado.")
    imagen_con_nota(doc, "01-catalogo.png", "Catálogo con filtros", 2,
                    "Los productos y el stock provienen del backend en tiempo real.")
    parrafo(doc, "Ficha de producto: imagen, especificaciones y reseñas reales de clientes.")
    imagen_con_nota(doc, "02-detalle.png", "Ficha de producto y reseñas", 3,
                    "Solo se muestran las reseñas aprobadas por el Administrador.")
    parrafo(doc, "Carrito y cupones: cambia cantidades, aplica un cupón y revisa los totales.")
    imagen_con_nota(doc, "03-carrito.png", "Carrito de compras y cupón", 4,
                    "El cupón se valida contra el servidor; el carrito persiste al recargar.")
    parrafo(doc, "Mis pedidos: historial real de compras y formulario de garantía técnica.")
    imagen_con_nota(doc, "05-ordenes.png", "Historial de pedidos", 5,
                    "Muestra el estado real de cada orden devuelto por el backend.")
    parrafo(doc, "Panel del Vendedor: bandeja de órdenes, pagos y despachos, e inventario.")
    imagen_con_nota(doc, "06-vendedor.png", "Panel de Ventas", 6,
                    "Disponible para los roles Vendedor y Administrador.")
    parrafo(doc, "Panel del Administrador: mantenedor de productos y cupones.")
    imagen_con_nota(doc, "07-admin.png", "Panel de Administración", 7,
                    "Los cambios se guardan en el servidor y se reflejan en la tienda.")
    parrafo(doc, "Accesos restringidos: si tu rol no alcanza una sección, se avisa en el lugar.")
    imagen_con_nota(doc, "08-acceso-restringido.png", "Aviso de acceso restringido", 8,
                    "El servidor también rechaza la petición: la seguridad no depende del menú.")

    vineta(doc, "Navegación por el software:")
    parrafo(doc, "El menú superior cambia según tu rol. Un Cliente ve Inicio, Catálogo, Carrito, "
                 "Checkout y Mis pedidos; un Vendedor agrega Ventas; un Administrador agrega "
                 "Administración.")

    salida = os.path.join(BASE, "DSY1104_EP3_Anexo4_Manual_de_Usuario.docx")
    doc.save(salida)
    print("Generado:", salida)


# ---------------------------------------------------------------------------
# Anexo 2 — Documentación APIs e Integración
# ---------------------------------------------------------------------------
ENDPOINTS = [
    ("Autenticación — auth-service", [
        ("POST", "/auth/login", "Inicia sesión y devuelve token + usuario.", "No", "200, 401"),
        ("POST", "/auth/registro", "Crea una cuenta de cliente.", "No", "201, 400"),
        ("POST", "/auth/renovar", "Emitir un token nuevo antes de que venza.", "Sí (cualquiera)", "200, 401"),
    ]),
    ("Productos — product-service", [
        ("GET", "/productos", "Catálogo activo; filtro ?categoria=.", "No", "200"),
        ("GET", "/productos/{id}", "Ficha completa de un producto.", "No", "200, 404"),
        ("GET", "/admin/productos", "Lista completa (activos e inactivos).", "Sí (ADMIN)", "200, 403"),
        ("POST", "/admin/productos", "Crea un producto.", "Sí (ADMIN)", "201, 400, 403"),
        ("PUT", "/admin/productos/{id}", "Actualiza un producto.", "Sí (ADMIN)", "200, 400, 404"),
        ("PATCH", "/admin/productos/{id}/activo", "Activa o desactiva la venta.", "Sí (ADMIN)", "200, 403"),
    ]),
    ("Categorías — category-service", [
        ("GET", "/categorias", "Categorías con conteo de productos activos.", "No", "200"),
        ("GET", "/admin/categorias", "Categorías del mantenedor.", "Sí (ADMIN)", "200, 403"),
        ("POST", "/admin/categorias", "Crea una categoría.", "Sí (ADMIN)", "201, 400"),
        ("PUT", "/admin/categorias/{id}", "Renombra una categoría.", "Sí (ADMIN)", "200, 404"),
        ("DELETE", "/admin/categorias/{id}", "Elimina una categoría sin productos.", "Sí (ADMIN)", "204, 409"),
    ]),
    ("Inventario — inventory-service", [
        ("GET", "/inventario/stock", "Stock por producto (?productos=1,2).", "No", "200"),
        ("GET", "/operador/inventario", "Stock para el panel del vendedor.", "Sí (OPERADOR)", "200, 403"),
        ("GET", "/operador/inventario/movimientos", "Historial de movimientos.", "Sí (OPERADOR)", "200, 403"),
        ("POST", "/operador/inventario/movimientos", "Registra INGRESO/SALIDA/AJUSTE.", "Sí (OPERADOR)", "201, 400"),
    ]),
    ("Promociones — promotion-service", [
        ("GET", "/promociones/validar", "Valida un cupón (?codigo=).", "No", "200, 404"),
        ("GET", "/admin/promociones", "Lista de promociones.", "Sí (ADMIN)", "200, 403"),
        ("POST", "/admin/promociones", "Crea una promoción.", "Sí (ADMIN)", "201, 400"),
        ("PUT", "/admin/promociones/{id}", "Actualiza una promoción.", "Sí (ADMIN)", "200, 404"),
        ("PATCH", "/admin/promociones/{id}/activo", "Activa o desactiva la promoción.", "Sí (ADMIN)", "200, 403"),
    ]),
    ("Carrito y órdenes — order-service", [
        ("POST", "/carrito/validar", "Valida el carrito contra stock y precios.", "No", "200, 400"),
        ("POST", "/ordenes", "Crea la orden y registra el pago simulado.", "Sí (CLIENTE)", "201, 400"),
        ("GET", "/ordenes/mias", "Historial del cliente autenticado.", "Sí (CLIENTE)", "200, 401"),
        ("GET", "/ordenes/{id}", "Detalle de una orden propia.", "Sí (CLIENTE)", "200, 404"),
        ("GET", "/operador/resumen", "Cifras del panel de ventas.", "Sí (OPERADOR)", "200, 403"),
        ("GET", "/operador/ordenes", "Bandeja de órdenes (?estado=).", "Sí (OPERADOR)", "200, 403"),
        ("POST", "/operador/ordenes/{id}/pago/confirmar", "Confirma un pago pendiente.", "Sí (OPERADOR)", "200, 409"),
        ("POST", "/operador/ordenes/{id}/despacho", "Genera el despacho.", "Sí (OPERADOR)", "200, 409"),
        ("PUT", "/operador/ordenes/{id}/despacho", "Avanza el despacho.", "Sí (OPERADOR)", "200, 400"),
    ]),
    ("Reseñas — review-service", [
        ("GET", "/productos/{id}/resenas", "Reseñas aprobadas del producto.", "No", "200"),
        ("GET", "/resenas/resumen", "Promedio y cantidad por producto.", "No", "200"),
        ("POST", "/resenas", "Publica una reseña (queda PENDIENTE).", "Sí (CLIENTE)", "201, 400"),
        ("GET", "/admin/resenas", "Reseñas para moderar.", "Sí (ADMIN)", "200, 403"),
        ("PUT", "/admin/resenas/{id}", "Aprueba u oculta una reseña.", "Sí (ADMIN)", "200, 404"),
    ]),
    ("Pagos, despachos y garantías", [
        ("GET", "/operador/pagos", "Pagos (?estado=).", "Sí (OPERADOR)", "200, 403"),
        ("GET", "/operador/despachos", "Despachos (?estado=).", "Sí (OPERADOR)", "200, 403"),
        ("GET", "/garantias", "Garantías del cliente.", "Sí (CLIENTE)", "200, 401"),
        ("PUT", "/operador/garantias/{id}", "Cambia el estado de una garantía.", "Sí (OPERADOR)", "200, 404"),
    ]),
    ("Usuarios — user-service / auth-service", [
        ("GET", "/usuarios/perfil", "Perfil del usuario con sesión.", "Sí (cualquiera)", "200, 401"),
        ("PUT", "/usuarios/perfil", "Actualiza el perfil.", "Sí (cualquiera)", "200, 400"),
        ("GET", "/admin/usuarios", "Lista de cuentas.", "Sí (ADMIN)", "200, 403"),
        ("PATCH", "/admin/usuarios/{id}/activo", "Activa o desactiva una cuenta.", "Sí (ADMIN)", "200, 403"),
    ]),
]


def construir_anexo2():
    doc = docx.Document(PLANTILLA_ANEXO2)
    doc.paragraphs[5].text = "Documentación APIs e Integración"
    doc.paragraphs[6].text = PROYECTO
    doc.paragraphs[24].text = f"Título: Documentación de API de {PROYECTO}"
    doc.paragraphs[25].text = f"Versión del Documento: {VERSION}"
    doc.paragraphs[26].text = f"Fecha de Creación: {FECHA}"

    borrar_desde(doc, 28)

    doc.add_paragraph("Descripción General", style="Heading 4")
    parrafo(doc, "GameHub Store es una tienda gamer con frontend React y backend de "
                 "microservicios Spring Boot. Este documento describe los endpoints que el API "
                 "Gateway expone al frontend, el contrato de datos entre ambos y los mecanismos "
                 "de seguridad por token y rol. La integración se realizó en la Evaluación "
                 "Parcial 3 (EP3).")

    doc.add_paragraph("Información General", style="Heading 4")
    vineta(doc, "URL de la API: http://localhost:8080/api/v1")
    vineta(doc, "URL Swagger: http://localhost:8080/swagger-ui.html")
    vineta(doc, "Autenticación: JWT en la cabecera Authorization: Bearer <token>")
    vineta(doc, "Formato de error: { \"mensaje\": string, \"errores\": { campo: detalle } }")
    vineta(doc, "Descubrimiento de servicios: Eureka en http://localhost:8761")

    doc.add_paragraph("Arquitectura de la Integración", style="Heading 4")
    parrafo(doc, "El frontend habla únicamente con el API Gateway, que enruta por ruta y valida "
                 "el token antes de reenviar la petición al microservicio correspondiente. Los "
                 "servicios internos no publican puertos y se comunican entre sí por /internal/**. "
                 "El frontend concentra el acceso HTTP en src/services/ (un cliente único más un "
                 "módulo por recurso) y traduce los DTO con adaptadores.")

    doc.add_paragraph("Contrato de Datos", style="Heading 4")
    parrafo(doc, "Los nombres de campo del backend no siempre coinciden con los que usan las "
                 "vistas. La traducción vive en src/services/adaptadores.js. Los desajustes "
                 "principales son: precio/precioNormal → precio + descuentoVigente; "
                 "categoriaSlug → categoría del filtro; stock (inventory-service) → "
                 "stockDisponible; especificaciones (lista) → objeto; correo → email del "
                 "formulario; método de pago webpay/mach → DEBITO.")

    doc.add_paragraph("Seguridad: Token y Roles", style="Heading 4")
    parrafo(doc, "El login devuelve un JWT que el frontend guarda y envía en cada petición. Si "
                 "el servidor responde 401, el frontend cierra la sesión. El rol se valida en el "
                 "backend: ADMIN (Administrador) accede a todo; OPERADOR (Vendedor) al panel de "
                 "ventas; CLIENTE (Cliente) a catálogo, carrito, checkout e historial.")

    doc.add_paragraph("Documentación de Endpoints", style="Heading 4")
    for grupo, filas in ENDPOINTS:
        _negrita_parrafo(doc.add_paragraph(grupo))
        for metodo, ruta, desc, auth, resp in filas:
            vineta(doc, f"{metodo} {ruta}")
            vineta(doc, f"Descripción: {desc}")
            vineta(doc, f"Método: {metodo}")
            vineta(doc, f"Respuesta: {resp}")
            vineta(doc, f"Autenticación: {auth}")

    doc.add_paragraph("Pruebas y Verificación", style="Heading 4")
    vineta(doc, "Pruebas unitarias: 157/157 en verde (npm test).")
    vineta(doc, "Cobertura: 82,6% sentencias · 84,1% líneas.")
    vineta(doc, "Humo HTTP contra el Gateway real: 21/21 (scripts/verificar-flujo-ep3.mjs).")
    vineta(doc, "Humo de navegador (CDP): 14/14 con pantallazos (scripts/verificar-navegador-ep3.mjs).")

    salida = os.path.join(BASE, "DSY1104_EP3_Anexo2_Documentacion_API_e_Integracion.docx")
    doc.save(salida)
    print("Generado:", salida)


if __name__ == "__main__":
    construir_anexo2()
    construir_anexo4()
