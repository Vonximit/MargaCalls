import test from "node:test";
import assert from "node:assert/strict";
import MargaCalls, { applyAction, parse, render } from "../src/margacalls.js";

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
  assert.match(html, /data-margacalls-version="0\.2\.0"/);
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

test("analiza estado y eventos declarativos", () => {
  const ast = parse(`
    ESTADO(contador=0, activo=falso)
    LLAMA BOTON(id="sumar", texto="Sumar")
    AL TOCAR "sumar" HAZ INCREMENTAR(estado="contador", valor=2)
  `);

  assert.deepEqual(ast.state, { contador: 0, activo: false });
  assert.equal(ast.events.length, 1);
  assert.deepEqual(ast.events[0], {
    type: "click",
    target: "sumar",
    action: "INCREMENTAR",
    props: { estado: "contador", valor: 2 },
    line: 4,
  });
});

test("interpola estado y marca el destino del evento", () => {
  const html = render(`
    ESTADO(contador=3)
    LLAMA TEXTO(id="resultado", contenido="Llamados: {{contador}}")
  `);

  assert.match(html, /data-mc-id="resultado"/);
  assert.match(html, /Llamados: 3/);
});

test("aplica acciones sin mutar el estado anterior", () => {
  const initial = { contador: 4 };
  const next = applyAction(initial, {
    action: "INCREMENTAR",
    props: { estado: "contador", valor: 2 },
    line: 1,
  });

  assert.deepEqual(initial, { contador: 4 });
  assert.deepEqual(next, { contador: 6 });
});

test("incluye asignar, decrementar y alternar", () => {
  const assigned = applyAction({ mensaje: "A" }, {
    action: "ASIGNAR",
    props: { estado: "mensaje", valor: "B" },
    line: 1,
  });
  const decremented = applyAction({ contador: 3 }, {
    action: "DECREMENTAR",
    props: { estado: "contador" },
    line: 2,
  });
  const toggled = applyAction({ visible: false }, {
    action: "ALTERNAR",
    props: { estado: "visible" },
    line: 3,
  });

  assert.equal(assigned.mensaje, "B");
  assert.equal(decremented.contador, 2);
  assert.equal(toggled.visible, true);
});

test("rechaza referencias y acciones desconocidas", () => {
  assert.throws(
    () => render('TEXTO(contenido="{{fantasma}}")'),
    /el estado fantasma no existe/,
  );
  assert.throws(
    () => applyAction(
      { contador: 0 },
      { action: "EJECUTAR", props: { estado: "contador" }, line: 8 },
    ),
    /Línea 8: la acción EJECUTAR no existe/,
  );
  assert.throws(
    () => applyAction(
      { mensaje: "A" },
      { action: "ASIGNAR", props: { estado: "mensaje" }, line: 9 },
    ),
    /Línea 9: ASIGNAR necesita el argumento valor/,
  );
});
