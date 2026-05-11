// Validación cliente y comportamientos del formulario de Registro
// (N actividades por miembro, hasta MAX_ACTIVIDADES).


// --- Validadores básicos ---

const validarTexto = (valor, min, max) => {
  const regex = /^[\p{L}\s'\-]+$/u;
  return valor.length >= min && valor.length <= max && regex.test(valor);
};

const validarLargoOpcional = (valor, max) => valor.length <= max;

const validarLargo = (valor, min, max) => {
  const largo = valor.trim().length;
  return largo >= min && largo <= max;
};

const validarEmail = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

const validarTelefono = (valor) => /^\+569\d{8}$/.test(valor);

const validarAnio = (valor) => {
  const num = parseInt(valor);
  const anioActual = new Date().getFullYear();
  return !isNaN(num) && num >= 1940 && num <= anioActual;
};

const validarURL = (valor) => /^https?:\/\/.+\..+/.test(valor.trim());

const TAMANO_MAXIMO = 50 * 1024 * 1024; // 50 MB

const validarArchivo = (inputArchivo) => {
  if (inputArchivo.files.length === 0) {
    return { valido: false, mensaje: "Debe adjuntar al menos un archivo de imagen o video." };
  }
  for (let i = 0; i < inputArchivo.files.length; i++) {
    const file = inputArchivo.files[i];
    const esImagen = file.type.startsWith("image/");
    const esVideo = file.type.startsWith("video/");
    if (!esImagen && !esVideo) {
      return { valido: false, mensaje: 'El archivo "' + file.name + '" no es imagen ni video.' };
    }
    if (file.size > TAMANO_MAXIMO) {
      return { valido: false, mensaje: 'El archivo "' + file.name + '" supera los 50 MB.' };
    }
  }
  return { valido: true, mensaje: "" };
};


// Marca un campo con error visual. Devuelve true si NO hay error.
const marcarError = (idCampo, tieneError) => {
  const campo = document.getElementById(idCampo);
  if (!campo) return true;
  campo.classList.toggle("campo-error", tieneError);
  return !tieneError;
};


// --- Referencias DOM ---

const form = document.getElementById("form-registro");
const selectTipo = document.getElementById("tipo");
const contenedorActividades = document.getElementById("actividades-contenedor");
const btnAgregarActividad = document.getElementById("btn-agregar-actividad");
const MAX_ACTIVIDADES = window.MAX_ACTIVIDADES || 10;


// --- Toggle de campos condicionales según el tipo de miembro ---

const mostrarCamposTipo = (tipo) => {
  document.querySelectorAll(".campos-tipo").forEach((s) => s.classList.remove("visible"));
  if (tipo) {
    const seccion = document.getElementById("campos-" + tipo);
    if (seccion) seccion.classList.add("visible");
  }
};

selectTipo.addEventListener("change", () => mostrarCamposTipo(selectTipo.value));


// --- Horarios dinámicos por día ---

const crearBloqueHorario = (i, dia, nombreDia) => {
  const bloque = document.createElement("div");
  bloque.id = "horario-" + dia + "-" + i;
  bloque.className = "horario-dia";
  bloque.innerHTML =
    '<h3 class="horario-dia-titulo">' + nombreDia + '</h3>' +
    '<div class="horario-dia-campos">' +
      '<div class="campo" id="campo-inicio-' + dia + '-' + i + '">' +
        '<label for="inicio-' + dia + '-' + i + '">Hora de inicio <span class="obligatorio">*</span></label>' +
        '<input type="time" id="inicio-' + dia + '-' + i + '" name="inicio_' + dia + '_' + i + '">' +
        '<span class="msg-error">Ingrese una hora de inicio.</span>' +
      '</div>' +
      '<div class="campo" id="campo-fin-' + dia + '-' + i + '">' +
        '<label for="fin-' + dia + '-' + i + '">Hora de término <span class="obligatorio">*</span></label>' +
        '<input type="time" id="fin-' + dia + '-' + i + '" name="fin_' + dia + '_' + i + '">' +
        '<span class="msg-error">La hora de término debe ser posterior a la de inicio.</span>' +
      '</div>' +
    '</div>';
  return bloque;
};

// Event delegation: detecta cambios en cualquier checkbox de día,
// incluso en bloques agregados dinámicamente.
contenedorActividades.addEventListener("change", (e) => {
  const t = e.target;
  if (!t.matches('input[type="checkbox"][name^="dias_"]')) return;

  const bloque = t.closest(".actividad-bloque-form");
  if (!bloque) return;
  const i = bloque.dataset.index;
  const contenedor = document.getElementById("horarios-por-dia-" + i);
  if (!contenedor) return;

  const dia = t.value;
  const idBloque = "horario-" + dia + "-" + i;
  if (t.checked) {
    if (!document.getElementById(idBloque)) {
      contenedor.appendChild(crearBloqueHorario(i, dia, t.getAttribute("data-nombre")));
    }
  } else {
    const b = document.getElementById(idBloque);
    if (b) contenedor.removeChild(b);
  }
});


// --- Generación dinámica de bloques de actividad ---

const proximoIndice = () => {
  const indices = Array.from(
    contenedorActividades.querySelectorAll(".actividad-bloque-form")
  ).map((el) => parseInt(el.dataset.index, 10));
  return indices.length === 0 ? 0 : Math.max(...indices) + 1;
};

const contarActividades = () =>
  contenedorActividades.querySelectorAll(".actividad-bloque-form").length;

// Renumera los headers "Actividad #N" según el orden visual.
const renumerarTitulos = () => {
  contenedorActividades.querySelectorAll(".actividad-bloque-form").forEach((bloque, idx) => {
    const span = bloque.querySelector(".actividad-numero");
    if (span) span.textContent = idx + 1;
  });
};

const htmlBloqueActividad = (i) => `
  <article class="actividad-bloque-form" data-index="${i}">
    <header class="actividad-bloque-header">
      <h2 class="actividad-bloque-titulo">
        Actividad <span class="actividad-numero"></span>
      </h2>
      <button type="button" class="btn-quitar-actividad" title="Quitar esta actividad">× Quitar</button>
    </header>

    <fieldset>
      <legend>Datos de la Actividad</legend>
      <div class="campo" id="campo-nombre-act-${i}">
        <label for="nombre-act-${i}">Nombre de la actividad <span class="obligatorio">*</span></label>
        <input type="text" id="nombre-act-${i}" name="nombre_actividad_${i}" maxlength="45">
        <span class="msg-error">Ingrese el nombre de la actividad (entre 3 y 45 caracteres).</span>
      </div>
      <div class="campo" id="campo-tipo-act-${i}">
        <label for="tipo-act-${i}">Tipo de actividad <span class="obligatorio">*</span></label>
        <select id="tipo-act-${i}" name="tipo_actividad_${i}">
          <option value="">-- Seleccione --</option>
          <option value="arte">Arte</option>
          <option value="deporte">Deporte</option>
          <option value="tecnología">Tecnología</option>
          <option value="social">Social</option>
          <option value="recreación">Recreación</option>
          <option value="otra">Otra</option>
        </select>
        <span class="msg-error">Seleccione un tipo de actividad.</span>
      </div>
      <div class="campo" id="campo-descripcion-${i}">
        <label for="descripcion-${i}">Descripción <small>(opcional, máx. 500 caracteres)</small></label>
        <textarea id="descripcion-${i}" name="descripcion_${i}" rows="3" maxlength="500"></textarea>
        <span class="msg-error">La descripción no debe superar los 500 caracteres.</span>
      </div>
    </fieldset>

    <fieldset>
      <legend>Horarios</legend>
      <div class="campo" id="campo-dias-${i}">
        <label>Días de la semana <span class="obligatorio">*</span></label>
        <div class="grupo-dias">
          <label><input type="checkbox" name="dias_${i}" value="lunes"     data-nombre="Lunes"> Lunes</label>
          <label><input type="checkbox" name="dias_${i}" value="martes"    data-nombre="Martes"> Martes</label>
          <label><input type="checkbox" name="dias_${i}" value="miércoles" data-nombre="Miércoles"> Miércoles</label>
          <label><input type="checkbox" name="dias_${i}" value="jueves"    data-nombre="Jueves"> Jueves</label>
          <label><input type="checkbox" name="dias_${i}" value="viernes"   data-nombre="Viernes"> Viernes</label>
          <label><input type="checkbox" name="dias_${i}" value="sábado"    data-nombre="Sábado"> Sábado</label>
          <label><input type="checkbox" name="dias_${i}" value="domingo"   data-nombre="Domingo"> Domingo</label>
        </div>
        <span class="msg-error">Seleccione al menos un día.</span>
      </div>
      <div id="horarios-por-dia-${i}" class="horarios-por-dia"></div>
    </fieldset>

    <fieldset>
      <legend>Archivos y Enlace</legend>
      <div class="campo" id="campo-archivo-${i}">
        <label for="archivo-${i}">
          Fotos o videos de la actividad <span class="obligatorio">*</span>
          <small>(puede seleccionar varios)</small>
        </label>
        <input type="file" id="archivo-${i}" name="archivo_${i}" accept="image/*,video/*" multiple>
        <span class="msg-error">Debe adjuntar al menos un archivo de imagen o video.</span>
      </div>
      <div class="campo" id="campo-enlace-${i}">
        <label for="enlace-${i}">Enlace a contenido propio <span class="obligatorio">*</span></label>
        <input type="url" id="enlace-${i}" name="enlace_${i}" placeholder="https://ejemplo.com/mi-actividad">
        <span class="msg-error">Ingrese una URL válida (debe comenzar con http:// o https://).</span>
      </div>
    </fieldset>
  </article>
`;

const actualizarBotonAgregar = () => {
  const lleno = contarActividades() >= MAX_ACTIVIDADES;
  btnAgregarActividad.disabled = lleno;
  btnAgregarActividad.classList.toggle("boton-deshabilitado", lleno);
  btnAgregarActividad.textContent = lleno
    ? "Máximo " + MAX_ACTIVIDADES + " actividades"
    : "+ Agregar otra actividad";
};

btnAgregarActividad.addEventListener("click", () => {
  if (contarActividades() >= MAX_ACTIVIDADES) return;
  contenedorActividades.insertAdjacentHTML("beforeend", htmlBloqueActividad(proximoIndice()));
  renumerarTitulos();
  actualizarBotonAgregar();
});

contenedorActividades.addEventListener("click", (e) => {
  if (!e.target.matches(".btn-quitar-actividad")) return;
  const bloque = e.target.closest(".actividad-bloque-form");
  if (bloque) {
    bloque.remove();
    renumerarTitulos();
    actualizarBotonAgregar();
  }
});


// --- Validación del formulario al submit ---

const validarBloqueActividad = (bloque) => {
  const i = bloque.dataset.index;
  let valido = true;

  const nombreAct = document.getElementById("nombre-act-" + i).value;
  if (!marcarError("campo-nombre-act-" + i, !validarLargo(nombreAct, 3, 45))) valido = false;

  const tipoAct = document.getElementById("tipo-act-" + i).value;
  if (!marcarError("campo-tipo-act-" + i, tipoAct === "")) valido = false;

  const descripcion = document.getElementById("descripcion-" + i).value;
  if (!marcarError("campo-descripcion-" + i, descripcion.length > 500)) valido = false;

  const diasSel = bloque.querySelectorAll('input[name="dias_' + i + '"]:checked');
  if (!marcarError("campo-dias-" + i, diasSel.length === 0)) valido = false;

  diasSel.forEach((cb) => {
    const dia = cb.value;
    const inicio = (document.getElementById("inicio-" + dia + "-" + i) || {}).value || "";
    if (!marcarError("campo-inicio-" + dia + "-" + i, inicio === "")) valido = false;
    const fin = (document.getElementById("fin-" + dia + "-" + i) || {}).value || "";
    const finInvalido = fin === "" || (inicio !== "" && fin <= inicio);
    if (!marcarError("campo-fin-" + dia + "-" + i, finInvalido)) valido = false;
  });

  const archivo = document.getElementById("archivo-" + i);
  const r = validarArchivo(archivo);
  const span = document.querySelector("#campo-archivo-" + i + " .msg-error");
  if (span && !r.valido) span.textContent = r.mensaje;
  if (!marcarError("campo-archivo-" + i, !r.valido)) valido = false;

  const enlace = document.getElementById("enlace-" + i).value;
  if (!marcarError("campo-enlace-" + i, !validarURL(enlace))) valido = false;

  return valido;
};

const validarFormulario = () => {
  let valido = true;

  const nombre = document.getElementById("nombre").value.trim();
  if (!marcarError("campo-nombre", !validarTexto(nombre, 2, 100))) valido = false;

  const apellido = document.getElementById("apellido").value.trim();
  if (!marcarError("campo-apellido", !validarTexto(apellido, 2, 100))) valido = false;

  const email = document.getElementById("email").value.trim();
  if (!marcarError("campo-email", !validarEmail(email))) valido = false;

  const telefono = document.getElementById("telefono").value.trim();
  if (!marcarError("campo-telefono", !validarTelefono(telefono))) valido = false;

  const tipo = selectTipo.value;
  if (!marcarError("campo-tipo", tipo === "")) valido = false;

  ["campo-anio-ingreso", "campo-programa", "campo-area-investigacion",
   "campo-cargo", "campo-unidad", "campo-departamento", "campo-especialidad"]
    .forEach((id) => marcarError(id, false));

  if (tipo === "pregrado") {
    const anio = document.getElementById("anio-ingreso").value.trim();
    if (!marcarError("campo-anio-ingreso", !validarAnio(anio))) valido = false;
  }
  if (tipo === "postgrado") {
    const programa = document.getElementById("programa").value;
    if (!marcarError("campo-programa", programa === "")) valido = false;
    const area = document.getElementById("area-investigacion").value.trim();
    if (!marcarError("campo-area-investigacion", !validarLargoOpcional(area, 200))) valido = false;
  }
  if (tipo === "funcionario") {
    const cargo = document.getElementById("cargo").value.trim();
    if (!marcarError("campo-cargo", !validarTexto(cargo, 2, 200))) valido = false;
    const unidad = document.getElementById("unidad").value.trim();
    if (!marcarError("campo-unidad", !validarLargoOpcional(unidad, 200))) valido = false;
  }
  if (tipo === "academico") {
    const departamento = document.getElementById("departamento").value.trim();
    if (!marcarError("campo-departamento", !validarTexto(departamento, 2, 200))) valido = false;
    const especialidad = document.getElementById("especialidad").value.trim();
    if (!marcarError("campo-especialidad", !validarLargoOpcional(especialidad, 200))) valido = false;
  }

  const region = document.getElementById("region").value;
  if (!marcarError("campo-region", region === "")) valido = false;
  const comuna = document.getElementById("comuna").value;
  if (!marcarError("campo-comuna", comuna === "")) valido = false;

  const bloques = contenedorActividades.querySelectorAll(".actividad-bloque-form");
  if (bloques.length === 0) valido = false;
  bloques.forEach((bloque) => {
    if (!validarBloqueActividad(bloque)) valido = false;
  });

  return valido;
};

form.addEventListener("submit", (e) => {
  if (!validarFormulario()) {
    e.preventDefault();
    const primerError = document.querySelector(".campo-error");
    if (primerError) primerError.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});


// --- Estado inicial al cargar la página ---
// Si el server re-renderiza con datos previos (POST con error), hay que
// restaurar las secciones condicionales y los bloques de horario.
window.addEventListener("DOMContentLoaded", () => {
  if (selectTipo.value) {
    mostrarCamposTipo(selectTipo.value);
  }
  contenedorActividades
    .querySelectorAll(".actividad-bloque-form")
    .forEach((bloque) => {
      const i = bloque.dataset.index;
      const contenedorHor = document.getElementById("horarios-por-dia-" + i);
      bloque
        .querySelectorAll('input[name="dias_' + i + '"]:checked')
        .forEach((cb) => {
          contenedorHor.appendChild(
            crearBloqueHorario(i, cb.value, cb.getAttribute("data-nombre"))
          );
        });
    });
  renumerarTitulos();
  actualizarBotonAgregar();
});
