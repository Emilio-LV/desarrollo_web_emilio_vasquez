
const datosRegiones = window.DATOS_REGIONES || [];
const selectRegion = document.getElementById("region");
const selectComuna = document.getElementById("comuna");

// Llena el select de comunas con las comunas de la región dada.
// Si no se pasa regionId (o no existe), deja el select vacío con un
// placeholder.
const poblarComunas = (regionId) => {
  selectComuna.innerHTML = '<option value="">-- Seleccione --</option>';

  if (!regionId) {
    selectComuna.querySelector("option").textContent = "-- Seleccione una región primero --";
    return;
  }

  // == para que ID numérico (de DATOS_REGIONES) y string (del select) calcen
  const region = datosRegiones.find((r) => r.id == regionId);
  if (!region) return;

  region.comunas.forEach((c) => {
    const option = document.createElement("option");
    option.value = c.id;
    option.textContent = c.nombre;
    selectComuna.appendChild(option);
  });
};

// Cambio de región -> repoblar comunas
selectRegion.addEventListener("change", () => poblarComunas(selectRegion.value));

// Al cargar la página: si la región ya está seleccionada (re-render
// con error), poblar comunas y luego restaurar la comuna previa.
window.addEventListener("DOMContentLoaded", () => {
  if (selectRegion.value) {
    poblarComunas(selectRegion.value);
    const comunaPrevia = selectComuna.getAttribute("data-selected");
    if (comunaPrevia) {
      selectComuna.value = comunaPrevia;
    }
  }
});
