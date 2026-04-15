// === DATOS DE EJEMPLO (simulan miembros registrados) ===
const miembros = [
  { nombre: "María", apellido: "González", email: "maria.gonzalez@uchile.cl", telefono: "+56912345678", tipo: "pregrado" },
  { nombre: "Juan", apellido: "Pérez", email: "juan.perez@uchile.cl", telefono: "+56923456789", tipo: "pregrado" },
  { nombre: "Catalina", apellido: "Muñoz", email: "catalina.munoz@uchile.cl", telefono: "+56934567890", tipo: "pregrado" },
  { nombre: "Diego", apellido: "Rojas", email: "diego.rojas@uchile.cl", telefono: "+56945678901", tipo: "postgrado" },
  { nombre: "Valentina", apellido: "López", email: "valentina.lopez@uchile.cl", telefono: "+56956789012", tipo: "postgrado" },
  { nombre: "Andrés", apellido: "Silva", email: "andres.silva@uchile.cl", telefono: "+56967890123", tipo: "funcionario" },
  { nombre: "Patricia", apellido: "Fernández", email: "patricia.fernandez@uchile.cl", telefono: "+56978901234", tipo: "funcionario" },
  { nombre: "Roberto", apellido: "Martínez", email: "roberto.martinez@uchile.cl", telefono: "+56989012345", tipo: "academico" },
  { nombre: "Ana", apellido: "Torres", email: "ana.torres@uchile.cl", telefono: "+56990123456", tipo: "pregrado" },
  { nombre: "Felipe", apellido: "Vargas", email: "felipe.vargas@uchile.cl", telefono: "+56901234567", tipo: "pregrado" },
  { nombre: "Camila", apellido: "Soto", email: "camila.soto@uchile.cl", telefono: "+56911111111", tipo: "postgrado" },
  { nombre: "Tomás", apellido: "Ramírez", email: "tomas.ramirez@uchile.cl", telefono: "+56922222222", tipo: "academico" }
];

// === ESTADO ===
let paginaActual = 1;
let ordenColumna = "nombre";
let ordenAsc = true;

// === ELEMENTOS DEL DOM ===
const filtroTipo = document.getElementById("filtro-tipo");
const itemsPagina = document.getElementById("items-pagina");
const cuerpoTabla = document.getElementById("cuerpo-tabla");
const divPaginacion = document.getElementById("paginacion");
const msgSinDatos = document.getElementById("msg-sin-datos");

// === FUNCIONES ===

// Filtra los miembros según el tipo seleccionado
const filtrarMiembros = () => {
  const tipo = filtroTipo.value;
  if (tipo === "todos") {
    return miembros;
  }
  return miembros.filter((m) => m.tipo === tipo);
};

// Ordena un arreglo de miembros por la columna indicada
const ordenarMiembros = (lista) => {
  return lista.sort((a, b) => {
    const valA = a[ordenColumna].toLowerCase();
    const valB = b[ordenColumna].toLowerCase();
    if (valA < valB) return ordenAsc ? -1 : 1;
    if (valA > valB) return ordenAsc ? 1 : -1;
    return 0;
  });
};

// Renderiza la tabla con la página actual
const renderizar = () => {
  const filtrados = filtrarMiembros();
  const ordenados = ordenarMiembros(filtrados);

  const porPagina = parseInt(itemsPagina.value);
  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / porPagina));

  // Ajustar página actual si se excede
  if (paginaActual > totalPaginas) {
    paginaActual = totalPaginas;
  }

  const inicio = (paginaActual - 1) * porPagina;
  const paginados = ordenados.slice(inicio, inicio + porPagina);

  // Mostrar u ocultar mensaje de sin datos
  if (ordenados.length === 0) {
    msgSinDatos.style.display = "block";
  } else {
    msgSinDatos.style.display = "none";
  }

  // Limpiar tabla
  cuerpoTabla.innerHTML = "";

  // Agregar filas
  paginados.forEach((m) => {
    const fila = document.createElement("tr");

    const celdaNombre = document.createElement("td");
    celdaNombre.textContent = m.nombre;
    fila.appendChild(celdaNombre);

    const celdaApellido = document.createElement("td");
    celdaApellido.textContent = m.apellido;
    fila.appendChild(celdaApellido);

    const celdaEmail = document.createElement("td");
    celdaEmail.textContent = m.email;
    fila.appendChild(celdaEmail);

    const celdaTelefono = document.createElement("td");
    celdaTelefono.textContent = m.telefono;
    fila.appendChild(celdaTelefono);

    const celdaTipo = document.createElement("td");
    celdaTipo.textContent = m.tipo;
    fila.appendChild(celdaTipo);

    cuerpoTabla.appendChild(fila);
  });

  // Renderizar paginación
  renderizarPaginacion(totalPaginas);
};

// Crea los botones de paginación
const renderizarPaginacion = (totalPaginas) => {
  divPaginacion.innerHTML = "";

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === paginaActual) {
      btn.classList.add("pagina-activa");
    }
    btn.addEventListener("click", () => {
      paginaActual = i;
      renderizar();
    });
    divPaginacion.appendChild(btn);
  }
};

// === EVENTOS ===

// Cambiar filtro
filtroTipo.addEventListener("change", () => {
  paginaActual = 1;
  renderizar();
});

// Cambiar items por página
itemsPagina.addEventListener("change", () => {
  paginaActual = 1;
  renderizar();
});

// Ordenar al hacer clic en los encabezados
const columnas = ["nombre", "apellido", "email", "tipo"];
columnas.forEach((col) => {
  const th = document.getElementById("col-" + col);
  th.addEventListener("click", () => {
    if (ordenColumna === col) {
      ordenAsc = !ordenAsc;
    } else {
      ordenColumna = col;
      ordenAsc = true;
    }
    renderizar();
  });
});

// Renderizado inicial
renderizar();
