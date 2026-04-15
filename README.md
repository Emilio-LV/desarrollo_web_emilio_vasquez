# Tarea 1 - Actividades DCC

Prototipo del sistema de gestión de actividades de la comunidad DCC, pedido para la Tarea 1 del curso CC5002. Son páginas HTML con sus estilos y su lógica en JavaScript.

## Cómo está pensado el flujo

La puerta de entrada al sistema es el formulario de registro (`registro.html`). Una vez que los datos están completos y validados, el sistema redirige a la página principal (`index.html`), que funciona como el "home" del usuario ya registrado. Desde ahí puede navegar a informar una actividad, consultar el listado de miembros o revisar los indicadores.

Como el enunciado permite que esto sea un prototipo sin base de datos, los formularios validan toda la información pero no la guardan: al enviar solo aparece un mensaje de confirmación. El listado de miembros y los indicadores muestran datos de ejemplo cargados directamente en el código JavaScript, para que se pueda apreciar cómo se vería el sistema con datos reales.

## Estructura de archivos

```
Codigo/
├── registro.html       Página inicial — formulario de registro
├── index.html          Bienvenida después del registro exitoso
├── actividades.html    Formulario para informar una actividad
├── listado.html        Listado de miembros con filtro, orden y paginación
├── indicadores.html    Gráficos con métricas generales
├── css/
│   └── estilos.css
└── js/
    ├── validacion-registro.js
    ├── validacion-actividad.js
    ├── listado.js
    └── indicadores.js
```

## Las páginas

- **`registro.html`** — Página inicial del sistema. Formulario de registro con campos distintos según el tipo de miembro (pregrado, postgrado, funcionario, académico).
- **`index.html`** — Bienvenida después del registro exitoso, con enlaces a las demás secciones.
- **`actividades.html`** — Formulario para informar una actividad, con días, horarios, archivos adjuntos y un enlace.
- **`listado.html`** — Listado de miembros con filtro por tipo, ordenamiento al hacer clic en las columnas y paginación.
- **`indicadores.html`** — Gráficos con métricas generales: distribución de miembros por tipo, ranking de actividades y un mapa de calor día/hora.

## Decisiones de diseño a tener en cuenta

**Campos fijos en HTML vs campos generados dinámicamente.** Esta es probablemente la decisión más importante del prototipo, y tomé caminos distintos en dos situaciones que a primera vista pueden parecer parecidas.

En el **formulario de registro**, los campos extra que dependen del tipo de miembro (por ejemplo, "Año de ingreso" si es pregrado, "Programa" si es postgrado, "Cargo" si es funcionario) están todos escritos directamente en el HTML desde el principio. Lo único que hace el JavaScript es mostrarlos u ocultarlos según la opción que elija el usuario. Escogí este camino porque los cuatro tipos de miembro son un conjunto fijo y conocido: nunca va a aparecer un quinto tipo, y los campos que piden no cambian. Tenerlos directamente en el HTML hace el archivo más fácil de leer, más fácil de validar con el W3C y más accesible.

En cambio, en el **formulario de informar actividad**, los bloques de "hora de inicio" y "hora de término" que aparecen por cada día marcado sí se construyen con JavaScript en el momento. La razón es que acá la cosa es mucho más variable: el usuario puede marcar cualquier combinación de días, desde uno hasta los siete. Si hubiera puesto los siete bloques en el HTML y los fuera ocultando, el archivo quedaría cargado de marcado innecesario incluso cuando la mayoría no se usa. Generarlos solo cuando el día se marca mantiene el formulario limpio y los datos bien ordenados.

La regla que apliqué fue: **si las opciones son pocas y se conocen de antemano, van en el HTML y solo se muestran/ocultan; si son combinaciones dinámicas que dependen de lo que elija el usuario, se generan desde JavaScript al momento**.

**Validaciones hechas en JavaScript.** El enunciado pide explícitamente que toda la validación esté en código propio, y no delegada a atributos del HTML como `required`. Por eso cada regla (formato de correo, largo mínimo y máximo de los textos, formato chileno del teléfono, tipos de archivo permitidos, etc.) está implementada en los archivos dentro de la carpeta `js/`. Cuando un campo no cumple la regla, se marca con borde rojo y aparece un mensaje explicativo debajo del campo.

**Tope de caracteres en campos opcionales.** Campos como "Descripción de la actividad" o "Área de investigación" no son obligatorios, pero decidí ponerles un tope (200 o 500 caracteres según el campo). La razón es evitar que alguien, por error o a propósito, pegue un texto arbitrariamente largo que rompa la presentación o el futuro almacenamiento.

**Gráficos sin librerías externas.** Los tres gráficos de la página de indicadores están hechos solo con HTML, CSS y un poco de JavaScript, sin usar bibliotecas como Chart.js o similares. La torta es un círculo coloreado por segmentos usando una funcionalidad moderna de CSS, el ranking son rectángulos con ancho proporcional al valor que representan, y el mapa de calor es una grilla de celdas donde el color se intensifica según la cantidad de actividades. La ventaja es que el proyecto queda liviano y sin dependencias de terceros.

## Validadores W3C

Los 5 archivos HTML pasan el validador oficial de HTML5 del W3C sin errores ni advertencias. El archivo CSS también pasa el validador sin errores; aparecen algunas advertencias sobre el uso de variables de color (del estilo `var(--color-primario)`), pero son solo informativas: el validador avisa que no las puede chequear de forma estática, no es un problema del código.

## Cómo probar

Basta con abrir `registro.html` en cualquier navegador moderno. Probado en Chrome y Safari, y en distintas resoluciones de pantalla gracias a la configuración de `viewport` en cada página.

