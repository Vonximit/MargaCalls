# MargaCalls

**Programa una vez. Después, llama.**

MargaCalls es una biblioteca experimental en JavaScript para construir páginas web con un lenguaje declarativo en español. En lugar de repetir HTML, CSS y JavaScript, describes qué componentes necesitas:

```text
PAGINA "Mi primera página"

LLAMA HERO(
  titulo="Hola, mundo",
  texto="Esta interfaz nació desde un llamado.",
  boton="Entrar",
  enlace="#contenido"
)

LLAMA TEXTO(
  titulo="La idea",
  contenido="El componente es la cosa; sus argumentos son las variables."
)

LLAMA FOOTER(texto="Hecho con MargaCalls")
```

El motor transforma los llamados en una interfaz accesible, adaptable al móvil y segura por defecto.

## Probar la demostración

Necesitas un navegador y Python 3 —o cualquier servidor estático—:

```bash
git clone https://github.com/Vonximit/MargaCalls.git
cd MargaCalls
npm test
npm start
```

Abre `http://localhost:8080`.

## Uso en una página

```html
<div id="app"></div>

<script type="module">
  import MargaCalls from "./src/margacalls.js";

  const pagina = `
    PAGINA "Mi web"
    LLAMA HERO(titulo="Mi proyecto", boton="Conocer", enlace="#info")
    LLAMA FOOTER(texto="Mi proyecto 2026")
  `;

  MargaCalls.mount(pagina, "#app");
</script>
```

## Componentes incluidos en v0.1

| Llamado | Propósito | Argumentos principales |
| --- | --- | --- |
| `NAVBAR` | Navegación superior | `marca`, `enlaces` |
| `HERO` | Portada principal | `etiqueta`, `titulo`, `texto`, `boton`, `enlace` |
| `TEXTO` | Sección de contenido | `titulo`, `contenido`, `alineacion` |
| `BOTON` | Acción independiente | `texto`, `enlace`, `estilo` |
| `GALERIA` | Cuadrícula de imágenes | `titulo`, `imagenes` |
| `FORMULARIO` | Formulario visual | `titulo`, `campos`, `boton` |
| `FOOTER` | Pie de página | `texto`, `enlaces` |
| `TEMA` | Variables visuales | `fondo`, `superficie`, `texto`, `tenue`, `acento`, `acento2`, `radio`, `ancho` |

Los enlaces se expresan como `"Etiqueta:URL"`. Las imágenes usan `"URL|Texto alternativo"` y los campos `"Etiqueta:tipo:placeholder"`.

## Crear un llamado propio

```js
MargaCalls.register("TARJETA", ({ titulo, texto }, herramientas) => `
  <article class="mi-tarjeta">
    <h2>${herramientas.escapeHTML(titulo)}</h2>
    <p>${herramientas.escapeHTML(texto)}</p>
  </article>
`);
```

Después puedes usarlo dentro del idioma:

```text
LLAMA TARJETA(titulo="Una capacidad nueva", texto="Se programó una sola vez.")
```

## API

- `MargaCalls.parse(codigo)` convierte el idioma en un árbol de página.
- `MargaCalls.render(codigo)` devuelve el HTML completo como texto.
- `MargaCalls.mount(codigo, destino)` monta la página en el navegador.
- `MargaCalls.register(nombre, renderer)` agrega un componente reutilizable.
- `MargaCalls.escapeHTML(valor)` permite escapar contenido en extensiones.

## Filosofía

MargaCalls separa **la cosa** de **sus variables**:

```text
HERO → estructura reutilizable
titulo, color, botón → variables de esta aparición
```

No pretende eliminar la programación. Pretende concentrarla: una capacidad se programa una vez y luego se invoca por su nombre.

## Ruta propuesta

- v0.1: componentes visuales y temas.
- v0.2: eventos (`AL tocar ...`) y estado.
- v0.3: datos, colecciones y condiciones.
- v1.0: editor visual y exportación de PWA.

## Licencia

MIT © 2026 Margaret (Vonximit)
