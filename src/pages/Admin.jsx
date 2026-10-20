import { useState } from "react";
import { useTitulo } from "../hooks/useTitulo.js";
import {
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  restablecerProductos,
  CATEGORIAS,
} from "../data/productos.js";
import {
  listarCupones,
  crearCupon,
  actualizarCupon,
  eliminarCupon,
  restablecerCupones,
} from "../data/cupones.js";

// Formulario vacío para reutilizarlo como estado inicial (crear) y como
// valor de reinicio tras una operación exitosa.
const FORM_PRODUCTO_VACIO = {
  nombre: "",
  marca: "",
  categoria: CATEGORIAS[0],
  precio: "",
  stockDisponible: "",
  destacado: false,
  imagen: "",
  descripcion: "",
};

const FORM_CUPON_VACIO = {
  codigo: "",
  porcentaje: "",
  topeMaximo: "",
  expira: "",
};

function formatearPrecio(valor) {
  return `$${Number(valor).toLocaleString("es-CL")}`;
}

/**
 * Panel de administración (EP2): interfaz que consume las operaciones CRUD
 * de src/data/productos.js y src/data/cupones.js. Como la EP2 no tiene
 * backend, las colecciones viven en memoria durante la sesión; por eso un
 * contador `version` fuerza el re-render después de cada escritura.
 */
export default function Admin() {
  useTitulo("Administración — GameHub Store");

  const [vista, setVista] = useState("productos");
  const [, setVersion] = useState(0);
  const [mensaje, setMensaje] = useState(null); // { tipo: "exito" | "error", texto }

  const [formProducto, setFormProducto] = useState(FORM_PRODUCTO_VACIO);
  const [idEnEdicion, setIdEnEdicion] = useState(null);

  const [formCupon, setFormCupon] = useState(FORM_CUPON_VACIO);
  const [codigoEnEdicion, setCodigoEnEdicion] = useState(null);

  // Se recalculan en cada render; `setVersion` fuerza el re-render tras un CRUD.
  const productos = listarProductos();
  const cupones = listarCupones();

  function avisar(resultado) {
    setMensaje({ tipo: resultado.exito ? "exito" : "error", texto: resultado.mensaje });
  }

  // ------------------------------- Productos -------------------------------

  function cambiarCampoProducto(campo, valor) {
    setFormProducto((previo) => ({ ...previo, [campo]: valor }));
  }

  function enviarProducto(evento) {
    evento.preventDefault();

    const datos = {
      nombre: formProducto.nombre,
      marca: formProducto.marca,
      categoria: formProducto.categoria,
      // Un precio vacío debe fallar la validación, no convertirse en 0.
      precio: formProducto.precio === "" ? NaN : Number(formProducto.precio),
      stockDisponible:
        formProducto.stockDisponible === "" ? 0 : Number(formProducto.stockDisponible),
      destacado: Boolean(formProducto.destacado),
      imagen: formProducto.imagen,
      descripcion: formProducto.descripcion,
    };

    const resultado =
      idEnEdicion === null
        ? crearProducto(datos)
        : actualizarProducto(idEnEdicion, datos);

    avisar(resultado);

    if (resultado.exito) {
      setFormProducto(FORM_PRODUCTO_VACIO);
      setIdEnEdicion(null);
      setVersion((v) => v + 1);
    }
  }

  function editarProducto(producto) {
    setIdEnEdicion(producto.id);
    setFormProducto({
      nombre: producto.nombre,
      marca: producto.marca,
      categoria: producto.categoria,
      precio: String(producto.precio),
      stockDisponible: String(producto.stockDisponible),
      destacado: Boolean(producto.destacado),
      imagen: producto.imagen,
      descripcion: producto.descripcion,
    });
    setMensaje(null);
  }

  function cancelarEdicionProducto() {
    setIdEnEdicion(null);
    setFormProducto(FORM_PRODUCTO_VACIO);
    setMensaje(null);
  }

  function borrarProducto(producto) {
    if (!window.confirm(`¿Eliminar el producto "${producto.nombre}"?`)) return;
    const resultado = eliminarProducto(producto.id);
    avisar(resultado);
    if (idEnEdicion === producto.id) cancelarEdicionProducto();
    setVersion((v) => v + 1);
  }

  function reiniciarProductos() {
    if (!window.confirm("¿Restablecer la lista de productos a su estado inicial?")) return;
    restablecerProductos();
    cancelarEdicionProducto();
    setMensaje({ tipo: "exito", texto: "Productos restablecidos al estado inicial." });
    setVersion((v) => v + 1);
  }

  // -------------------------------- Cupones --------------------------------

  function cambiarCampoCupon(campo, valor) {
    setFormCupon((previo) => ({ ...previo, [campo]: valor }));
  }

  function enviarCupon(evento) {
    evento.preventDefault();

    const datos = {
      codigo: formCupon.codigo,
      porcentaje: formCupon.porcentaje === "" ? NaN : Number(formCupon.porcentaje),
      topeMaximo: formCupon.topeMaximo === "" ? 0 : Number(formCupon.topeMaximo),
      expira: formCupon.expira,
    };

    const resultado =
      codigoEnEdicion === null
        ? crearCupon(datos)
        : actualizarCupon(codigoEnEdicion, datos);

    avisar(resultado);

    if (resultado.exito) {
      setFormCupon(FORM_CUPON_VACIO);
      setCodigoEnEdicion(null);
      setVersion((v) => v + 1);
    }
  }

  function editarCupon(cupon) {
    setCodigoEnEdicion(cupon.codigo);
    setFormCupon({
      codigo: cupon.codigo,
      porcentaje: String(cupon.porcentaje),
      topeMaximo: String(cupon.topeMaximo),
      expira: cupon.expira,
    });
    setMensaje(null);
  }

  function cancelarEdicionCupon() {
    setCodigoEnEdicion(null);
    setFormCupon(FORM_CUPON_VACIO);
    setMensaje(null);
  }

  function borrarCupon(cupon) {
    if (!window.confirm(`¿Eliminar el cupón "${cupon.codigo}"?`)) return;
    const resultado = eliminarCupon(cupon.codigo);
    avisar(resultado);
    if (codigoEnEdicion === cupon.codigo) cancelarEdicionCupon();
    setVersion((v) => v + 1);
  }

  function reiniciarCupones() {
    if (!window.confirm("¿Restablecer la lista de cupones a su estado inicial?")) return;
    restablecerCupones();
    cancelarEdicionCupon();
    setMensaje({ tipo: "exito", texto: "Cupones restablecidos al estado inicial." });
    setVersion((v) => v + 1);
  }

  return (
    <div className="seccion">
      <div className="container">
        <h1>Administración</h1>
        <p>
          Gestiona el catálogo de productos y los cupones de descuento. Los
          cambios se aplican en memoria durante esta sesión (EP2 sin backend).
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
                          value={formProducto.categoria}
                          onChange={(e) => cambiarCampoProducto("categoria", e.target.value)}
                        >
                          {CATEGORIAS.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
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
                          <label className="form-label" htmlFor="prod-stock">Stock *</label>
                          <input
                            className="form-control"
                            type="number"
                            min="0"
                            id="prod-stock"
                            value={formProducto.stockDisponible}
                            onChange={(e) => cambiarCampoProducto("stockDisponible", e.target.value)}
                          />
                        </div>
                      </div>

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

                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="prod-destacado"
                          checked={formProducto.destacado}
                          onChange={(e) => cambiarCampoProducto("destacado", e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="prod-destacado">
                          Producto destacado
                        </label>
                      </div>

                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-primary">
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
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h3 className="h5 mb-0">Catálogo ({productos.length})</h3>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={reiniciarProductos}
                  >
                    Restablecer datos
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-striped align-middle">
                    <caption className="visualmente-oculto">Listado de productos</caption>
                    <thead>
                      <tr>
                        <th scope="col">ID</th>
                        <th scope="col">Nombre</th>
                        <th scope="col">Categoría</th>
                        <th scope="col">Precio</th>
                        <th scope="col">Stock</th>
                        <th scope="col">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.map((producto) => (
                        <tr key={producto.id}>
                          <td>{producto.id}</td>
                          <td>
                            {producto.nombre}
                            {producto.destacado && (
                              <span className="badge text-bg-warning ms-2">Destacado</span>
                            )}
                          </td>
                          <td>{producto.categoria}</td>
                          <td>{formatearPrecio(producto.precio)}</td>
                          <td>{producto.stockDisponible}</td>
                          <td>
                            <div className="d-flex gap-1">
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
                                className="btn btn-sm btn-outline-danger"
                                aria-label={`Eliminar ${producto.nombre}`}
                                onClick={() => borrarProducto(producto)}
                              >
                                Eliminar
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

            <div className="row g-4">
              {/* Formulario */}
              <div className="col-12 col-lg-5">
                <div className="card">
                  <div className="card-body">
                    <h3 className="h5 mb-3">
                      {codigoEnEdicion === null ? "Nuevo cupón" : `Editar cupón ${codigoEnEdicion}`}
                    </h3>

                    <form onSubmit={enviarCupon} noValidate>
                      <div className="mb-3">
                        <label className="form-label" htmlFor="cup-codigo">Código *</label>
                        <input
                          className="form-control"
                          id="cup-codigo"
                          value={formCupon.codigo}
                          disabled={codigoEnEdicion !== null}
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

                      <div className="mb-3">
                        <label className="form-label" htmlFor="cup-expira">Expira el *</label>
                        <input
                          className="form-control"
                          type="date"
                          id="cup-expira"
                          value={formCupon.expira}
                          onChange={(e) => cambiarCampoCupon("expira", e.target.value)}
                        />
                      </div>

                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-primary">
                          {codigoEnEdicion === null ? "Crear cupón" : "Guardar cambios"}
                        </button>
                        {codigoEnEdicion !== null && (
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
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h3 className="h5 mb-0">Cupones ({cupones.length})</h3>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={reiniciarCupones}
                  >
                    Restablecer datos
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-striped align-middle">
                    <caption className="visualmente-oculto">Listado de cupones</caption>
                    <thead>
                      <tr>
                        <th scope="col">Código</th>
                        <th scope="col">Descuento</th>
                        <th scope="col">Tope máximo</th>
                        <th scope="col">Expira</th>
                        <th scope="col">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cupones.map((cupon) => (
                        <tr key={cupon.codigo}>
                          <td>{cupon.codigo}</td>
                          <td>{cupon.porcentaje}%</td>
                          <td>{formatearPrecio(cupon.topeMaximo)}</td>
                          <td>{cupon.expira}</td>
                          <td>
                            <div className="d-flex gap-1">
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
                                className="btn btn-sm btn-outline-danger"
                                aria-label={`Eliminar cupón ${cupon.codigo}`}
                                onClick={() => borrarCupon(cupon)}
                              >
                                Eliminar
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
