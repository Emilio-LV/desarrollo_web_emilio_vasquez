# Tarea 2 — CC5002 Desarrollo Web

Aplicación web para registrar miembros y actividades de la comunidad del DCC, construida con **Flask + MySQL + SQLAlchemy**. Es la continuación de la Tarea 1: el mismo formulario que se hizo en HTML/JS plano ahora vive sobre un backend real, con validación servidor, persistencia en base de datos y manejo de archivos.

## Qué hace

- **Portada** con un mensaje de bienvenida, menú y un listado con los últimos 5 miembros agregados.
- **Registrar miembro y actividades**: formulario que permite ingresar los datos personales (nombre, apellido, email, teléfono), el tipo de miembro (pregrado, postgrado, funcionario o académico) con sus campos condicionales, la ubicación (región y comuna), y una o varias actividades — cada actividad con sus días, horarios por día, descripción, enlace y archivos (fotos o videos). Tiene validación en el navegador (JavaScript) y validación en el servidor (Python).
- **Listado de miembros** paginado, donde cada fila lleva al detalle del miembro al hacer clic.
- **Detalle del miembro** con todos sus datos personales, ubicación y la lista de sus actividades con sus horarios y fotos.

## Estructura

```
Codigo/
├── app.py                # Punto de entrada de Flask: rutas y orquestación.
├── database/             # Scripts SQL y modelos SQLAlchemy.
├── utils/                # Validaciones del lado del servidor.
├── templates/            # Vistas en Jinja.
├── static/               # CSS, JS y archivos subidos por los miembros.
├── requirements.txt      # Dependencias Python.
└── README.md
```

A grandes rasgos: `app.py` recibe las peticiones HTTP, delega la validación a `utils/validations.py`, persiste y consulta vía `database/db.py`, y renderiza con los templates de `templates/`. Los scripts `database/create_user.sql`, `database/tarea2.sql` y `database/region-comuna.sql` se corren al inicio para preparar la base.

## Setup

1. Conectado como `root` en MySQL, ejecutar en orden:
   - `database/create_user.sql` — crea el usuario `cc5002` y le da permisos.
   - `database/tarea2.sql` — crea la base `tarea2` y sus 5 tablas.
   - `database/region-comuna.sql` — carga las 16 regiones y 345 comunas.

2. Crear el entorno virtual e instalar dependencias:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. Levantar la app:
   ```bash
   python app.py
   ```
   Servidor en `http://127.0.0.1:5000/`.

## Decisiones que tomé

### Modelo de datos

Usé el `tarea2.sql` provisto, pero le hice tres modificaciones para acomodar el formulario de Tarea 1:

1. A la tabla `miembro` le agregué la columna `tipo` (con sus 4 valores: pregrado, postgrado, funcionario, académico) y los 7 campos condicionales según el tipo (año de ingreso, programa, área de investigación, cargo, unidad, departamento, especialidad). Todos los condicionales son nullable: cuando un miembro es de pregrado solo se rellena `anio_ingreso` y el resto queda en NULL. 

2. Cambié la columna `dia` de `actividad` de `ENUM` a `SET`. Con `ENUM` una actividad multi-día requería múltiples filas, y eso obligaba a duplicar fotos en la tabla `foto`. Con `SET` puedo tener "lunes,miércoles" en una sola celda.

3. Agregué la columna `enlace VARCHAR(500) NOT NULL` a `actividad` porque el form de Tarea 1 ya tenía un campo obligatorio de URL.

### Formulario con múltiples actividades

El formulario permite registrar **varias actividades en un mismo submit** (hasta 10). El usuario llena los datos personales una sola vez y después puede agregar tantos bloques de actividad como quiera con el botón "+ Agregar otra actividad". Esto evita el caso donde un miembro queda duplicado en la BD solo por inscribir 2 actividades y así puede hacer todo de una.

Cuando una actividad multi-día tiene **horarios distintos por día** (ej. futbol los viernes 16:00 y los sábados 08:00), internamente se inserta como varias filas en `actividad` — pero en el detalle del miembro las agrupo visualmente por nombre, así no se ve "futbol" repetido dos veces. Cada fila es semánticamente correcta (un horario único), y la presentación queda limpia.

### El "apellido" no existe en la BD

El form tiene `nombre` y `apellido` como campos separados (igual que Tarea 1), pero al guardar los concateno en la columna `nombre`. Pude haber agregado una columna `apellido`, pero el enunciado no lo pedía y mantener una sola columna es más simple.

### Sin login

La app **no tiene autenticación**. Cualquier visitante puede entrar, registrar miembros, ver el listado. El usuario `cc5002` de MySQL no es un "usuario del sitio" sino la credencial técnica con la que Flask se conecta a la base.

### Validación en tres capas

La validación cliente (JS) es solo para UX — feedback rápido al usuario. No es seguridad: se puede burlar apagando JavaScript, editando el HTML. Por eso la validación servidor (en `utils/validations.py`) repite todo el chequeo, y la BD tiene constraints (NOT NULL, FK, ENUM/SET) como red final.

### Archivos

Las fotos/videos van a `static/uploads/`. Cada uno se guarda con un nombre único generado de hash + uuid + extensión real detectada leyendo los primeros bytes con `filetype.guess()` (no confío en la extensión que diga el browser). Eso protege contra alguien que rename un `.exe` a `.jpg`.
