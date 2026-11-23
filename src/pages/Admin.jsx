import { useState } from "react";
import { useTitulo } from "../hooks/useTitulo.js";
import { useDatos } from "../hooks/useDatos.js";
import { Cargando, ErrorCarga } from "../components/EstadoCarga.jsx";
import {
  admin as servicioAdmin,
  catalogo as servicioCatalogo,
  mensajeDeError,
} from "../services/index.js";

// Formulario vacío para reutilizarlo como estado inicial (crear) y como
// valor de reinicio tras una operación exitosa.
const FORM_PRODUCTO_VACIO = {
  nombre: "",
  marca: "",
  categoriaId: "",
  precio: "",
  precioNormal: "",
  stock: "",
  imagen: "",
  descripcion: "",
  activo: true,
};

const FORM_CUPON_VACIO = {
  codigo: "",
  porcentaje: "",
  topeMaximo: "",
  inicio: "",
  expira: "",
  usosMaximos: "1",
};

function formatearPrecio(valor) {
  return `$${Number(valor ?? 0).toLocaleString("es-CL")}`;
}

/**
 * Panel de administración (rol ADMIN).
 *
 * EP3 · Parte 6: las colecciones ya no viven en la memoria del navegador. La
 * interfaz ahora consume `services/admin.js` contra `/api/v1/admin/**`
 * (product-service, category-service y promotion-service). Cada escritura se
 * confirma en el servidor y luego se refresca la tabla con la respuesta real:
 * así el ID y los precios que se ven son los que quedaron guardados.
 *
 * La pestaña de cupones trabaja sobre promociones; el CRUD de productos
 * incluye activar/desactivar la venta (no hay borrado físico en el backend).
 */
export default function Admin() {
  useTitulo("Administración — GameHub Store");

  const [vista, setVista] = useState("productos");
  const [mensaje, setMensaje] = useState(null); // { tipo: "exito" | "error", texto }

  const [formProducto, setFormProducto] = useState(FORM_PRODUCTO_VACIO);
  const [idEnEdicion, setIdEnEdicion] = useState(null);

  const [formCupon, setFormCupon] = useState(FORM_CUPON_VACIO);
  const [idCuponEnEdicion, setIdCuponEnEdicion] = useState(null);

  const [ocupado, setOcupado] = useState(false);

  // Datos del backend (productos activos e inactivos, y promociones).
  const {
    datos: productos,
    cargando: cargandoProductos,
    error: errorProductos,
    recargar: recargarProductos,
  } = useDatos(() => servicioAdmin.productos.listar(), []);

  const { datos: categorias } = useDatos(() => servicioAdmin.categorias.listar(), []);

  const {
    datos: cupones,
    cargando: cargandoCupones,
    error: errorCupones,
    recargar: recargarCupones,
  } = useDatos(() => servicioAdmin.promociones.listar(), []);

  function avisar(tipo, texto) {
    setMensaje({ tipo, texto });
  }

  // ------------------------------- Productos -------------------------------

  function cambiarCampoProducto(campo, valor) {
    setFormProducto((previo) => ({ ...previo, [campo]: valor }));
  }

  async function enviarProducto(evento) {
    evento.preventDefault();
    setOcupado(true);
    setMensaje(null);
    try {
      const datos = {
        nombre: formProducto.nombre,
        marca: formProducto.marca,
        categoriaId: formProducto.categoriaId,
        precio: formProducto.precio,
        precioNormal: formProducto.precioNormal,
        stock: formProducto.stock,
        imagen: formProducto.imagen,
        descripcion: formProducto.descripcion,
      };

      if (idEnEdicion === null) {
        await servicioAdmin.productos.crear(datos);
        avisar("exito", "Producto creado correctamente.");
      } else {
        await servicioAdmin.productos.actualizar(idEnEdicion, datos);
        avisar("exito", "Producto actualizado correctamente.");
      }

      setFormProducto(FORM_PRODUCTO_VACIO);
      setIdEnEdicion(null);
      recargarProductos();
      servicioCatalogo.invalidar();
    } catch (fallo) {
      avisar("error", mensajeDeError(fallo));
    } finally {
      setOcupado(false);
    }
  }

  function editarProducto(producto) {
    setIdEnEdicion(producto.id);
    setFormProducto({
      nombre: producto.nombre,
      marca: producto.marca,
      categoriaId: String(producto.categoriaId ?? ""),
      precio: String(producto.precio ?? ""),
      precioNormal: producto.precioNormal ? String(producto.precioNormal) : "",
      stock: "",
      imagen: producto.imagen ?? "",
      descripcion: producto.descripcion ?? "",
      activo: producto.activo,
    });
    setMensaje(null);
  }

  function cancelarEdicionProducto() {
    setIdEnEdicion(null);
    setFormProducto(FORM_PRODUCTO_VACIO);
    setMensaje(null);
  }

  async function alternarActivo(producto) {
    setOcupado(true);
    setMensaje(null);
    try {
      await servicioAdmin.productos.cambiarActivo(producto.id, !producto.activo);
      avisar(
        "exito",
        `Producto "${producto.nombre}" ${producto.activo ? "desactivado" : "activado"}.`
      );
      recargarProductos();
      servicioCatalogo.invalidar();
    } catch (fallo) {
      avisar("error", mensajeDeError(fallo));
    } finally {
      setOcupado(false);
    }
  }

  // -------------------------------- Cupones --------------------------------

  function cambiarCampoCupon(campo, valor) {
    setFormCupon((previo) => ({ ...previo, [campo]: valor }));
  }

  async function enviarCupon(evento) {
    evento.preventDefault();
    setOcupado(true);
    setMensaje(null);
    try {
      const datos = {
        codigo: formCupon.codigo,
        porcentaje: formCupon.porcentaje,
        topeMaximo: formCupon.topeMaximo,
        inicio: formCupon.inicio,
        expira: formCupon.expira,
        usosMaximos: formCupon.usosMaximos,
      };

      if (idCuponEnEdicion === null) {
        await servicioAdmin.promociones.crear(datos);
        avisar("exito", "Cupón creado correctamente.");
      } else {
        await servicioAdmin.promociones.actualizar(idCuponEnEdicion, datos);
        avisar("exito", "Cupón actualizado correctamente.");
      }

      setFormCupon(FORM_CUPON_VACIO);
      setIdCuponEnEdicion(null);
      recargarCupones();
    } catch (fallo) {
      avisar("error", mensajeDeError(fallo));
    } finally {
      setOcupado(false);
    }
  }

  function editarCupon(cupon) {
    setIdCuponEnEdicion(cupon.id);
    setFormCupon({
      codigo: cupon.codigo,
      porcentaje: String(cupon.porcentaje ?? ""),
      topeMaximo: String(cupon.topeMaximo ?? ""),
      inicio: cupon.inicio ?? "",
      expira: cupon.expira ?? "",
      usosMaximos: String(cupon.usosMaximos ?? 1),
    });
    setMensaje(null);
  }

  function cancelarEdicionCupon() {
    setIdCuponEnEdicion(null);
    setFormCupon(FORM_CUPON_VACIO);
    setMensaje(null);
  }

  async function alternarActivoCupon(cupon) {
    setOcupado(true);
    setMensaje(null);
    try {
      await servicioAdmin.promociones.cambiarActivo(cupon.id, !cupon.activa);
      avisar("exito", `Cupón "${cupon.codigo}" ${cupon.activa ? "desactivado" : "activado"}.`);
      recargarCupones();
    } catch (fallo) {
      avisar("error", mensajeDeError(fallo));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="seccion">
      <div className="container">
        <h1>Administración</h1>
        <p>
          Gestiona el catálogo de productos y los cupones de descuento. Los
          cambios se guardan en el servidor (product-service y promotion-service).
        </p>

        {/* Pestañas de la sección */}
        <div className="mb-4 d-flex gap-2" role="tablist" aria-label="Secciones de administración">
          <button
            type="button"
            role="tab"
            id="tab-productos"
            aria-selected={vista === "productos"}
            aria-controls="panel-productos"
            className={`btn ${vista === "productos" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setVista("productos")}
          >
            Productos
          </button>
          <button
            type="button"
            role="tab"
            id="tab-cupones"
            aria-selected={vista === "cupones"}
            aria-controls="panel-cupones"
            className={`btn ${vista === "cupones" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setVista("cupones")}
          >
            Cupones
          </button>
        </div>

        {mensaje && (
          <div
            className={`alert ${mensaje.tipo === "exito" ? "alert-success" : "alert-danger"}`}
            role={mensaje.tipo === "exito" ? "status" : "alert"}
          >
            {mensaje.texto}
          </div>
        )}

        {vista === "productos" ? (
          <section id="panel-productos" role="tabpanel" aria-labelledby="tab-productos">
            <h2>Gestión de productos</h2>

            {cargandoProductos && <Cargando texto="Cargando productos…" />}
            {errorProductos && (
              <ErrorCarga mensaje={errorProductos} onReintentar={recargarProductos} />
            )}

            <div className="row g-4">
              {/* Formulario */}
              <div className="col-12 col-lg-5">
                <div className="card">
                  <div className="card-body">
                    <h3 className="h5 mb-3">
                      {idEnEdicion === null ? "Nuevo producto" : `Editar producto #${idEnEdicion}`}
                    </h3>

                    <form onSubmit={enviarProducto} noValidate>
                      <div className="mb-3">
                        <label className="form-label" htmlFor="prod-nombre">Nombre *</label>
                        <input
                          className="form-control"
                          id="prod-nombre"
                          value={formProducto.nombre}
                          onChange={(e) => cambiarCampoProducto("nombre", e.target.value)}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label" htmlFor="prod-marca">Marca *</label>
                        <input
                          className="form-control"
                          id="prod-marca"
                          value={formProducto.marca}
                          onChange={(e) => cambiarCampoProducto("marca", e.target.value)}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label" htmlFor="prod-categoria">Categoría *</label>
                        <select
                          className="form-select"
                          id="prod-categoria"
                          value={formProducto.categoriaId}
                          onChange={(e) => cambiarCampoProducto("categoriaId", e.target.value)}
                        >
                          <option value="">Selecciona una categoría...</option>
                          {(categorias ?? []).map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                          ))}
                        </select>
                      </div>

                      <div className="row">
                        <div className="col-6 mb-3">
                          <label className="form-label" htmlFor="prod-precio">Precio ($) *</label>
                          <input
                            className="form-control"
                            type="number"
                            min="0"
                            id="prod-precio"
                            value={formProducto.precio}
                            onChange={(e) => cambiarCampoProducto("precio", e.target.value)}
                          />
                        </div>
                        <div className="col-6 mb-3">
                          <label className="form-label" htmlFor="prod-precio-normal">Precio normal ($)</label>
                          <input
                            className="form-control"
                            type="number"
                            min="0"
                            id="prod-precio-normal"
                            placeholder="Solo si hay oferta"
                            value={formProducto.precioNormal}
                            onChange={(e) => cambiarCampoProducto("precioNormal", e.target.value)}
                          />
                        </div>
                      </div>

                      {idEnEdicion === null && (
                        <div className="mb-3">
                          <label className="form-label" htmlFor="prod-stock">Stock inicial</label>
                          <input
                            className="form-control"
                            type="number"
                            min="0"
                            id="prod-stock"
                            value={formProducto.stock}
                            onChange={(e) => cambiarCampoProducto("stock", e.target.value)}
                          />
                        </div>
                      )}

                      <div className="mb-3">
                        <label className="form-label" htmlFor="prod-imagen">Ruta de imagen</label>
                        <input
                          className="form-control"
                          id="prod-imagen"
                          placeholder="/assets/img/producto-*.jpg"
                          value={formProducto.imagen}
                          onChange={(e) => cambiarCampoProducto("imagen", e.target.value)}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label" htmlFor="prod-descripcion">Descripción</label>
                        <textarea
                          className="form-control"
                          id="prod-descripcion"
                          rows="2"
                          value={formProducto.descripcion}
                          onChange={(e) => cambiarCampoProducto("descripcion", e.target.value)}
                        />
                      </div>

                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-primary" disabled={ocupado}>
                          {idEnEdicion === null ? "Crear producto" : "Guardar cambios"}
                        </button>
                        {idEnEdicion !== null && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={cancelarEdicionProducto}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Tabla */}
              <div className="col-12 col-lg-7">
                <h3 className="h5 mb-2">Catálogo ({(productos ?? []).length})</h3>

                <div className="table-responsive">
                  <table className="table table-striped align-middle">
                    <caption className="visualmente-oculto">Listado de productos</caption>
                    <thead>
                      <tr>
                        <th scope="col">ID</th>
                        <th scope="col">Nombre</th>
                        <th scope="col">Categoría</th>
                        <th scope="col">Precio</th>
                        <th scope="col">Estado</th>
                        <th scope="col">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(productos ?? []).map((producto) => (
                        <tr key={producto.id}>
                          <td>{producto.id}</td>
                          <td>
                            {producto.nombre}
                            {producto.precioNormal > producto.precio && (
                              <span className="badge text-bg-warning ms-2">Oferta</span>
                            )}
                          </td>
                          <td>{producto.categoria}</td>
                          <td>{formatearPrecio(producto.precio)}</td>
                          <td>
                            {producto.activo ? (
                              <span className="badge text-bg-success">Activo</span>
                            ) : (
                              <span className="badge text-bg-secondary">Inactivo</span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                aria-label={`Editar ${producto.nombre}`}
                                onClick={() => editarProducto(producto)}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                disabled={ocupado}
                                aria-label={`${producto.activo ? "Desactivar" : "Activar"} ${producto.nombre}`}
                                onClick={() => alternarActivo(producto)}
                              >
                                {producto.activo ? "Desactivar" : "Activar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section id="panel-cupones" role="tabpanel" aria-labelledby="tab-cupones">
            <h2>Gestión de cupones</h2>

            {cargandoCupones && <Cargando texto="Cargando cupones…" />}
            {errorCupones && <ErrorCarga mensaje={errorCupones} onReintentar={recargarCupones} />}

            <div className="row g-4">
              {/* Formulario */}
              <div className="col-12 col-lg-5">
                <div className="card">
                  <div className="card-body">
                    <h3 className="h5 mb-3">
                      {idCuponEnEdicion === null
                        ? "Nuevo cupón"
                        : `Editar cupón ${formCupon.codigo}`}
                    </h3>

                    <form onSubmit={enviarCupon} noValidate>
                      <div className="mb-3">
                        <label className="form-label" htmlFor="cup-codigo">Código *</label>
                        <input
                          className="form-control"
                          id="cup-codigo"
                          value={formCupon.codigo}
                          disabled={idCuponEnEdicion !== null}
                          onChange={(e) => cambiarCampoCupon("codigo", e.target.value)}
                        />
                      </div>

                      <div className="row">
                        <div className="col-6 mb-3">
                          <label className="form-label" htmlFor="cup-porcentaje">Descuento (%) *</label>
                          <input
                            className="form-control"
                            type="number"
                            min="1"
                            max="100"
                            id="cup-porcentaje"
                            value={formCupon.porcentaje}
                            onChange={(e) => cambiarCampoCupon("porcentaje", e.target.value)}
                          />
                        </div>
                        <div className="col-6 mb-3">
                          <label className="form-label" htmlFor="cup-tope">Tope máximo ($)</label>
                          <input
                            className="form-control"
                            type="number"
                            min="0"
                            id="cup-tope"
                            value={formCupon.topeMaximo}
                            onChange={(e) => cambiarCampoCupon("topeMaximo", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-6 mb-3">
                          <label className="form-label" htmlFor="cup-inicio">Vigente desde *</label>
                          <input
                            className="form-control"
                            type="date"
                            id="cup-inicio"
                            value={formCupon.inicio}
                            onChange={(e) => cambiarCampoCupon("inicio", e.target.value)}
                          />
                        </div>
                        <div className="col-6 mb-3">
                          <label className="form-label" htmlFor="cup-expira">Expira el *</label>
                          <input
                            className="form-control"
                            type="date"
                            id="cup-expira"
                            value={formCupon.expira}
                            onChange={(e) => cambiarCampoCupon("expira", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label" htmlFor="cup-usos">Usos máximos</label>
                        <input
                          className="form-control"
                          type="number"
                          min="1"
                          id="cup-usos"
                          value={formCupon.usosMaximos}
                          onChange={(e) => cambiarCampoCupon("usosMaximos", e.target.value)}
                        />
                      </div>

                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-primary" disabled={ocupado}>
                          {idCuponEnEdicion === null ? "Crear cupón" : "Guardar cambios"}
                        </button>
                        {idCuponEnEdicion !== null && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={cancelarEdicionCupon}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Tabla */}
              <div className="col-12 col-lg-7">
                <h3 className="h5 mb-2">Cupones ({(cupones ?? []).length})</h3>

                <div className="table-responsive">
                  <table className="table table-striped align-middle">
                    <caption className="visualmente-oculto">Listado de cupones</caption>
                    <thead>
                      <tr>
                        <th scope="col">Código</th>
                        <th scope="col">Descuento</th>
                        <th scope="col">Tope máximo</th>
                        <th scope="col">Expira</th>
                        <th scope="col">Usos</th>
                        <th scope="col">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(cupones ?? []).map((cupon) => (
                        <tr key={cupon.id}>
                          <td>
                            {cupon.codigo}
                            {!cupon.activa && (
                              <span className="badge text-bg-secondary ms-2">Inactivo</span>
                            )}
                          </td>
                          <td>{cupon.porcentaje}%</td>
                          <td>{formatearPrecio(cupon.topeMaximo)}</td>
                          <td>{cupon.expira ?? "—"}</td>
                          <td>
                            {cupon.usos} / {cupon.usosMaximos}
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                aria-label={`Editar cupón ${cupon.codigo}`}
                                onClick={() => editarCupon(cupon)}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                disabled={ocupado}
                                aria-label={`${cupon.activa ? "Desactivar" : "Activar"} cupón ${cupon.codigo}`}
                                onClick={() => alternarActivoCupon(cupon)}
                              >
                                {cupon.activa ? "Desactivar" : "Activar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
