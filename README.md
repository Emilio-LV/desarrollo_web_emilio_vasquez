# Tarea 3 — CC5002 Desarrollo de Aplicaciones Web

Continuación de la Tarea 2 (Flask + MySQL + SQLAlchemy). En esta entrega se agregan
la página de estadísticas con 3 gráficos y los comentarios en las actividades.

## Gráficos

Los gráficos se generan en el lado del cliente, como pide el enunciado. El servidor
solo entrega los datos: hay 3 URLs (`/api/stats/...`) que responden JSON con el
formato `{status: "ok", data: [...]}`. Al cargar la página de estadísticas,
`static/js/estadisticas.js` hace un `fetch` a cada URL y dibuja con la biblioteca
**Highcharts** (https://www.highcharts.com), que se carga desde su CDN oficial,
por lo que se necesita conexión a internet para ver los gráficos. Es una de las
bibliotecas sugeridas en el enunciado.

Detalle del gráfico de líneas: los días sin registros entre el primero y el último
se rellenan con 0, para que el eje X no salte fechas.

## Comentarios

En el detalle de un miembro, cada actividad muestra sus comentarios y un formulario
para agregar uno nuevo. Las dos cosas se hacen con `fetch` (llamadas asíncronas),
sin recargar la página:

- Al cargar la página, `static/js/comentarios.js` pide los comentarios de cada
  actividad a `GET /api/comentarios`.
- Al enviar el formulario, se valida primero en JavaScript; si pasa, se hace
  `POST /api/comentarios`. El servidor vuelve a validar e inserta en la tabla
  `comentario`. Si hay errores, responde 400 y los mensajes se muestran junto a
  cada campo, manteniendo el formulario visible con lo que el usuario escribió.

**Decisión importante**: en mi modelo de datos, una actividad que se muestra como
un solo bloque puede estar guardada en varias filas de la tabla `actividad`
(una por cada horario distinto, ver sección siguiente). Como la FK del script del
enunciado apunta a una fila de `actividad`, decidí que los comentarios se **leen**
de todas las filas del bloque (`?actividad_ids=1,2`) pero se **insertan** asociados
a la primera fila del grupo. Así se respeta el script sin perder comentarios.

## Base de datos: todos los cambios

1. **Tabla `comentario` (nueva en esta tarea)**: es el script `tabla-comentario.sql`
   adjunto al enunciado, sin modificaciones, integrado al final de
   `database/tarea2.sql`. Columnas: `id`, `nombre` (80), `texto` (300), `fecha`
   (TIMESTAMP) y `actividad_id` con FK a `actividad.id`. En `database/db.py` se
   agregó el modelo `Comentario` y la relación con `Actividad`.

2. **Cambios que vienen de mi Tarea 2 y se mantienen** (el enunciado de la T2
   permitía ajustar el modelo propuesto):
   - La tabla `miembro` tiene una columna `tipo` (pregrado, postgrado, funcionario,
     academico) y columnas opcionales que dependen del tipo (año de ingreso,
     programa, cargo, departamento, etc.).
   - En la tabla `actividad`, la columna `dia` es un `SET` en vez de un `ENUM`:
     una misma fila puede guardar varios días si comparten horario. Por eso una
     actividad con horarios distintos genera más de una fila.

3. **Fecha de los comentarios**: se inserta desde Python con `datetime.now()`
   en vez de dejar que MySQL la complete, para poder devolverla al cliente en la
   misma respuesta del POST.

Para crear todo desde cero: ejecutar en orden `database/create_user.sql`,
`database/tarea2.sql` (ya incluye `comentario`) y `database/region-comuna.sql`.

## Validaciones y seguridad

- Doble validación: JavaScript en el cliente (aviso rápido al usuario, se puede
  saltar) y `utils/validations.py` en el servidor (la que protege de verdad).
  Las reglas del comentario son las del enunciado: nombre de 3 a 80 caracteres,
  texto de mínimo 5 (y máximo 300 por el largo de la columna).
- El servidor también verifica que la actividad del comentario exista.
- Los comentarios se pintan en el navegador con `textContent` (nunca `innerHTML`),
  así un comentario con HTML o scripts se muestra como texto y no se ejecuta.
- Las consultas usan SQLAlchemy con parámetros, lo que evita inyección SQL.

## Cómo correr el proyecto

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

La aplicación queda en `http://127.0.0.1:5000/`. Requiere MySQL corriendo en
localhost:3306 con la base `tarea2` (credenciales del enunciado: usuario `cc5002`).
