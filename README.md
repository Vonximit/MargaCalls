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

El motor transforma los llamados en una interfaz accesible, adaptable al móvil y segura por defecto. Desde v0.2 también puede conservar estado y reaccionar a eventos sin ejecutar texto arbitrario con `eval`.

## Estado y reacciones

```text
ESTADO(contador=0)

LLAMA TEXTO(
  contenido="Has llamado {{contador}} veces.",
  alineacion="centro"
)

LLAMA BOTON(
  id="sumar",
  texto="Llamar otra vez"
)

AL TOCAR "sumar" HAZ INCREMENTAR(
  estado="contador"
)
```

`{{contador}}` enlaza el contenido con el estado. Cuando se toca el componente identificado como `sumar`, MargaCalls actualiza el valor y vuelve a renderizar la interfaz.

Las acciones incorporadas son:

| Acción | Resultado | Argumentos |
| --- | --- | --- |
| `ASIGNAR` | Reemplaza un valor | `estado`, `valor` |
| `INCREMENTAR` | Suma una cantidad | `estado`, `valor` opcional (1 por defecto) |
| `DECREMENTAR` | Resta una cantidad | `estado`, `valor` opcional (1 por defecto) |
| `ALTERNAR` | Cambia verdadero/falso | `estado` |

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

## Componentes incluidos

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
- `MargaCalls.applyAction(estado, evento)` aplica una acción segura y devuelve un estado nuevo.

`mount()` conserva su retorno original: el elemento montado. En v0.2 ese elemento también expone un controlador en `elemento.margaCalls`:

```js
const elemento = MargaCalls.mount(pagina, "#app");

elemento.margaCalls.getState();
elemento.margaCalls.setState({ contador: 10 });
elemento.margaCalls.render();
```

`setState()` permite conectar datos externos sin abandonar el lenguaje declarativo.

## Seguridad de las reacciones

Los eventos solo pueden invocar las acciones incluidas en la biblioteca. MargaCalls no usa `eval`, `new Function` ni interpreta JavaScript entregado dentro del idioma. El contenido interpolado continúa pasando por el escape HTML de cada componente.

## Filosofía

MargaCalls separa **la cosa** de **sus variables**:

```text
HERO → estructura reutilizable
titulo, color, botón → variables de esta aparición
```

No pretende eliminar la programación. Pretende concentrarla: una capacidad se programa una vez y luego se invoca por su nombre.

## Ruta propuesta

- v0.1: componentes visuales y temas. ✅
- v0.2: eventos (`AL TOCAR ... HAZ ...`) y estado. ✅
- v0.3: datos, colecciones y condiciones.
- v1.0: editor visual y exportación de PWA.

## Licencia

MIT © 2026 Margaret (Vonximit)
