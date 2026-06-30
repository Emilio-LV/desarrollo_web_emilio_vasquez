const inputBuscar = document.getElementById("q");
const formBuscar = document.getElementById("form-buscar");
const estado = document.getElementById("estado");
const resultados = document.getElementById("resultados");

let temporizador = null;

inputBuscar.addEventListener("input", () => {
  const q = inputBuscar.value.trim();
  clearTimeout(temporizador);

  if (q.length < 3) {
    resultados.replaceChildren();
    estado.textContent = q.length === 0 ? "" : "Escribe al menos 3 caracteres para buscar.";
    return;
  }

  estado.textContent = "Buscando…";
  temporizador = setTimeout(() => buscar(q), 200);
});

formBuscar.addEventListener("submit", (evento) => evento.preventDefault());

function buscar(q) {
  fetch(`/api/buscar?q=${encodeURIComponent(q)}`)
    .then((respuesta) => {
      if (!respuesta.ok) {
        throw new Error("Respuesta de red no OK");
      }
      return respuesta.json();
    })
    .then((cuerpo) => mostrarResultados(cuerpo.data, q))
    .catch(() => {
      estado.textContent = "Ocurrió un error al buscar. Intenta nuevamente.";
    });
}

function mostrarResultados(lista, q) {
  resultados.replaceChildren();

  if (!lista || lista.length === 0) {
    estado.textContent = `No se encontraron actividades para “${q}”.`;
    return;
  }

  estado.textContent =
    `${lista.length} resultado${lista.length === 1 ? "" : "s"} para “${q}”.`;

  const tabla = document.createElement("table");

  const caption = document.createElement("caption");
  caption.textContent = "Actividades encontradas";
  tabla.appendChild(caption);

  const thead = document.createElement("thead");
  const filaCabecera = document.createElement("tr");
  ["Miembro", "Día", "Tipo", "Comuna", "Nombre", "Descripción", "Nota", "Evaluar"]
    .forEach((titulo) => {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = titulo;
      filaCabecera.appendChild(th);
    });
  thead.appendChild(filaCabecera);
  tabla.appendChild(thead);

  const tbody = document.createElement("tbody");
  lista.forEach((fila) => tbody.appendChild(filaResultado(fila, q)));
  tabla.appendChild(tbody);

  resultados.appendChild(tabla);
}

function filaResultado(fila, q) {
  const tr = document.createElement("tr");

  tr.appendChild(celdaTexto(fila.miembro));
  tr.appendChild(celdaTexto(formatearDias(fila.dia)));
  tr.appendChild(celdaTexto(fila.tipo));
  tr.appendChild(celdaResaltada(fila.comuna, q));
  tr.appendChild(celdaResaltada(fila.nombre, q));
  tr.appendChild(celdaResaltada(fila.descripcion, q));

  const tdNota = document.createElement("td");
  const valorNota = document.createElement("span");
  valorNota.className = "valor-nota";
  valorNota.textContent = formatearNota(fila.nota);
  const contador = document.createElement("span");
  contador.className = "contador-notas";
  contador.textContent = formatearContador(fila.num_notas);
  tdNota.appendChild(valorNota);
  tdNota.appendChild(contador);
  tr.appendChild(tdNota);

  const tdEvaluar = document.createElement("td");
  tdEvaluar.appendChild(controlEvaluar(fila.actividad_id, valorNota, contador));
  tr.appendChild(tdEvaluar);

  return tr;
}

function celdaTexto(texto) {
  const td = document.createElement("td");
  td.textContent = texto == null ? "" : texto;
  return td;
}

function celdaResaltada(texto, q) {
  const td = document.createElement("td");
  td.appendChild(resaltar(texto, q));
  return td;
}

// Resalta el patrón con <mark>, usando textContent (sin innerHTML).
function resaltar(texto, patron) {
  const fragmento = document.createDocumentFragment();
  const valor = texto == null ? "" : String(texto);

  if (patron.length === 0) {
    fragmento.appendChild(document.createTextNode(valor));
    return fragmento;
  }

  const minuscula = valor.toLowerCase();
  const objetivo = patron.toLowerCase();
  let desde = 0;
  let pos = minuscula.indexOf(objetivo);

  while (pos !== -1) {
    if (pos > desde) {
      fragmento.appendChild(document.createTextNode(valor.slice(desde, pos)));
    }
    const marca = document.createElement("mark");
    marca.textContent = valor.slice(pos, pos + patron.length);
    fragmento.appendChild(marca);
    desde = pos + patron.length;
    pos = minuscula.indexOf(objetivo, desde);
  }

  if (desde < valor.length) {
    fragmento.appendChild(document.createTextNode(valor.slice(desde)));
  }
  return fragmento;
}

// El selector aparece al pulsar "Evaluar"; al elegir la nota se envía.
function controlEvaluar(actividadId, valorNota, contador) {
  const contenedor = document.createElement("span");
  contenedor.className = "evaluar-control";
  contenedor.appendChild(crearBotonEvaluar(contenedor, actividadId, valorNota, contador));
  return contenedor;
}

function crearBotonEvaluar(contenedor, actividadId, valorNota, contador) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "btn-evaluar";
  boton.textContent = "Evaluar";
  boton.addEventListener("click", () => {
    boton.remove();
    mostrarSelectorNota(contenedor, actividadId, valorNota, contador);
  });
  return boton;
}

function mostrarSelectorNota(contenedor, actividadId, valorNota, contador) {
  const etiqueta = document.createElement("label");
  etiqueta.className = "selector-nota";
  etiqueta.appendChild(document.createTextNode("Nota "));

  const selector = document.createElement("select");
  const inicial = document.createElement("option");
  inicial.value = "";
  inicial.textContent = "–";
  selector.appendChild(inicial);
  for (let n = 1; n <= 7; n++) {
    const opcion = document.createElement("option");
    opcion.value = String(n);
    opcion.textContent = String(n);
    selector.appendChild(opcion);
  }
  etiqueta.appendChild(selector);

  selector.addEventListener("change", () => {
    if (selector.value === "") {
      return;
    }
    selector.disabled = true;
    enviarNota(actividadId, selector.value, valorNota, contador, contenedor, etiqueta, selector);
  });

  contenedor.appendChild(etiqueta);
  selector.focus();
}

function enviarNota(actividadId, valor, valorNota, contador, contenedor, etiqueta, selector) {
  const datos = new URLSearchParams();
  datos.append("nota", valor);

  fetch(`/api/actividades/${actividadId}/nota`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: datos.toString(),
  })
    .then((respuesta) => respuesta.json().then((cuerpo) => ({ ok: respuesta.ok, cuerpo })))
    .then(({ ok, cuerpo }) => {
      if (!ok) {
        estado.textContent = cuerpo.error || "No se pudo guardar la nota.";
        selector.disabled = false;
        selector.value = "";
        return;
      }
      valorNota.textContent = formatearNota(cuerpo.nota);
      contador.textContent = formatearContador(cuerpo.num_notas);
      etiqueta.remove();
      contenedor.appendChild(crearBotonEvaluar(contenedor, actividadId, valorNota, contador));
      estado.textContent = "Nota agregada correctamente.";
    })
    .catch(() => {
      estado.textContent = "Ocurrió un error al guardar la nota.";
      selector.disabled = false;
      selector.value = "";
    });
}

function formatearNota(nota) {
  return nota == null ? "-" : Number(nota).toFixed(1);
}

function formatearContador(num) {
  return num > 0 ? ` (${num})` : "";
}

function formatearDias(dia) {
  return dia == null ? "" : String(dia).split(",").join(", ");
}
