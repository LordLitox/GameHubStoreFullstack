# -*- coding: utf-8 -*-
"""
Genera la planilla de endpoints de la EP3 (Anexo 3) a partir de la plantilla
oficial, conservando su estructura de columnas:

    Método HTTP | Ruta | Descripción | Datos de entrada | Respuestas |
    API PÚBLICA/PRIVADA | Requiere Autenticación | Roles permitidos | Observaciones

Uso:  python docs/build_xlsx.py
Salida: docs/DSY1104_EP3_Anexo3_Documentacion_APIs.xlsx
"""
import os
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side

BASE = os.path.dirname(os.path.abspath(__file__))
PLANTILLA = r"C:\Users\litox\Downloads\DSY1104 Evaluación Parcial 3 - Anexo 3 Documentación APIs.xlsx"
SALIDA = os.path.join(BASE, "DSY1104_EP3_Anexo3_Documentacion_APIs.xlsx")

# (método, ruta, descripción, datos de entrada, respuestas, pública, auth, roles, observaciones)
ENDPOINTS = [
    ("POST", "/api/v1/auth/login", "Inicia sesión y devuelve un JWT con el usuario", '{email, clave}', "200: Éxito, 401: Credenciales inválidas", "Pública", "No", "N/A", "Cuenta desactivada también recibe 401"),
    ("POST", "/api/v1/auth/registro", "Crea una cuenta de cliente y deja la sesión iniciada", '{nombre, email, clave, telefono, region, comuna, direccion}', "201: Creado, 400: Datos inválidos", "Pública", "No", "N/A", "El correo debe ser único"),
    ("POST", "/api/v1/auth/renovar", "Emite un token nuevo antes de que venza", "N/A", "200: Éxito, 401: Sesión vencida", "Privada", "Sí", "Cualquiera", "Exige un token vigente"),

    ("GET", "/api/v1/productos", "Catálogo activo; filtro opcional por categoría", "Query: ?categoria=slug", "200: Éxito", "Pública", "No", "N/A", "No incluye productos inactivos"),
    ("GET", "/api/v1/productos/{id}", "Ficha completa de un producto", "Path: id", "200: Éxito, 404: No encontrado", "Pública", "No", "N/A", "Incluye especificaciones"),
    ("GET", "/api/v1/admin/productos", "Lista completa de productos (activos e inactivos)", "N/A", "200: Éxito, 403: Prohibido", "Privada", "Sí", "ADMIN", "Es el mantenedor"),
    ("POST", "/api/v1/admin/productos", "Crea un producto", '{sku, nombre, marca, categoriaId, precio, precioNormal, stock, imagen, descripcion, especificaciones}', "201: Creado, 400: Datos inválidos, 403: Prohibido", "Privada", "Sí", "ADMIN", "El stock inicial se registra en inventory-service"),
    ("PUT", "/api/v1/admin/productos/{id}", "Actualiza un producto", "Path: id + mismos campos del POST", "200: Éxito, 400: Datos inválidos, 404: No encontrado", "Privada", "Sí", "ADMIN", ""),
    ("PATCH", "/api/v1/admin/productos/{id}/activo", "Activa o desactiva la venta del producto", '{activo}', "200: Éxito, 403: Prohibido", "Privada", "Sí", "ADMIN", "No hay borrado físico"),

    ("GET", "/api/v1/categorias", "Categorías con su cantidad de productos activos", "N/A", "200: Éxito", "Pública", "No", "N/A", ""),
    ("GET", "/api/v1/admin/categorias", "Categorías del mantenedor (incluye inactivos)", "N/A", "200: Éxito, 403: Prohibido", "Privada", "Sí", "ADMIN", ""),
    ("POST", "/api/v1/admin/categorias", "Crea una categoría", '{nombre}', "201: Creado, 400: Datos inválidos", "Privada", "Sí", "ADMIN", ""),
    ("PUT", "/api/v1/admin/categorias/{id}", "Renombra una categoría", '{nombre}', "200: Éxito, 404: No encontrado", "Privada", "Sí", "ADMIN", ""),
    ("DELETE", "/api/v1/admin/categorias/{id}", "Elimina una categoría sin productos", "Path: id", "204: Sin contenido, 409: Tiene productos", "Privada", "Sí", "ADMIN", "Solo si no tiene productos"),

    ("GET", "/api/v1/inventario/stock", "Stock por producto", "Query: ?productos=1,2", "200: Éxito", "Pública", "No", "N/A", "Sin filtro, devuelve todo el stock"),
    ("GET", "/api/v1/operador/inventario", "Stock para el panel del vendedor", "N/A", "200: Éxito, 403: Prohibido", "Privada", "Sí", "OPERADOR", ""),
    ("GET", "/api/v1/operador/inventario/movimientos", "Historial de movimientos de bodega", "N/A", "200: Éxito, 403: Prohibido", "Privada", "Sí", "OPERADOR", ""),
    ("POST", "/api/v1/operador/inventario/movimientos", "Registra un movimiento de stock", '{productoId, tipo, cantidad, motivo}', "201: Creado, 400: Datos inválidos", "Privada", "Sí", "OPERADOR", "tipo: INGRESO, SALIDA o AJUSTE"),

    ("GET", "/api/v1/promociones/validar", "Valida un cupón por su código", "Query: ?codigo=", "200: Éxito, 404: No válido", "Pública", "No", "N/A", "Revisa vigencia, usos y estado"),
    ("GET", "/api/v1/admin/promociones", "Lista de promociones", "N/A", "200: Éxito, 403: Prohibido", "Privada", "Sí", "ADMIN", ""),
    ("POST", "/api/v1/admin/promociones", "Crea una promoción", '{codigo, porcentaje, tope, inicio, termino, usosMaximos}', "201: Creado, 400: Datos inválidos", "Privada", "Sí", "ADMIN", ""),
    ("PUT", "/api/v1/admin/promociones/{id}", "Actualiza una promoción", "Path: id + campos del POST", "200: Éxito, 404: No encontrado", "Privada", "Sí", "ADMIN", ""),
    ("PATCH", "/api/v1/admin/promociones/{id}/activo", "Activa o desactiva una promoción", '{activa}', "200: Éxito, 403: Prohibido", "Privada", "Sí", "ADMIN", ""),

    ("POST", "/api/v1/carrito/validar", "Valida el carrito contra stock y precios", '{lineas:[{productoId,cantidad}], cupon}', "200: Éxito, 400: Datos inválidos", "Pública", "No", "N/A", "El cupón es opcional"),
    ("POST", "/api/v1/ordenes", "Crea la orden y registra el pago simulado", '{lineas, cupon, metodoPago, despacho}', "201: Creado, 400: Datos inválidos", "Privada", "Sí", "CLIENTE", "Descuenta stock al aprobar el pago"),
    ("GET", "/api/v1/ordenes/mias", "Historial de órdenes del cliente", "N/A", "200: Éxito, 401: Sin sesión", "Privada", "Sí", "CLIENTE", ""),
    ("GET", "/api/v1/ordenes/{id}", "Detalle de una orden propia", "Path: id", "200: Éxito, 404: No encontrado", "Privada", "Sí", "CLIENTE", ""),
    ("GET", "/api/v1/operador/resumen", "Cifras del panel de ventas", "N/A", "200: Éxito, 403: Prohibido", "Privada", "Sí", "OPERADOR", "Pagos, despachos y en curso"),
    ("GET", "/api/v1/operador/ordenes", "Bandeja de órdenes", "Query: ?estado=", "200: Éxito, 403: Prohibido", "Privada", "Sí", "OPERADOR", ""),
    ("GET", "/api/v1/operador/ordenes/{id}", "Detalle completo de cualquier orden", "Path: id", "200: Éxito, 404: No encontrado", "Privada", "Sí", "OPERADOR", ""),
    ("POST", "/api/v1/operador/ordenes/{id}/pago/confirmar", "Confirma una transferencia pendiente y descuenta stock", "Path: id", "200: Éxito, 409: Estado inválido", "Privada", "Sí", "OPERADOR", ""),
    ("POST", "/api/v1/operador/ordenes/{id}/pago/anular", "Anula un pago pendiente", "Path: id", "200: Éxito, 409: Estado inválido", "Privada", "Sí", "OPERADOR", ""),
    ("POST", "/api/v1/operador/ordenes/{id}/despacho", "Genera el despacho en shipping-service", '{seguimiento, fechaEstimada}', "200: Éxito, 409: Estado inválido", "Privada", "Sí", "OPERADOR", "Ambos campos son opcionales"),
    ("PUT", "/api/v1/operador/ordenes/{id}/despacho", "Avanza el estado del despacho", '{estado, seguimiento, fechaEstimada}', "200: Éxito, 400: Estado inválido", "Privada", "Sí", "OPERADOR", "DESPACHADO, EN_TRANSITO, ENTREGADO"),

    ("GET", "/api/v1/operador/pagos", "Listado de pagos para el vendedor", "Query: ?estado=", "200: Éxito, 403: Prohibido", "Privada", "Sí", "OPERADOR", ""),
    ("GET", "/api/v1/operador/despachos", "Listado de despachos para el vendedor", "Query: ?estado=", "200: Éxito, 403: Prohibido", "Privada", "Sí", "OPERADOR", ""),

    ("GET", "/api/v1/productos/{id}/resenas", "Reseñas aprobadas de un producto", "Path: id", "200: Éxito", "Pública", "No", "N/A", "Solo las aprobadas por el admin"),
    ("GET", "/api/v1/resenas/resumen", "Promedio y cantidad de reseñas por producto", "Query: ?productos=1,2", "200: Éxito", "Pública", "No", "N/A", ""),
    ("GET", "/api/v1/resenas/mias", "Reseñas del cliente autenticado", "N/A", "200: Éxito, 401: Sin sesión", "Privada", "Sí", "CLIENTE", ""),
    ("POST", "/api/v1/resenas", "Publica una reseña de una compra", '{ordenId, productoId, puntuacion, comentario}', "201: Creado, 400: Datos inválidos", "Privada", "Sí", "CLIENTE", "Queda PENDIENTE hasta aprobarse"),
    ("GET", "/api/v1/admin/resenas", "Reseñas para moderar", "Query: ?estado=", "200: Éxito, 403: Prohibido", "Privada", "Sí", "ADMIN", ""),
    ("PUT", "/api/v1/admin/resenas/{id}", "Aprueba u oculta una reseña", '{estado}', "200: Éxito, 404: No encontrado", "Privada", "Sí", "ADMIN", "APROBADA u OCULTA"),

    ("GET", "/api/v1/usuarios/perfil", "Perfil del usuario con sesión", "N/A", "200: Éxito, 401: Sin sesión", "Privada", "Sí", "Cualquiera", ""),
    ("PUT", "/api/v1/usuarios/perfil", "Actualiza el perfil del usuario", '{nombre, telefono, region, comuna, direccion}', "200: Éxito, 400: Datos inválidos", "Privada", "Sí", "Cualquiera", ""),
    ("GET", "/api/v1/admin/usuarios", "Listado de cuentas", "N/A", "200: Éxito, 403: Prohibido", "Privada", "Sí", "ADMIN", ""),
    ("PATCH", "/api/v1/admin/usuarios/{id}/activo", "Activa o desactiva una cuenta", '{activo}', "200: Éxito, 403: Prohibido", "Privada", "Sí", "ADMIN", "Una cuenta desactivada no puede entrar"),

    ("GET", "/api/v1/garantias", "Garantías del cliente", "N/A", "200: Éxito, 401: Sin sesión", "Privada", "Sí", "CLIENTE", ""),
    ("GET", "/api/v1/operador/garantias", "Garantías para el vendedor", "N/A", "200: Éxito, 403: Prohibido", "Privada", "Sí", "OPERADOR", ""),
    ("PUT", "/api/v1/operador/garantias/{id}", "Cambia el estado de una garantía", '{estado, resolucion}', "200: Éxito, 404: No encontrado", "Privada", "Sí", "OPERADOR", ""),
]


def construir():
    wb = openpyxl.load_workbook(PLANTILLA)
    ws = wb.active

    # Encabezado del documento (filas 2, 5, 6, 8, 9) — columnas D en adelante.
    ws.cell(2, 4).value = "Documentación de API - GAMEHUB STORE"
    ws.cell(5, 4).value = "Versión 1.0"
    ws.cell(6, 4).value = "Fecha: noviembre de 2026"
    ws.cell(8, 4).value = "URL"
    ws.cell(8, 5).value = "http://localhost:8080/api/v1"
    ws.cell(9, 4).value = "URL SWAGGER"
    ws.cell(9, 5).value = "http://localhost:8080/swagger-ui.html"

    # Borra las filas de ejemplo (desde la 13) para dejar solo el encabezado de tabla (12).
    ws.delete_rows(13, ws.max_row - 12)

    borde = Border(*[Side(style="thin", color="BBBBBB")] * 4)
    relleno = PatternFill("solid", fgColor="DDEBF7")

    fila = 13
    for (metodo, ruta, desc, entrada, resp, publica, auth, roles, obs) in ENDPOINTS:
        valores = [None, None, None, metodo, ruta, desc, entrada, resp, publica, auth, roles, obs]
        for col, valor in enumerate(valores, start=1):
            celda = ws.cell(fila, col)
            celda.value = valor
            celda.border = borde
            celda.alignment = Alignment(vertical="top", wrap_text=True)
            if col == 4:
                celda.font = Font(bold=True)
                celda.fill = relleno
        fila += 1

    # Anchos de columna legibles (D..L).
    anchos = {"D": 12, "E": 42, "F": 46, "G": 40, "H": 34, "I": 12, "J": 12, "K": 12, "L": 34}
    for col, ancho in anchos.items():
        ws.column_dimensions[col].width = ancho

    wb.save(SALIDA)
    print(f"Generado: {SALIDA} ({len(ENDPOINTS)} endpoints)")


if __name__ == "__main__":
    construir()
