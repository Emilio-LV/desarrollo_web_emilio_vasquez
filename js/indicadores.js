// === DATOS DE EJEMPLO ===

// Distribución de miembros por tipo
const datosMiembros = [
  { etiqueta: "Pregrado", valor: 45, color: "#3498db" },
  { etiqueta: "Postgrado", valor: 20, color: "#2ecc71" },
  { etiqueta: "Funcionarios", valor: 15, color: "#e74c3c" },
  { etiqueta: "Académicos", valor: 10, color: "#f39c12" }
];

// Ranking de actividades por categoría (ordenado de mayor a menor)
const datosRanking = [
  { etiqueta: "Deportiva", valor: 38, color: "#2ecc71" },
  { etiqueta: "Recreativa", valor: 30, color: "#9b59b6" },
  { etiqueta: "Artística", valor: 25, color: "#e74c3c" },
  { etiqueta: "Tecnológica", valor: 22, color: "#3498db" },
  { etiqueta: "Social", valor: 15, color: "#f39c12" }
];

// Mapa de calor: actividades por día y franja horaria
// Filas = días, Columnas = franjas horarias
const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const franjasHorarias = ["8-10", "10-12", "12-14", "14-16", "16-18", "18-20", "20-22"];

// Matriz de valores [día][franja] - simulan cantidad de actividades
const datosHeatmap = [
  [1, 2, 3, 2, 5, 8, 4],   // Lunes
  [2, 3, 2, 4, 6, 7, 3],   // Martes
  [1, 1, 4, 3, 4, 9, 5],   // Miércoles
  [0, 2, 3, 2, 5, 6, 3],   // Jueves
  [2, 3, 2, 5, 7, 10, 6],  // Viernes
  [5, 6, 4, 8, 9, 12, 7],  // Sábado
  [3, 4, 2, 3, 4, 5, 2]    // Domingo
];

// Tarjetas resumen
const tarjetas = [
  { titulo: "Miembros registrados", valor: 90, icono: "👥" },
  { titulo: "Actividades informadas", valor: 130, icono: "📋" },
  { titulo: "Horas semanales", valor: 285, icono: "⏱" },
  { titulo: "Categorías activas", valor: 5, icono: "📊" }
];

// === TARJETAS RESUMEN ===

const crearTarjetas = () => {
  const contenedor = document.getElementById("tarjetas-resumen");

  tarjetas.forEach((t) => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta";

    const icono = document.createElement("span");
    icono.className = "tarjeta-icono";
    icono.textContent = t.icono;

    const valor = document.createElement("span");
    valor.className = "tarjeta-valor";
    valor.textContent = t.valor;

    const titulo = document.createElement("span");
    titulo.className = "tarjeta-titulo";
    titulo.textContent = t.titulo;

    tarjeta.appendChild(icono);
    tarjeta.appendChild(valor);
    tarjeta.appendChild(titulo);
    contenedor.appendChild(tarjeta);
  });
};

// === GRAFICO TORTA (CSS conic-gradient) ===

const crearTorta = (idTorta, idLeyenda, datos) => {
  const torta = document.getElementById(idTorta);
  const leyenda = document.getElementById(idLeyenda);

  const total = datos.reduce((sum, d) => sum + d.valor, 0);

  // Construir conic-gradient segmento por segmento
  let gradiente = "";
  let acumulado = 0;

  datos.forEach((dato, i) => {
    const porcentaje = (dato.valor / total) * 100;
    const inicio = acumulado;
    acumulado += porcentaje;

    if (i > 0) {
      gradiente += ", ";
    }
    gradiente += dato.color + " " + inicio + "% " + acumulado + "%";
  });

  torta.style.background = "conic-gradient(" + gradiente + ")";

  // Leyenda
  datos.forEach((dato) => {
    const porcentaje = ((dato.valor / total) * 100).toFixed(1);

    const item = document.createElement("div");
    item.className = "leyenda-item";

    const cuadro = document.createElement("span");
    cuadro.className = "leyenda-color";
    cuadro.style.backgroundColor = dato.color;

    const texto = document.createElement("span");
    texto.textContent = dato.etiqueta + " — " + dato.valor + " (" + porcentaje + "%)";

    item.appendChild(cuadro);
    item.appendChild(texto);
    leyenda.appendChild(item);
  });
};

// === GRAFICO DE BARRAS HORIZONTAL (ranking) ===

const crearBarrasHorizontales = (idContenedor, datos) => {
  const contenedor = document.getElementById(idContenedor);
  const maxValor = Math.max(...datos.map((d) => d.valor));

  datos.forEach((dato) => {
    const fila = document.createElement("div");
    fila.className = "barra-h-fila";

    const etiqueta = document.createElement("span");
    etiqueta.className = "barra-h-etiqueta";
    etiqueta.textContent = dato.etiqueta;

    const barraContenedor = document.createElement("div");
    barraContenedor.className = "barra-h-contenedor";

    const barra = document.createElement("div");
    barra.className = "barra-h";
    barra.style.width = ((dato.valor / maxValor) * 100) + "%";
    barra.style.backgroundColor = dato.color;

    const numero = document.createElement("span");
    numero.className = "barra-h-valor";
    numero.textContent = dato.valor;

    barraContenedor.appendChild(barra);
    barraContenedor.appendChild(numero);

    fila.appendChild(etiqueta);
    fila.appendChild(barraContenedor);
    contenedor.appendChild(fila);
  });
};

// === MAPA DE CALOR ===

const crearHeatmap = () => {
  const contenedor = document.getElementById("heatmap");

  // Encontrar el valor máximo para calcular la intensidad
  let maxValor = 0;
  datosHeatmap.forEach((fila) => {
    fila.forEach((v) => {
      if (v > maxValor) {
        maxValor = v;
      }
    });
  });

  // Color base para el heatmap
  const colorBase = { r: 52, g: 152, b: 219 }; // #3498db

  // Función para obtener color según intensidad
  const obtenerColor = (valor) => {
    if (valor === 0) {
      return "#f0f0f0";
    }
    const intensidad = valor / maxValor;
    const r = Math.round(255 - (255 - colorBase.r) * intensidad);
    const g = Math.round(255 - (255 - colorBase.g) * intensidad);
    const b = Math.round(255 - (255 - colorBase.b) * intensidad);
    return "rgb(" + r + "," + g + "," + b + ")";
  };

  // Crear fila de encabezados (franjas horarias)
  const filaHeader = document.createElement("div");
  filaHeader.className = "heatmap-fila";

  // Celda vacía en la esquina
  const celdaVacia = document.createElement("div");
  celdaVacia.className = "heatmap-dia";
  celdaVacia.textContent = "";
  filaHeader.appendChild(celdaVacia);

  franjasHorarias.forEach((franja) => {
    const celda = document.createElement("div");
    celda.className = "heatmap-header";
    celda.textContent = franja;
    filaHeader.appendChild(celda);
  });
  contenedor.appendChild(filaHeader);

  // Crear filas de datos (una por día)
  diasSemana.forEach((dia, i) => {
    const fila = document.createElement("div");
    fila.className = "heatmap-fila";

    // Etiqueta del día
    const etiquetaDia = document.createElement("div");
    etiquetaDia.className = "heatmap-dia";
    etiquetaDia.textContent = dia;
    fila.appendChild(etiquetaDia);

    // Celdas de valores
    datosHeatmap[i].forEach((valor, j) => {
      const celda = document.createElement("div");
      celda.className = "heatmap-celda";
      celda.style.backgroundColor = obtenerColor(valor);
      celda.title = dia + " " + franjasHorarias[j] + ": " + valor + " actividades";
      celda.textContent = valor;

      // Texto oscuro o claro según intensidad
      if (valor / maxValor > 0.5) {
        celda.style.color = "white";
      } else {
        celda.style.color = "#2c3e50";
      }

      fila.appendChild(celda);
    });

    contenedor.appendChild(fila);
  });

  // Crear escala de color
  const escala = document.getElementById("heatmap-escala");
  for (let i = 0; i <= 5; i++) {
    const bloque = document.createElement("div");
    bloque.className = "heatmap-escala-bloque";
    bloque.style.backgroundColor = obtenerColor((i / 5) * maxValor);
    escala.appendChild(bloque);
  }
};

// === GENERAR TODO ===

crearTarjetas();
crearTorta("torta-miembros", "leyenda-miembros", datosMiembros);
crearBarrasHorizontales("grafico-ranking", datosRanking);
crearHeatmap();
