import { readFileSync } from "node:fs";

// The SPA's own locale files: verify-prod looks controls up by their Spanish
// text and checks surfaces for their English twins, so a renamed or reworded
// key moves the check with it instead of leaving a stale literal behind.
const LOCALES = new URL("../../src/i18n/locales/", import.meta.url);
const cache = new Map();

function resources(lang, ns) {
  const id = `${lang}/${ns}`;
  if (!cache.has(id)) {
    const file = new URL(`${id}.json`, LOCALES);
    cache.set(id, JSON.parse(readFileSync(file, "utf8")));
  }
  return cache.get(id);
}

function lookup(lang, ns, key) {
  const node = key
    .split(".")
    .reduce(
      (at, part) => (at == null ? undefined : at[part]),
      resources(lang, ns)
    );
  if (node === undefined) throw new Error(`Missing locale key ${ns}:${key}`);
  return node;
}

export function localeText(lang, ns, key) {
  const value = lookup(lang, ns, key);
  if (typeof value !== "string") throw new Error(`${ns}:${key} is not text`);
  return value;
}

const leaves = (node) =>
  typeof node === "string" ? [node] : Object.values(node).flatMap(leaves);

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Whole words only: "Sex" must not match "Sexo", nor "Edit" match "Editar".
const containsWords = (text, piece) =>
  new RegExp(`(^|[^\\p{L}])${escape(piece)}(?![\\p{L}])`, "u").test(text);

// The static English text under `prefix` (interpolations split out) that the
// Spanish locale does not also use, so finding it on an es-ES page is a leak.
export function englishPieces(ns, prefix) {
  const en = leaves(lookup("en", ns, prefix));
  const es = leaves(lookup("es", ns, prefix)).join("\n");
  return en
    .flatMap((text) => text.split(/\{\{[^}]+\}\}/))
    .map((piece) => piece.trim())
    .filter((piece) => /\p{L}{2,}/u.test(piece) && !containsWords(es, piece));
}

export function englishLeaks(copy, pieces) {
  return pieces.filter((piece) => containsWords(copy, piece));
}
