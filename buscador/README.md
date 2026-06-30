# Tarea 4 — Buscador de actividades y notas (Spring Boot)

Las dos funcionalidades nuevas de la Tarea 4 se implementaron en **Spring Boot + JPA**,
tal como pide el enunciado. El **resto de la aplicación (registro, listado,
estadísticas, comentarios) se mantiene tal cual en la app Flask** de la Tarea 3,
sin cambios. Ambas aplicaciones usan la **misma base de datos MySQL `tarea2`**.

## Arquitectura (importante para la corrección)

| Parte | Tecnología | Puerto | Estado |
|-------|------------|--------|--------|
| App original (registro, listado, estadísticas, comentarios) | Flask (Python) | `:5000` | Sin cambios |
| **Buscador + notas (nuevo)** | **Spring Boot 3.5 + JPA + Thymeleaf** | `:8080` | Esta entrega |

El buscador es una página propia servida por Spring Boot en `http://localhost:8080/`.
Su JavaScript hace las llamadas asíncronas (`fetch`) a los endpoints del **mismo**
servidor Spring Boot.

## Funcionalidades

1. **Buscador de actividades.** Un único input de texto. Al escribir **3 o más
   caracteres** se busca automáticamente (con un pequeño *debounce*) y se listan las
   actividades cuyo **nombre, descripción o nombre de comuna** contienen el patrón.
   Cada resultado muestra: miembro, día, tipo, comuna, nombre y descripción. El texto
   que calza con el patrón se **destaca** con `<mark>`. Si no hay resultados se muestra
   un mensaje apropiado.
2. **Nota (evaluación).** Cada resultado muestra la **nota** (promedio de las
   evaluaciones, con un decimal) y un **contador** entre paréntesis; muestra `-` si la
   actividad aún no tiene notas. El botón **"Evaluar"** despliega un selector de **1 a 7**;
   al elegir un valor se envía de forma **asíncrona** (`fetch` `POST`), se guarda la nota
   en la tabla `nota` y el servidor devuelve el **promedio y contador recalculados**, que
   se actualizan en la interfaz sin recargar la página.

## Decisiones de diseño

- **Tabla `nota`.** Se usa el script `tabla-nota.sql` del enunciado, sin modificar
  (incluido como `src/main/resources/schema.sql`). Cada nota es una fila con FK a una
  fila de `actividad`, tal como define el script. La nota que ve el usuario es el
  **promedio** de todas las evaluaciones de esa actividad.
- **Agrupación por actividad.** En el modelo de la Tarea 2/3 una misma actividad puede
  quedar guardada en **varias filas** (una por día/horario). El buscador **junta esas
  filas en un solo resultado** y muestra los días juntos (ej.: Futbol los lunes, viernes
  y domingo = una sola fila). Se agrupa por miembro + nombre + tipo + descripción; dos
  actividades distintas quedan separadas. En consecuencia, la **nota es el promedio de
  toda la actividad** (todas sus filas) y el contador suma todas sus evaluaciones; al
  "Evaluar", la nueva nota se guarda en una fila representante del grupo. Es la misma
  decisión que se tomó para los comentarios en la Tarea 3.
- **JPA solo lee las tablas existentes.** `spring.jpa.hibernate.ddl-auto=none`: Hibernate
  **no modifica** el esquema de la Tarea 2/3. Las entidades `Actividad`, `Miembro` y
  `Comuna` mapean solo los campos que usa el buscador (lectura). La columna `dia` (tipo
  `SET` en MySQL) se lee como texto (`"lunes,martes"`).
- **Validación de la nota.** Solo se aceptan **enteros entre 1 y 7**: el selector ya
  limita las opciones en el cliente, y el servidor **vuelve a validar** (rechaza con
  HTTP 400 si no es un entero en rango o si la actividad no existe).
- **Seguridad.** La búsqueda usa **JPQL con parámetros ligados** (`:q`), así que no hay
  inyección SQL. Los resultados se pintan con `textContent` y `createElement` (nunca
  `innerHTML`), de modo que una descripción con HTML/scripts se muestra como texto y no
  se ejecuta (sin XSS).
- **Accesibilidad y validez W3C.** HTML5 con `lang="es"`, `meta charset="UTF-8"`,
  `<label>` asociado al input, tabla con `<caption>` y `<th scope="col">`, botones con
  texto (no solo iconos) y región de estado con `role="status"`. HTML y CSS pensados para
  pasar los validadores de W3C.

## Cómo ejecutar

Requisitos: **JDK 17+** y **MySQL** corriendo con la base `tarea2` (la misma de la Tarea 3).

1. `cd buscador`
2. `./mvnw spring-boot:run`  · en Windows: `mvnw.cmd spring-boot:run`
3. Abrir `http://localhost:8080/`

## Estructura

```
buscador/
├── pom.xml
├── src/main/java/cc5002/buscador/
│   ├── BuscadorApplication.java
│   ├── controllers/   (AppController = página, ApiController = endpoints JSON)
│   ├── services/      (BuscadorService = búsqueda y lógica de notas)
│   └── models/        (Actividad, Miembro, Comuna, Nota + repositorios JPA)
└── src/main/resources/
    ├── application.properties
    ├── schema.sql                  (= tabla-nota.sql)
    ├── templates/buscador.html
    └── static/css/buscador.css, static/js/buscador.js
```
