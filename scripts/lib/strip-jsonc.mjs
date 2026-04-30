/**
 * Strip TypeScript's allowed JSON-with-comments noise so `JSON.parse`
 * succeeds. tsconfig.json allows `//` and `/* * /` comments and trailing
 * commas. The naive regex pass treats `/*` inside a string literal
 * (e.g. `"@/*"`) as a block-comment opener, so this implementation
 * walks the source character-by-character and only treats comment
 * markers seen outside strings as comments.
 */

export function stripJsonc(source) {
  let out = "";
  let i = 0;
  let inString = false;
  let stringChar = "";
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (inString) {
      out += ch;
      if (ch === "\\" && i + 1 < source.length) {
        out += next;
        i += 2;
        continue;
      }
      if (ch === stringChar) inString = false;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (
        i < source.length &&
        !(source[i] === "*" && source[i + 1] === "/")
      ) {
        i += 1;
      }
      i += 2; // skip closing */
      continue;
    }
    out += ch;
    i += 1;
  }
  return out.replace(/,(\s*[}\]])/g, "$1");
}
