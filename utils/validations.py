# Validaciones del lado del servidor.
import re
from datetime import datetime
import filetype


TIPOS_MIEMBRO = {"pregrado", "postgrado", "funcionario", "academico"}
PROGRAMAS = {"magister", "doctorado"}
TIPOS_ACTIVIDAD = {"arte", "deporte", "tecnología", "social", "recreación", "otra"}
DIAS_VALIDOS = {"lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"}

MAX_ACTIVIDADES = 10
TAMANO_MAX_ARCHIVO = 50 * 1024 * 1024  # 50 MB
MIMES_IMAGEN = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"}
MIMES_VIDEO = {
    "video/mp4", "video/quicktime", "video/x-msvideo",
    "video/x-matroska", "video/webm", "video/mpeg",
}


def validar_texto(valor, min_largo, max_largo):
    """Solo letras (Unicode), espacios, apóstrofos y guiones."""
    if not valor:
        return False
    v = valor.strip()
    if len(v) < min_largo or len(v) > max_largo:
        return False
    return all(c.isalpha() or c in " '-" for c in v)


def validar_largo_opcional(valor, max_largo):
    return not valor or len(valor) <= max_largo


def validar_largo(valor, min_largo, max_largo):
    if not valor:
        return False
    return min_largo <= len(valor.strip()) <= max_largo


_REGEX_EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
def validar_email(valor):
    return bool(valor and _REGEX_EMAIL.match(valor.strip()))


_REGEX_TELEFONO = re.compile(r"^\+569\d{8}$")
def validar_telefono(valor):
    return bool(valor and _REGEX_TELEFONO.match(valor.strip()))


def validar_anio(valor):
    try:
        num = int(str(valor).strip())
    except (TypeError, ValueError):
        return False
    return 1940 <= num <= datetime.now().year


_REGEX_URL = re.compile(r"^https?://.+\..+", re.IGNORECASE)
def validar_url(valor):
    return bool(valor and _REGEX_URL.match(valor.strip()))


_REGEX_HORA = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
def validar_hora(valor):
    return bool(valor and _REGEX_HORA.match(valor.strip()))


def validar_archivos(files_list):
    """Verifica MIME real con filetype.guess (no por extensión) y tamaño <= 50 MB.
    Retorna (lista_validos, mensaje_error_o_None).
    """
    if not files_list or all(not f or f.filename == "" for f in files_list):
        return [], "Debe adjuntar al menos un archivo de imagen o video."

    validos = []
    for f in files_list:
        if not f or f.filename == "":
            continue

        f.stream.seek(0)
        tipo = filetype.guess(f.stream)
        f.stream.seek(0)

        if tipo is None:
            return [], f"El archivo '{f.filename}' no se reconoce como imagen ni video."
        if tipo.mime not in MIMES_IMAGEN and tipo.mime not in MIMES_VIDEO:
            return [], f"El archivo '{f.filename}' no es imagen ni video válido."

        f.stream.seek(0, 2)
        tamano = f.stream.tell()
        f.stream.seek(0)
        if tamano > TAMANO_MAX_ARCHIVO:
            return [], f"El archivo '{f.filename}' supera los 50 MB."

        validos.append(f)

    if not validos:
        return [], "Debe adjuntar al menos un archivo de imagen o video."
    return validos, None


def obtener_indices_actividades(form):
    """Detecta qué actividades vienen en el form mirando las claves nombre_actividad_<i>."""
    indices = set()
    for k in form.keys():
        if k.startswith("nombre_actividad_"):
            sufijo = k.split("_")[-1]
            if sufijo.isdigit():
                indices.add(int(sufijo))
    return sorted(indices)


def _validar_actividad(form, files, i, errores):
    """Valida los campos de una actividad con sufijo _i, agrega errores al dict."""
    nombre_act = (form.get(f"nombre_actividad_{i}") or "").strip()
    if not validar_largo(nombre_act, 3, 45):
        errores[f"nombre_actividad_{i}"] = "Ingrese el nombre de la actividad (entre 3 y 45 caracteres)."

    tipo_act = (form.get(f"tipo_actividad_{i}") or "").strip()
    if tipo_act not in TIPOS_ACTIVIDAD:
        errores[f"tipo_actividad_{i}"] = "Seleccione un tipo de actividad."

    descripcion = form.get(f"descripcion_{i}") or ""
    if len(descripcion) > 500:
        errores[f"descripcion_{i}"] = "La descripción no debe superar los 500 caracteres."

    dias = form.getlist(f"dias_{i}") if hasattr(form, "getlist") else []
    if not dias or any(d not in DIAS_VALIDOS for d in dias):
        errores[f"dias_{i}"] = "Seleccione al menos un día válido."

    for d in (d for d in dias if d in DIAS_VALIDOS):
        inicio = (form.get(f"inicio_{d}_{i}") or "").strip()
        fin = (form.get(f"fin_{d}_{i}") or "").strip()
        if not validar_hora(inicio):
            errores[f"inicio_{d}_{i}"] = "Ingrese una hora de inicio válida (HH:MM)."
            continue
        if not validar_hora(fin):
            errores[f"fin_{d}_{i}"] = "Ingrese una hora de término válida (HH:MM)."
            continue
        if fin <= inicio:
            errores[f"fin_{d}_{i}"] = "La hora de término debe ser posterior a la de inicio."

    enlace = (form.get(f"enlace_{i}") or "").strip()
    if not validar_url(enlace):
        errores[f"enlace_{i}"] = "Ingrese una URL válida (debe comenzar con http:// o https://)."

    archivos_list = files.getlist(f"archivo_{i}") if hasattr(files, "getlist") else []
    _, error_archivo = validar_archivos(archivos_list)
    if error_archivo:
        errores[f"archivo_{i}"] = error_archivo


def validar_registro(form, files, comunas_por_region):
    """Valida el form completo. Retorna (errores, indices_actividades).
    Si errores queda vacío, los datos pasan."""
    errores = {}

    # Datos personales
    nombre = (form.get("nombre") or "").strip()
    if not validar_texto(nombre, 2, 100):
        errores["nombre"] = "Ingrese un nombre válido (solo letras, entre 2 y 100 caracteres)."

    apellido = (form.get("apellido") or "").strip()
    if not validar_texto(apellido, 2, 100):
        errores["apellido"] = "Ingrese un apellido válido (solo letras, entre 2 y 100 caracteres)."

    email = (form.get("email") or "").strip()
    if not validar_email(email):
        errores["email"] = "Ingrese un correo válido (ej: usuario@dominio.com)."

    telefono = (form.get("telefono") or "").strip()
    if not validar_telefono(telefono):
        errores["telefono"] = "Ingrese un teléfono válido (formato +569XXXXXXXX, 12 dígitos)."

    # Tipo de miembro y campos condicionales
    tipo = (form.get("tipo") or "").strip()
    if tipo not in TIPOS_MIEMBRO:
        errores["tipo"] = "Seleccione un tipo de miembro válido."
    elif tipo == "pregrado":
        if not validar_anio(form.get("anio_ingreso") or ""):
            errores["anio_ingreso"] = "Ingrese un año válido (entre 1940 y el actual)."
    elif tipo == "postgrado":
        if (form.get("programa") or "").strip() not in PROGRAMAS:
            errores["programa"] = "Seleccione un programa válido."
        if not validar_largo_opcional((form.get("area_investigacion") or "").strip(), 200):
            errores["area_investigacion"] = "El área de investigación no debe superar los 200 caracteres."
    elif tipo == "funcionario":
        if not validar_texto((form.get("cargo") or "").strip(), 2, 200):
            errores["cargo"] = "Ingrese su cargo (solo letras, entre 2 y 200 caracteres)."
        if not validar_largo_opcional((form.get("unidad") or "").strip(), 200):
            errores["unidad"] = "La unidad o área no debe superar los 200 caracteres."
    elif tipo == "academico":
        if not validar_texto((form.get("departamento") or "").strip(), 2, 200):
            errores["departamento"] = "Ingrese su departamento (solo letras, entre 2 y 200 caracteres)."
        if not validar_largo_opcional((form.get("especialidad") or "").strip(), 200):
            errores["especialidad"] = "El área de especialización no debe superar los 200 caracteres."

    # Ubicación
    region_id = None
    try:
        region_id = int(form.get("region_id") or "")
    except ValueError:
        errores["region_id"] = "Seleccione una región."

    comuna_id = None
    try:
        comuna_id = int(form.get("comuna_id") or "")
    except ValueError:
        errores["comuna_id"] = "Seleccione una comuna."

    if comuna_id is not None and "comuna_id" not in errores:
        if comuna_id not in comunas_por_region:
            errores["comuna_id"] = "La comuna seleccionada no existe."
        elif region_id is not None and comunas_por_region[comuna_id] != region_id:
            errores["comuna_id"] = "La comuna no pertenece a la región seleccionada."

    # Actividades
    indices = obtener_indices_actividades(form)
    if not indices:
        errores["__actividades"] = "Debe registrar al menos una actividad."
        indices = [0]
    elif len(indices) > MAX_ACTIVIDADES:
        errores["__actividades"] = f"Se permiten como máximo {MAX_ACTIVIDADES} actividades por registro."

    for i in indices:
        _validar_actividad(form, files, i, errores)

    return errores, indices
