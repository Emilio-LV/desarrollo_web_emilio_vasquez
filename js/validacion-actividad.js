// === VALIDADORES ===

// Valida que un texto tenga entre 'min' y 'max' caracteres
const validarLargo = (valor, min, max) => {
  const largo = valor.trim().length;
  return largo >= min && largo <= max;
};

// Valida que una URL comience con http:// o https://
const validarURL = (valor) => {
  const regex = /^https?:\/\/.+\..+/;
  return regex.test(valor.trim());
};

// Valida que TODOS los archivos sean imagen o video y ninguno supere 50 MB
const TAMANO_MAXIMO = 50 * 1024 * 1024; // 50 MB en bytes

const validarArchivo = (inputArchivo) => {
  // Debe haber al menos un archivo
  if (inputArchivo.files.length === 0) {
    return { valido: false, mensaje: "Debe adjuntar al menos un archivo de imagen o video." };
  }

  // Recorrer cada archivo y validarlo individualmente
  for (let i = 0; i < inputArchivo.files.length; i++) {
    const file = inputArchivo.files[i];

    const esImagen = file.type.startsWith("image/");
    const esVideo = file.type.startsWith("video/");

    if (!esImagen && !esVideo) {
      return {
        valido: false,
        mensaje: 'El archivo "' + file.name + '" no es imagen ni video. Solo se permiten fotos o videos.'
      };
    }

    if (file.size > TAMANO_MAXIMO) {
      return {
        valido: false,
        mensaje: 'El archivo "' + file.name + '" supera los 50 MB.'
      };
    }
  }

  return { valido: true, mensaje: "" };
};

// === FUNCION AUXILIAR: marcar campo con error o limpiarlo ===

const marcarError = (idCampo, tieneError) => {
  const campo = document.getElementById(idCampo);
  if (tieneError) {
    campo.classList.add("campo-error");
  } else {
    campo.classList.remove("campo-error");
  }
  return !tieneError;
};

// === HORARIOS DINAMICOS POR DIA ===

const contenedorHorarios = document.getElementById("horarios-por-dia");
const diasCheckboxes = document.querySelectorAll('input[name="dias"]');

// Crea o elimina el bloque de horario al marcar/desmarcar un día
diasCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    const dia = checkbox.value;
    const nombre = checkbox.getAttribute("data-nombre");

    if (checkbox.checked) {
      // Crear bloque de horario para este día
      const bloque = document.createElement("div");
      bloque.id = "horario-" + dia;
      bloque.className = "horario-dia";

      bloque.innerHTML =
        '<h3 class="horario-dia-titulo">' + nombre + '</h3>' +
        '<div class="horario-dia-campos">' +
          '<div class="campo" id="campo-inicio-' + dia + '">' +
            '<label for="inicio-' + dia + '">Hora de inicio <span class="obligatorio">*</span></label>' +
            '<input type="time" id="inicio-' + dia + '" name="inicio-' + dia + '">' +
            '<span class="msg-error">Ingrese una hora de inicio.</span>' +
          '</div>' +
          '<div class="campo" id="campo-fin-' + dia + '">' +
            '<label for="fin-' + dia + '">Hora de término <span class="obligatorio">*</span></label>' +
            '<input type="time" id="fin-' + dia + '" name="fin-' + dia + '">' +
            '<span class="msg-error">La hora de término debe ser posterior a la de inicio.</span>' +
          '</div>' +
        '</div>';

      contenedorHorarios.appendChild(bloque);
    } else {
      // Eliminar bloque de horario de este día
      const bloque = document.getElementById("horario-" + dia);
      if (bloque) {
        contenedorHorarios.removeChild(bloque);
      }
    }
  });
});

// === VALIDAR FORMULARIO DE ACTIVIDAD ===

const validarFormulario = () => {
  let valido = true;

  // Nombre de la actividad
  const nombreAct = document.getElementById("nombre-act").value;
  if (!marcarError("campo-nombre-act", !validarLargo(nombreAct, 3, 200))) {
    valido = false;
  }

  // Tipo de actividad
  const tipoAct = document.getElementById("tipo-act").value;
  if (!marcarError("campo-tipo-act", tipoAct === "")) {
    valido = false;
  }

  // Descripcion (opcional, pero si la escriben, max 500 caracteres)
  const descripcion = document.getElementById("descripcion").value;
  if (!marcarError("campo-descripcion", descripcion.length > 500)) {
    valido = false;
  }

  // Días seleccionados (al menos uno)
  const diasSeleccionados = document.querySelectorAll('input[name="dias"]:checked');
  if (!marcarError("campo-dias", diasSeleccionados.length === 0)) {
    valido = false;
  }

  // Validar horarios de cada día seleccionado
  diasSeleccionados.forEach((checkbox) => {
    const dia = checkbox.value;

    const horaInicio = document.getElementById("inicio-" + dia).value;
    if (!marcarError("campo-inicio-" + dia, horaInicio === "")) {
      valido = false;
    }

    const horaFin = document.getElementById("fin-" + dia).value;
    const horaFinInvalida = horaFin === "" || (horaInicio !== "" && horaFin <= horaInicio);
    if (!marcarError("campo-fin-" + dia, horaFinInvalida)) {
      valido = false;
    }
  });

  // Archivo (debe ser imagen o video y no superar 50 MB)
  const archivo = document.getElementById("archivo");
  const resultadoArchivo = validarArchivo(archivo);

  // Actualizar el mensaje de error según el problema
  const spanErrorArchivo = document.querySelector("#campo-archivo .msg-error");
  spanErrorArchivo.textContent = resultadoArchivo.mensaje;

  if (!marcarError("campo-archivo", !resultadoArchivo.valido)) {
    valido = false;
  }

  // Enlace
  const enlace = document.getElementById("enlace").value;
  if (!marcarError("campo-enlace", !validarURL(enlace))) {
    valido = false;
  }

  // Resultado
  if (valido) {
    alert("Actividad registrada exitosamente.");
    window.location.href = "index.html";
  } else {
    alert("Por favor corrija los campos marcados en rojo.");
  }
};

// Asociar evento al botón
const btnEnviar = document.getElementById("btn-enviar-actividad");
btnEnviar.addEventListener("click", validarFormulario);
