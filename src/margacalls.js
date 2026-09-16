const VERSION = "0.1.0";

const DEFAULT_THEME = {
  fondo: "#080b14",
  superficie: "#111827",
  texto: "#f8fafc",
  tenue: "#a6b0c3",
  acento: "#a855f7",
  acento2: "#22d3ee",
  radio: "22px",
  ancho: "1120px",
};

const escapeHTML = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const safeURL = (value = "#") => {
  const url = String(value).trim();
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(url)) return escapeHTML(url);
  return "#";
};

function splitTopLevel(text, separator = ",") {
  const parts = [];
  let current = "";
  let quote = null;
  let depth = 0;
  let escaped = false;

  for (const char of text) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === "\\" && quote) {
      current += char;
      escaped = true;
      continue;
    }
    if (quote) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;
    if (char === separator && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function findAssignment(text) {
  let quote = null;
  let depth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === quote && text[index - 1] !== "\\") quote = null;
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === "[") depth += 1;
    else if (char === "]") depth -= 1;
    else if (char === "=" && depth === 0) return index;
  }
  return -1;
}

function parseValue(raw) {
  const value = raw.trim();
  if (!value.length) return "";
  if (value.startsWith("[") && value.endsWith("]")) {
    return splitTopLevel(value.slice(1, -1)).map(parseValue);
  }
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1).replace(/\\([\\"'])/g, "$1");
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (/^(verdadero|true)$/i.test(value)) return true;
  if (/^(falso|false)$/i.test(value)) return false;
  return value;
}

function parseArguments(raw, line) {
  const args = {};
  if (!raw.trim()) return args;
  for (const part of splitTopLevel(raw)) {
    const equalAt = findAssignment(part);
    if (equalAt < 1) {
      throw new SyntaxError(`Línea ${line}: se esperaba nombre=valor en «${part}».`);
    }
    const key = part.slice(0, equalAt).trim();
    if (!/^[\p{L}_][\p{L}\p{N}_-]*$/u.test(key)) {
      throw new SyntaxError(`Línea ${line}: «${key}» no es un argumento válido.`);
    }
    args[key] = parseValue(part.slice(equalAt + 1));
  }
  return args;
}

function collectStatements(source) {
  const statements = [];
  let current = "";
  let startLine = 1;
  let quote = null;
  let parentheses = 0;
  let brackets = 0;
  const lines = String(source).replace(/\r\n?/g, "\n").split("\n");

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("//")) return;
    if (!current) startLine = index + 1;
    current += `${current ? " " : ""}${line}`;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (quote) {
        if (char === quote && line[i - 1] !== "\\") quote = null;
      } else if (char === '"' || char === "'") quote = char;
      else if (char === "(") parentheses += 1;
      else if (char === ")") parentheses -= 1;
      else if (char === "[") brackets += 1;
      else if (char === "]") brackets -= 1;
    }

    if (!quote && parentheses === 0 && brackets === 0) {
      statements.push({ text: current, line: startLine });
      current = "";
    }
  });

  if (current) throw new SyntaxError(`Línea ${startLine}: llamado sin cerrar.`);
  return statements;
}

function parse(source) {
  const document = { title: "Mi página", theme: {}, calls: [] };
  for (const statement of collectStatements(source)) {
    const pageMatch = statement.text.match(/^PAGINA\s+(["'])(.*?)\1$/iu);
    if (pageMatch) {
      document.title = pageMatch[2];
      continue;
    }
    const callMatch = statement.text.match(/^(?:LLAMA\s+)?([\p{L}_][\p{L}\p{N}_-]*)\s*\((.*)\)$/iu);
    if (!callMatch) {
      throw new SyntaxError(`Línea ${statement.line}: no entiendo «${statement.text}».`);
    }
    const name = callMatch[1].toUpperCase();
    const props = parseArguments(callMatch[2], statement.line);
    if (name === "TEMA") document.theme = { ...document.theme, ...props };
    else document.calls.push({ name, props, line: statement.line });
  }
  return document;
}

function list(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

const components = new Map();

function register(name, renderer) {
  const normalized = String(name).toUpperCase();
  if (!/^[\p{L}_][\p{L}\p{N}_-]*$/u.test(normalized)) {
    throw new TypeError(`Nombre de componente inválido: ${name}`);
  }
  if (typeof renderer !== "function") throw new TypeError("El renderer debe ser una función.");
  components.set(normalized, renderer);
  return renderer;
}

register("NAVBAR", ({ marca = "MargaCalls", enlaces = [] }) => {
  const links = list(enlaces).map((item) => {
    const [label, ...urlParts] = String(item).split(":");
    return `<a href="${safeURL(urlParts.join(":") || "#")}">${escapeHTML(label)}</a>`;
  }).join("");
  return `<nav class="mc-navbar"><a class="mc-brand" href="#">${escapeHTML(marca)}</a><div class="mc-links">${links}</div></nav>`;
});

register("HERO", ({ etiqueta = "HECHO CON LLAMADOS", titulo = "Una página, menos código", texto = "Describe lo que necesitas y deja que la biblioteca construya la interfaz.", boton = "Comenzar", enlace = "#" }) => `
  <header class="mc-hero">
    <span class="mc-kicker">${escapeHTML(etiqueta)}</span>
    <h1>${escapeHTML(titulo)}</h1>
    <p>${escapeHTML(texto)}</p>
    ${boton ? `<a class="mc-button mc-primary" href="${safeURL(enlace)}">${escapeHTML(boton)}</a>` : ""}
  </header>`);

register("TEXTO", ({ titulo = "", contenido = "", alineacion = "izquierda" }) => `
  <section class="mc-section mc-text mc-${escapeHTML(alineacion)}">
    ${titulo ? `<h2>${escapeHTML(titulo)}</h2>` : ""}
    <p>${escapeHTML(contenido)}</p>
  </section>`);

register("BOTON", ({ texto = "Botón", enlace = "#", estilo = "primario" }) => `
  <div class="mc-action"><a class="mc-button mc-${escapeHTML(estilo)}" href="${safeURL(enlace)}">${escapeHTML(texto)}</a></div>`);

register("GALERIA", ({ titulo = "Galería", imagenes = [] }) => {
  const cards = list(imagenes).map((item, index) => {
    const [src, alt = `Imagen ${index + 1}`] = String(item).split("|");
    return `<figure><img src="${safeURL(src)}" alt="${escapeHTML(alt)}" loading="lazy"><figcaption>${escapeHTML(alt)}</figcaption></figure>`;
  }).join("");
  return `<section class="mc-section"><h2>${escapeHTML(titulo)}</h2><div class="mc-gallery">${cards}</div></section>`;
});

register("FORMULARIO", ({ titulo = "Escríbenos", campos = [], boton = "Enviar" }) => {
  const fields = list(campos).map((item, index) => {
    const [label, type = "text", placeholder = ""] = String(item).split(":");
    const allowedType = ["text", "email", "tel", "number", "date", "url"].includes(type) ? type : "text";
    const id = `mc-field-${index}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    return `<label for="${id}"><span>${escapeHTML(label)}</span><input id="${id}" name="${escapeHTML(label)}" type="${allowedType}" placeholder="${escapeHTML(placeholder)}"></label>`;
  }).join("");
  return `<section class="mc-section mc-form-wrap"><form class="mc-form" onsubmit="event.preventDefault()"><h2>${escapeHTML(titulo)}</h2>${fields}<button class="mc-button mc-primary" type="submit">${escapeHTML(boton)}</button></form></section>`;
});

register("FOOTER", ({ texto = "Creado con MargaCalls", enlaces = [] }) => {
  const links = list(enlaces).map((item) => {
    const [label, ...urlParts] = String(item).split(":");
    return `<a href="${safeURL(urlParts.join(":") || "#")}">${escapeHTML(label)}</a>`;
  }).join("");
  return `<footer class="mc-footer"><p>${escapeHTML(texto)}</p><div>${links}</div></footer>`;
});

function styles(theme = {}) {
  const t = { ...DEFAULT_THEME, ...theme };
  return `<style data-margacalls>
    :root{--mc-bg:${escapeHTML(t.fondo)};--mc-surface:${escapeHTML(t.superficie)};--mc-text:${escapeHTML(t.texto)};--mc-muted:${escapeHTML(t.tenue)};--mc-accent:${escapeHTML(t.acento)};--mc-accent-2:${escapeHTML(t.acento2)};--mc-radius:${escapeHTML(t.radio)};--mc-width:${escapeHTML(t.ancho)}}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--mc-bg);color:var(--mc-text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.6}.mc-page{min-height:100vh;background:radial-gradient(circle at 80% 0%,color-mix(in srgb,var(--mc-accent) 22%,transparent),transparent 34rem),var(--mc-bg)}.mc-navbar,.mc-section,.mc-hero,.mc-footer{width:min(calc(100% - 32px),var(--mc-width));margin-inline:auto}.mc-navbar{min-height:74px;display:flex;align-items:center;justify-content:space-between;gap:24px}.mc-brand{font-weight:900;font-size:1.15rem;color:var(--mc-text);text-decoration:none}.mc-links{display:flex;gap:20px;flex-wrap:wrap}.mc-links a,.mc-footer a{color:var(--mc-muted);text-decoration:none}.mc-links a:hover,.mc-footer a:hover{color:var(--mc-text)}.mc-hero{padding:clamp(70px,12vw,150px) 0;text-align:center}.mc-kicker{display:inline-block;padding:6px 12px;border:1px solid color-mix(in srgb,var(--mc-accent-2) 45%,transparent);border-radius:999px;color:var(--mc-accent-2);font-size:.76rem;font-weight:800;letter-spacing:.12em}.mc-hero h1{max-width:850px;margin:22px auto 18px;font-size:clamp(2.6rem,8vw,6.3rem);line-height:.96;letter-spacing:-.055em}.mc-hero p{max-width:680px;margin:0 auto 32px;color:var(--mc-muted);font-size:clamp(1rem,2vw,1.25rem)}.mc-button{display:inline-flex;justify-content:center;align-items:center;border:0;border-radius:999px;padding:13px 23px;font:inherit;font-weight:800;text-decoration:none;cursor:pointer}.mc-primary{color:white;background:linear-gradient(135deg,var(--mc-accent),var(--mc-accent-2));box-shadow:0 14px 40px color-mix(in srgb,var(--mc-accent) 24%,transparent)}.mc-secundario{color:var(--mc-text);background:var(--mc-surface);border:1px solid #ffffff1f}.mc-section{padding:70px 0}.mc-section h2{font-size:clamp(1.8rem,5vw,3.3rem);line-height:1.05;letter-spacing:-.035em;margin:0 0 18px}.mc-text p{max-width:760px;color:var(--mc-muted);font-size:1.1rem}.mc-centro{text-align:center}.mc-centro p{margin-inline:auto}.mc-action{text-align:center;padding:20px}.mc-gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.mc-gallery figure{margin:0;overflow:hidden;border:1px solid #ffffff17;border-radius:var(--mc-radius);background:var(--mc-surface)}.mc-gallery img{width:100%;aspect-ratio:4/3;display:block;object-fit:cover}.mc-gallery figcaption{padding:14px 16px;color:var(--mc-muted)}.mc-form-wrap{display:grid;place-items:center}.mc-form{width:min(100%,680px);display:grid;gap:18px;padding:clamp(24px,6vw,48px);border:1px solid #ffffff17;border-radius:var(--mc-radius);background:color-mix(in srgb,var(--mc-surface) 88%,transparent);box-shadow:0 30px 80px #0006}.mc-form label{display:grid;gap:7px;color:var(--mc-muted);font-weight:700}.mc-form input{width:100%;padding:13px 15px;border:1px solid #ffffff1f;border-radius:12px;background:#ffffff09;color:var(--mc-text);font:inherit;outline:none}.mc-form input:focus{border-color:var(--mc-accent-2);box-shadow:0 0 0 3px color-mix(in srgb,var(--mc-accent-2) 18%,transparent)}.mc-footer{display:flex;justify-content:space-between;gap:24px;padding:50px 0;border-top:1px solid #ffffff15;color:var(--mc-muted)}.mc-footer div{display:flex;gap:18px}@media(max-width:700px){.mc-navbar,.mc-footer{align-items:flex-start;flex-direction:column}.mc-gallery{grid-template-columns:1fr}.mc-hero{text-align:left}.mc-hero h1,.mc-hero p{margin-left:0}.mc-links{font-size:.9rem}}
  </style>`;
}

function render(sourceOrDocument) {
  const document = typeof sourceOrDocument === "string" ? parse(sourceOrDocument) : sourceOrDocument;
  const body = document.calls.map((call) => {
    const renderer = components.get(call.name);
    if (!renderer) throw new ReferenceError(`Línea ${call.line}: el componente ${call.name} no existe.`);
    return renderer(call.props, { escapeHTML, safeURL });
  }).join("\n");
  return `${styles(document.theme)}<main class="mc-page" data-margacalls-version="${VERSION}">${body}</main>`;
}

function mount(source, target = "#app") {
  if (typeof document === "undefined") throw new Error("mount() necesita un navegador. Usa render() en Node.js.");
  const element = typeof target === "string" ? document.querySelector(target) : target;
  if (!element) throw new Error(`No se encontró el destino ${target}.`);
  const ast = parse(source);
  document.title = ast.title;
  element.innerHTML = render(ast);
  return element;
}

const MargaCalls = { VERSION, parse, render, mount, register, escapeHTML };
export { VERSION, parse, render, mount, register, escapeHTML };
export default MargaCalls;
