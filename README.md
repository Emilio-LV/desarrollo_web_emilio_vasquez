# Tarea 4 — CC5002 (Buscador de actividades y notas)

Esta entrega agrega dos funcionalidades nuevas — un **buscador de actividades** y un
sistema de **notas (1–7)** — implementadas en **Spring Boot + JPA**, como pide el
enunciado. El **resto de la aplicación (registro, listado, estadísticas y comentarios)
se mantiene tal cual de la Tarea 3 en Flask**, sin cambios. Ambas comparten la misma
base de datos MySQL `tarea2`.

## Estructura del repositorio

- **Raíz** (`app.py`, `database/`, `templates/`, `static/`, `utils/`): la app **Flask**
  de la Tarea 3, sin cambios. Corre en `http://localhost:5000`.
- **`buscador/`**: el proyecto **Spring Boot** nuevo (buscador + notas). Corre en
  `http://localhost:8080`. Tiene su propio `README.md` con más detalle.

## Arquitectura (importante para la corrección)

| Parte | Tecnología | Puerto |
|-------|------------|--------|
| Registro, listado, estadísticas, comentarios | Flask (Python) | `:5000` |
| **Buscador + notas (nuevo)** | **Spring Boot 3.5 + JPA + Thymeleaf** | `:8080` |

El buscador es una página servida por Spring Boot; su JavaScript hace las llamadas
asíncronas (`fetch`) a los endpoints del mismo servidor. Las dos apps corren a la vez y
comparten la base `tarea2`. Se eligió esta separación porque Flask y Spring Boot son dos
servidores distintos: así "lo nuevo" queda en Spring Boot y el resto intacto.

## Funcionalidades nuevas

1. **Buscador.** Un único input; al escribir 3 o más caracteres busca automáticamente las
   actividades cuyo **nombre, descripción o comuna** contienen el patrón, lo **destaca**
   con `<mark>` y muestra miembro, día, tipo, comuna, nombre y descripción. Si no hay
   resultados, muestra un mensaje.
2. **Nota.** Cada resultado muestra el **promedio** (o `-` si no tiene) y un **contador**.
   El botón "Evaluar" despliega un selector **1–7**; al elegir, se guarda la nota de forma
   **asíncrona** y se recalculan promedio y contador sin recargar la página.

## Decisiones de diseño

- **Tabla `nota`** creada con `tabla-nota.sql` del enunciado (incluida como
  `buscador/src/main/resources/schema.sql`). La nota mostrada es el promedio de las
  evaluaciones de la actividad.
- **Agrupación por actividad.** Una actividad guardada en varias filas (una por día) se
  junta en un solo resultado con los días juntos, y la nota es el promedio de todas sus
  filas. Es la misma decisión que se tomó con los comentarios en la Tarea 3.
- **JPA solo lee** las tablas existentes (`spring.jpa.hibernate.ddl-auto=none`, no modifica
  el esquema). La nota se **valida como entero 1–7** en cliente y servidor. La búsqueda usa
  **JPQL con parámetros** (sin inyección SQL) y los resultados se pintan con `textContent`
  y `<mark>` (sin XSS). El HTML5 y el CSS pasan los validadores de W3C sin errores.

(Más detalle del buscador en `buscador/README.md`.)

## Cómo ejecutar el buscador

Requisitos: **JDK 17+** y **MySQL** con la base `tarea2` (la misma de la Tarea 3).

1. `cd buscador`
2. `./mvnw spring-boot:run`  · en Windows: `mvnw.cmd spring-boot:run`
3. Abrir `http://localhost:8080/`

La app Flask se levanta como siempre: `python app.py`, en `http://localhost:5000`.
