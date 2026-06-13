
const cargarDatosYGraficar = (url, contenedorId, errorId, callbackOnData) => {
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((ajaxResponse) => {
      if (ajaxResponse.status !== "ok") {
        throw new Error(ajaxResponse.mensaje || "Error en la respuesta del servidor");
      }
      callbackOnData(ajaxResponse.data);
    })
    .catch((error) => {
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
      const errorEl = document.getElementById(errorId);
      if (errorEl) {
        errorEl.textContent = "No se pudieron cargar los datos del gráfico.";
        errorEl.hidden = false;
      }
    });
};

// --- Gráfico 1: miembros por día (líneas) ---
const renderMiembrosPorDia = (data) => {
  if (!data || data.length === 0) {
    document.getElementById("grafico-miembros-por-dia").textContent =
      "Aún no hay miembros registrados para graficar.";
    return;
  }
  // data: [{fecha: "YYYY-MM-DD", total: N}, ...]
  const categorias = data.map((d) => d.fecha);
  const valores = data.map((d) => d.total);

  Highcharts.chart("grafico-miembros-por-dia", {
    chart: { type: "line" },
    title: { text: "Miembros registrados por día" },
    xAxis: {
      categories: categorias,
      title: { text: "Día" },
    },
    yAxis: {
      title: { text: "Cantidad de miembros" },
      allowDecimals: false,
      min: 0,
    },
    series: [
      {
        name: "Miembros",
        data: valores,
      },
    ],
    credits: { enabled: false },
  });
};

// --- Gráfico 2: actividades por tipo (torta) ---
const renderActividadesPorTipo = (data) => {
  if (!data || data.length === 0) {
    document.getElementById("grafico-actividades-por-tipo").textContent =
      "Aún no hay actividades registradas para graficar.";
    return;
  }
  // data: [{tipo: "...", total: N}, ...]
  const serie = data.map((d) => ({ name: d.tipo, y: d.total }));

  Highcharts.chart("grafico-actividades-por-tipo", {
    chart: { type: "pie" },
    title: { text: "Actividades por tipo" },
    tooltip: { pointFormat: "<b>{point.y}</b> ({point.percentage:.1f}%)" },
    plotOptions: {
      pie: {
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b>: {point.y}",
        },
      },
    },
    series: [
      {
        name: "Actividades",
        data: serie,
      },
    ],
    credits: { enabled: false },
  });
};

// --- Gráfico 3: actividades por comuna (barras) ---
const renderActividadesPorComuna = (data) => {
  if (!data || data.length === 0) {
    document.getElementById("grafico-actividades-por-comuna").textContent =
      "Aún no hay actividades registradas para graficar.";
    return;
  }
  // data: [{comuna: "...", total: N}, ...]
  const categorias = data.map((d) => d.comuna);
  const valores = data.map((d) => d.total);

  Highcharts.chart("grafico-actividades-por-comuna", {
    chart: { type: "column" },
    title: { text: "Actividades por comuna" },
    xAxis: {
      categories: categorias,
      title: { text: "Comuna" },
    },
    yAxis: {
      title: { text: "Cantidad de actividades" },
      allowDecimals: false,
      min: 0,
    },
    series: [
      {
        name: "Actividades",
        data: valores,
      },
    ],
    legend: { enabled: false },
    credits: { enabled: false },
  });
};

// --- Disparar las 3 llamadas al cargar la página ---
document.addEventListener("DOMContentLoaded", () => {
  cargarDatosYGraficar(
    "/api/stats/miembros-por-dia",
    "grafico-miembros-por-dia",
    "error-miembros-por-dia",
    renderMiembrosPorDia
  );
  cargarDatosYGraficar(
    "/api/stats/actividades-por-tipo",
    "grafico-actividades-por-tipo",
    "error-actividades-por-tipo",
    renderActividadesPorTipo
  );
  cargarDatosYGraficar(
    "/api/stats/actividades-por-comuna",
    "grafico-actividades-por-comuna",
    "error-actividades-por-comuna",
    renderActividadesPorComuna
  );
});
