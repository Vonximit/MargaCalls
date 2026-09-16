import test from "node:test";
import assert from "node:assert/strict";
import MargaCalls, { parse, render } from "../src/margacalls.js";

test("analiza página, tema, listas y llamados multilínea", () => {
  const ast = parse(`
    PAGINA "Prueba"
    TEMA(acento="#ff00aa")
    LLAMA HERO(
      titulo="Hola",
      boton="Entrar"
    )
    FOOTER(texto="Fin", enlaces=["Inicio:#", "Web:https://example.com"])
  `);
  assert.equal(ast.title, "Prueba");
  assert.equal(ast.theme.acento, "#ff00aa");
  assert.equal(ast.calls.length, 2);
  assert.deepEqual(ast.calls[1].props.enlaces, ["Inicio:#", "Web:https://example.com"]);
});

test("renderiza componentes registrados", () => {
  const html = render('LLAMA HERO(titulo="Margaliquida", texto="Hola")');
  assert.match(html, /Margaliquida/);
  assert.match(html, /data-margacalls-version="0\.1\.0"/);
});

test("escapa HTML entregado por el usuario", () => {
  const html = render('TEXTO(contenido="<script>alert(1)</script>")');
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;/);
});

test("bloquea protocolos peligrosos", () => {
  const html = render('BOTON(texto="No", enlace="javascript:alert(1)")');
  assert.match(html, /href="#"/);
  assert.doesNotMatch(html, /javascript:/);
});

test("permite registrar un componente propio", () => {
  MargaCalls.register("SALUDO", ({ nombre }) => `<strong>${MargaCalls.escapeHTML(nombre)}</strong>`);
  assert.match(render('SALUDO(nombre="Margaret")'), /<strong>Margaret<\/strong>/);
});

test("informa la línea de un componente inexistente", () => {
  assert.throws(() => render("\n\nLLAMA DESCONOCIDO()"), /Línea 3/);
});
