/**
 * Utilidad para exportar datos a CSV desde el cliente.
 */
export function exportToCSV<T extends Record<string, unknown>>(data: T[], filename: string) {
  if (data.length === 0) return;

  // 1. Extraer cabeceras
  const headers = Object.keys(data[0]).join(",");

  // 2. Mapear filas
  const rows = data.map(obj => {
    return Object.values(obj).map(val => {
      // Escapar comas y envolver en comillas si es string
      if (typeof val === "string") {
        return `"${val.replace(/"/g, '""')}"`;
      }
      if (typeof val === "object" && val !== null) {
        return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      }
      return val;
    }).join(",");
  });

  // 3. Unir todo
  const csvContent = [headers, ...rows].join("\n");

  // 4. Crear blob y descargar
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
