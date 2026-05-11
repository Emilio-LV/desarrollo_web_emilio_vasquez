from flask import Flask, request, render_template, redirect, url_for, flash, abort
from werkzeug.utils import secure_filename
from database import db
from utils.validations import validar_registro
import hashlib
import filetype
import os
import uuid


UPLOAD_FOLDER = 'static/uploads'

app = Flask(__name__)
app.secret_key = "secret_key"
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024  # 200 MB por request

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# --- Rutas ---

@app.route("/", methods=["GET"])
def index():
    miembros = db.get_ultimos_miembros(n=5)
    return render_template("index.html", miembros=miembros)


@app.route("/registrar", methods=["GET", "POST"])
def registrar():
    if request.method == "GET":
        regiones = db.get_regiones_con_comunas()
        return render_template("registro.html", regiones=regiones, datos={}, errores={})

    # POST
    comunas_por_region = db.get_comunas_por_region()
    errores, indices = validar_registro(request.form, request.files, comunas_por_region)

    if errores:
        # Re-renderizar con los errores y los valores que el usuario había escrito
        regiones = db.get_regiones_con_comunas()
        datos = request.form.to_dict(flat=True)
        for i in indices:
            datos[f'dias_{i}'] = request.form.getlist(f'dias_{i}')
        return render_template(
            "registro.html",
            regiones=regiones,
            datos=datos,
            errores=errores,
            actividad_indices=indices,
        )

    datos_miembro = _construir_datos_miembro(request.form)

    # Para cada actividad: guardar sus archivos en disco y armar la(s) fila(s)
    # de actividad (agrupando los días por horario).
    lista_actividades = []
    for i in indices:
        fotos = _guardar_archivos(request.files.getlist(f'archivo_{i}'))
        lista_actividades.extend(_construir_actividades_de_bloque(request.form, fotos, i))

    db.crear_miembro_con_actividades(datos_miembro, lista_actividades)

    flash("Miembro registrado correctamente.", "exito")
    return redirect(url_for('index'))


@app.route("/listado", methods=["GET"])
def listado():
    """Listado paginado. Acepta ?pagina=N. Si N no es válido, default a 1."""
    POR_PAGINA = 5
    try:
        pagina = max(1, int(request.args.get('pagina', 1)))
    except (TypeError, ValueError):
        pagina = 1

    miembros, total = db.get_miembros_paginados(pagina, POR_PAGINA)
    total_paginas = max(1, (total + POR_PAGINA - 1) // POR_PAGINA)

    if pagina > total_paginas and total > 0:
        return redirect(url_for('listado', pagina=total_paginas))

    return render_template(
        "listado.html",
        miembros=miembros,
        pagina=pagina,
        total_paginas=total_paginas,
        total=total,
    )


@app.route("/miembro/<int:id>", methods=["GET"])
def miembro(id):
    """Detalle de un miembro. Flask valida que <id> sea int (404 si no)."""
    m = db.get_miembro_con_actividades(id)
    if m is None:
        abort(404)
    actividades_agrupadas = _agrupar_actividades(m.actividades)
    return render_template(
        "miembro_detalle.html",
        miembro=m,
        actividades_agrupadas=actividades_agrupadas,
    )


# --- Helpers ---

def _construir_datos_miembro(form):
    # Concatena nombre+apellido y rellena solo los campos condicionales que aplican.
    nombre_completo = f"{form['nombre'].strip()} {form['apellido'].strip()}"
    datos = {
        'nombre': nombre_completo,
        'email': form['email'].strip(),
        'telefono': form['telefono'].strip(),
        'comuna_id': int(form['comuna_id']),
        'tipo': form['tipo'],
    }
    tipo = form['tipo']
    if tipo == 'pregrado':
        datos['anio_ingreso'] = int(form['anio_ingreso'])
    elif tipo == 'postgrado':
        datos['programa'] = form['programa']
        datos['area_investigacion'] = (form.get('area_investigacion') or '').strip() or None
    elif tipo == 'funcionario':
        datos['cargo'] = form['cargo'].strip()
        datos['unidad'] = (form.get('unidad') or '').strip() or None
    elif tipo == 'academico':
        datos['departamento'] = form['departamento'].strip()
        datos['especialidad'] = (form.get('especialidad') or '').strip() or None
    return datos


def _guardar_archivos(archivos):
    fotos = []
    for f in archivos:
        if not f or not f.filename:
            continue

        # Sacar la extensión leyendo los primeros bytes del archivo,
        # no confiando en el nombre que viene del browser.
        f.stream.seek(0)
        ext_obj = filetype.guess(f.stream)
        ext = ext_obj.extension if ext_obj else 'bin'

        nombre_seguro = secure_filename(f.filename)
        hash_str = hashlib.sha256(nombre_seguro.encode('utf-8')).hexdigest()[:16]
        nombre_unico = f"{hash_str}_{uuid.uuid4().hex}.{ext}"

        f.stream.seek(0)  # filetype.guess avanzó el stream, hay que rebobinar
        f.save(os.path.join(app.config['UPLOAD_FOLDER'], nombre_unico))

        fotos.append({
            'ruta_archivo': f"uploads/{nombre_unico}",
            'nombre_archivo': nombre_seguro,
        })
    return fotos


def _construir_actividades_de_bloque(form, fotos_metadata, i):
    # Si los días del bloque i tienen horarios distintos, devuelve una fila por grupo.
    dias_seleccionados = form.getlist(f'dias_{i}')
    grupos = {}
    for d in dias_seleccionados:
        inicio = form[f'inicio_{d}_{i}'].strip()
        fin = form[f'fin_{d}_{i}'].strip()
        grupos.setdefault((inicio, fin), []).append(d)

    descripcion = (form.get(f'descripcion_{i}') or '').strip() or None
    nombre_act = form[f'nombre_actividad_{i}'].strip()
    tipo_act = form[f'tipo_actividad_{i}']
    enlace = form[f'enlace_{i}'].strip()

    lista = []
    for (inicio, fin), dias_grupo in grupos.items():
        lista.append({
            'datos': {
                'nombre': nombre_act,
                'tipo': tipo_act,
                'descripcion': descripcion,
                'dia': set(dias_grupo),
                'hora_inicio': inicio,
                'duracion': _calcular_duracion(inicio, fin),
                'enlace': enlace,
            },
            'fotos': fotos_metadata,
        })
    return lista


def _calcular_duracion(hora_inicio, hora_fin):
    h_i, m_i = map(int, hora_inicio.split(':'))
    h_f, m_f = map(int, hora_fin.split(':'))
    minutos = (h_f * 60 + m_f) - (h_i * 60 + m_i)
    horas, mins = divmod(minutos, 60)
    return f"{horas:02d}:{mins:02d}"


def _agrupar_actividades(actividades):
    # Agrupa por (nombre, tipo, descripcion, enlace). Cada grupo trae sus horarios
    # y la unión deduplicada de sus fotos.
    grupos = {}
    rutas_por_grupo = {}

    for act in actividades:
        clave = (act.nombre, act.tipo, act.descripcion, act.enlace)
        if clave not in grupos:
            grupos[clave] = {
                'nombre': act.nombre,
                'tipo': act.tipo,
                'descripcion': act.descripcion,
                'enlace': act.enlace,
                'horarios': [],
                'fotos': [],
            }
            rutas_por_grupo[clave] = set()

        grupos[clave]['horarios'].append({
            'dias': act.dias_ordenados,
            'hora_inicio': act.hora_inicio,
            'duracion': act.duracion,
        })
        for foto in act.fotos:
            if foto.ruta_archivo not in rutas_por_grupo[clave]:
                rutas_por_grupo[clave].add(foto.ruta_archivo)
                grupos[clave]['fotos'].append(foto)

    return list(grupos.values())


if __name__ == "__main__":
    app.run(debug=True)
