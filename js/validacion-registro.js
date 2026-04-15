// === VALIDADORES ===

// Texto con letras Unicode (acepta Müller, O'Higgins, García-López, etc.)
const validarTexto = (valor, min, max) => {
  const regex = /^[\p{L}\s'\-]+$/u;
  return valor.length >= min && valor.length <= max && regex.test(valor);
};

// Largo máximo para campos opcionales (vacío se considera válido)
const validarLargoOpcional = (valor, max) => {
  return valor.length <= max;
};

const validarEmail = (valor) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(valor);
};

// Teléfono chileno: +569XXXXXXXX
const validarTelefono = (valor) => {
  const regex = /^\+569\d{8}$/;
  return regex.test(valor);
};

// Año entre 1940 y el año actual
const validarAnio = (valor) => {
  const num = parseInt(valor);
  const anioActual = new Date().getFullYear();
  return !isNaN(num) && num >= 1940 && num <= anioActual;
};

// === MOSTRAR/OCULTAR CAMPOS SEGUN TIPO ===

const selectTipo = document.getElementById("tipo");

selectTipo.addEventListener("change", () => {
  const secciones = document.querySelectorAll(".campos-tipo");
  secciones.forEach((s) => s.classList.remove("visible"));

  const tipo = selectTipo.value;
  if (tipo) {
    const seccion = document.getElementById("campos-" + tipo);
    if (seccion) {
      seccion.classList.add("visible");
    }
  }
});

// === MARCAR/LIMPIAR ERROR EN UN CAMPO ===

const marcarError = (idCampo, tieneError) => {
  const campo = document.getElementById(idCampo);
  if (tieneError) {
    campo.classList.add("campo-error");
  } else {
    campo.classList.remove("campo-error");
  }
  return !tieneError;
};

// === VALIDAR FORMULARIO ===

const validarFormulario = () => {
  let valido = true;

  const nombre = document.getElementById("nombre").value.trim();
  if (!marcarError("campo-nombre", !validarTexto(nombre, 2, 100))) {
    valido = false;
  }

  const apellido = document.getElementById("apellido").value.trim();
  if (!marcarError("campo-apellido", !validarTexto(apellido, 2, 100))) {
    valido = false;
  }

  const email = document.getElementById("email").value.trim();
  if (!marcarError("campo-email", !validarEmail(email))) {
    valido = false;
  }

  const telefono = document.getElementById("telefono").value.trim();
  if (!marcarError("campo-telefono", !validarTelefono(telefono))) {
    valido = false;
  }

  const tipo = selectTipo.value;
  if (!marcarError("campo-tipo", tipo === "")) {
    valido = false;
  }

  // Limpiar errores previos de los campos condicionales
  ["campo-anio-ingreso", "campo-programa",
   "campo-cargo", "campo-departamento"].forEach((id) => {
    marcarError(id, false);
  });

  if (tipo === "pregrado") {
    const anio = document.getElementById("anio-ingreso").value.trim();
    if (!marcarError("campo-anio-ingreso", !validarAnio(anio))) {
      valido = false;
    }
  }

  if (tipo === "postgrado") {
    const programa = document.getElementById("programa").value;
    if (!marcarError("campo-programa", programa === "")) {
      valido = false;
    }
    const area = document.getElementById("area-investigacion").value.trim();
    if (!marcarError("campo-area-investigacion", !validarLargoOpcional(area, 200))) {
      valido = false;
    }
  }

  if (tipo === "funcionario") {
    const cargo = document.getElementById("cargo").value.trim();
    if (!marcarError("campo-cargo", !validarTexto(cargo, 2, 200))) {
      valido = false;
    }
    const unidad = document.getElementById("unidad").value.trim();
    if (!marcarError("campo-unidad", !validarLargoOpcional(unidad, 200))) {
      valido = false;
    }
  }

  if (tipo === "academico") {
    const departamento = document.getElementById("departamento").value.trim();
    if (!marcarError("campo-departamento", !validarTexto(departamento, 2, 200))) {
      valido = false;
    }
    const especialidad = document.getElementById("especialidad").value.trim();
    if (!marcarError("campo-especialidad", !validarLargoOpcional(especialidad, 200))) {
      valido = false;
    }
  }

  if (valido) {
    alert("Registro exitoso. Los datos han sido enviados correctamente.");
    window.location.href = "index.html";
  } else {
    alert("Por favor corrija los campos marcados en rojo.");
  }
};

const btnRegistrar = document.getElementById("btn-registrar");
btnRegistrar.addEventListener("click", validarFormulario);
