// Comentarios de actividades: se cargan y se agregan con fetch, sin recargar la página.
const limpiarErrores = (idx) => {
  for (const campo of ["nombre", "texto"]) {
    const el = document.getElementById(`error-${campo}-${idx}`);
    if (el) {
      el.textContent = "";
      el.hidden = true;
    }
  }
  const exito = document.getElementById(`exito-${idx}`);
  if (exito) {
    exito.textContent = "";
    exito.hidden = true;
  }
};

const mostrarErrores = (idx, errores) => {
  for (const campo of Object.keys(errores)) {
    const el = document.getElementById(`error-${campo}-${idx}`);
    if (el) {
      el.textContent = errores[campo];
      el.hidden = false;
    }
  }
};

const formatearMeta = (comentario) => `${comentario.fecha} — `;

const construirItemComentario = (comentario) => {
  // textContent en vez de innerHTML para evitar XSS
  const li = document.createElement("li");
  li.className = "comentario";

  const meta = document.createElement("div");
  meta.className = "comentario-meta";
  meta.appendChild(document.createTextNode(formatearMeta(comentario)));

  const autor = document.createElement("span");
  autor.className = "comentario-autor";
  autor.textContent = comentario.nombre;
  meta.appendChild(autor);

  const texto = document.createElement("p");
  texto.className = "comentario-texto";
  texto.textContent = comentario.texto;

  li.appendChild(meta);
  li.appendChild(texto);
  return li;
};

const actualizarVacioFlag = (idx) => {
  const lista = document.getElementById(`comentarios-lista-${idx}`);
  const vacio = document.getElementById(`comentarios-vacio-${idx}`);
  if (!lista || !vacio) return;
  vacio.hidden = lista.children.length > 0;
};

// Pide al servidor los comentarios de un bloque de actividad y los pinta
const cargarComentariosDe = (article, idx) => {
  const ids = article.dataset.actividadIds;
  if (!ids) return;

  fetch(`/api/comentarios?actividad_ids=${encodeURIComponent(ids)}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((ajaxResponse) => {
      if (ajaxResponse.status !== "ok") {
        throw new Error("Respuesta no OK del servidor");
      }
      const lista = document.getElementById(`comentarios-lista-${idx}`);
      if (!lista) return;
      while (lista.firstChild) {
        lista.removeChild(lista.firstChild);
      }
      for (const c of ajaxResponse.data) {
        lista.appendChild(construirItemComentario(c));
      }
      actualizarVacioFlag(idx);
    })
    .catch((error) => {
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    });
};

// Mismas reglas que la validación del servidor
const validarComentarioCliente = (nombre, texto) => {
  const errores = {};
  const nombreClean = (nombre || "").trim();
  if (nombreClean.length < 3 || nombreClean.length > 80) {
    errores.nombre = "El nombre debe tener entre 3 y 80 caracteres.";
  }
  const textoClean = (texto || "").trim();
  if (textoClean.length < 5) {
    errores.texto = "El comentario debe tener al menos 5 caracteres.";
  } else if (textoClean.length > 300) {
    errores.texto = "El comentario no debe superar los 300 caracteres.";
  }
  return errores;
};

// Maneja el submit del formulario: valida y hace POST con fetch
const conectarFormulario = (form, idx) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    limpiarErrores(idx);

    const nombreEl = document.getElementById(`nombre-${idx}`);
    const textoEl = document.getElementById(`texto-${idx}`);
    const nombre = nombreEl ? nombreEl.value : "";
    const texto = textoEl ? textoEl.value : "";

    const erroresCliente = validarComentarioCliente(nombre, texto);
    if (Object.keys(erroresCliente).length > 0) {
      mostrarErrores(idx, erroresCliente);
      return;
    }

    const fd = new FormData(form);

    fetch("/api/comentarios", {
      method: "POST",
      body: fd,
    })
      .then((response) => {
        // el 400 de validación también trae JSON
        return response.json().then((body) => ({ ok: response.ok, body }));
      })
      .then(({ ok, body }) => {
        if (!ok || body.status !== "ok") {
          if (body && body.errores) {
            mostrarErrores(idx, body.errores);
          } else {
            mostrarErrores(idx, {
              texto: "No se pudo guardar el comentario. Intenta de nuevo.",
            });
          }
          return;
        }

        const lista = document.getElementById(`comentarios-lista-${idx}`);
        if (lista && body.data) {
          lista.appendChild(construirItemComentario(body.data));
          actualizarVacioFlag(idx);
        }
        form.reset();
        const exito = document.getElementById(`exito-${idx}`);
        if (exito) {
          exito.textContent = "Comentario agregado.";
          exito.hidden = false;
        }
      })
      .catch((error) => {
        console.error(
          "There has been a problem with your fetch operation:",
          error
        );
        mostrarErrores(idx, {
          texto: "Error de red. Intenta de nuevo.",
        });
      });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  const articles = document.querySelectorAll(".actividad-bloque");
  articles.forEach((article, idx) => {
    cargarComentariosDe(article, idx);
    const form = document.getElementById(`comentario-form-${idx}`);
    if (form) {
      conectarFormulario(form, idx);
    }
  });
});
