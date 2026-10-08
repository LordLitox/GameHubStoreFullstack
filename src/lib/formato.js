/**
 * Utilidades de formato compartidas por toda la app.
 */
export function formatearPesosCLP(monto) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(monto);
}
