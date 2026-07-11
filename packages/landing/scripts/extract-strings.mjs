// Extracts the translatable English copy from index.html into
// i18n/en-strings.json. This inventory is the parity source: every string here
// must have a Spanish translation in i18n/es.json. Run it whenever the source
// copy changes. Deterministic and idempotent.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { HTMLElement, parse, TextNode } from "node-html-parser";

const here = dirname(fileURLToPath(import.meta.url));
const landingRoot = resolve(here, "..");
const SOURCE = resolve(landingRoot, "index.html");
const OUTPUT = resolve(landingRoot, "i18n/en-strings.json");

// Subtrees whose text is code, markup, brand marks or vector art — never copy.
export const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "PRE",
  "CODE",
  "SVG",
  "NOSCRIPT",
  "TEMPLATE",
  "HEAD",
  "TITLE",
]);

// Attributes that carry visible/assistive copy.
export const TRANSLATABLE_ATTRS = ["aria-label", "title", "alt"];

// Collapse internal whitespace so the key is stable regardless of HTML
// indentation. Both extraction and locale build use this identical shape.
export const normalize = (text) => text.replace(/\s+/g, " ").trim();

const hasLetter = (text) => /\p{L}/u.test(text);

// Standalone tokens that are brand names, format labels, code, acronyms or
// stats — excluded from the inventory and left untranslated in every locale.
const EXCLUDE = new Set([
  // Format labels
  ".FIT",
  ".TCX",
  ".ZWO",
  ".GCN",
  "KRD",
  // Brand / proper nouns
  "Garmin",
  "WHOOP",
  "Train2Go",
  "kaiord",
  "GitHub",
  "Pablo Albaladejo",
  "Cloudflare Web Analytics",
  // Acronyms kept in English
  "AI",
  "TS",
  "CLI",
  "MCP",
  // Package managers / code snippets
  "npm",
  "pnpm",
  "yarn",
  "bun",
  "npm i @kaiord/core",
  "convert.ts",
  "<!doctype html>",
  // Numeric / jargon stat labels
  "MIT",
  "78 TSS",
  "1h 05m",
  "Sweet Spot 3×12",
]);

// A normalized string is translatable copy when it is more than a single
// glyph, contains at least one letter, and is not an excluded token.
export const isTranslatable = (text) =>
  text.length > 1 && hasLetter(text) && !EXCLUDE.has(text);

const isSkipped = (node) => {
  let parent = node.parentNode;
  while (parent) {
    const tag = (parent.rawTagName || "").toUpperCase();
    if (SKIP_TAGS.has(tag)) return true;
    parent = parent.parentNode;
  }
  return false;
};

/**
 * Walk a parsed DOM, invoking `visit({ value, apply })` for every translatable
 * text node and whitelisted attribute. `apply(next)` writes a replacement back
 * onto the source node (used by the locale build; ignored during extraction).
 */
export const walkTranslatable = (root, visit) => {
  const step = (node) => {
    if (node instanceof TextNode) {
      if (!isSkipped(node)) {
        const value = normalize(node.text);
        if (value) {
          visit({
            value,
            apply: (next) => {
              const raw = node.rawText;
              const lead = raw.match(/^\s*/)[0];
              const trail = raw.match(/\s*$/)[0];
              node.rawText = lead + encodeText(next) + trail;
            },
          });
        }
      }
      return;
    }
    if (node instanceof HTMLElement) {
      const tag = (node.rawTagName || "").toUpperCase();
      if (!SKIP_TAGS.has(tag) && !isSkipped(node)) {
        for (const attr of TRANSLATABLE_ATTRS) {
          const raw = node.getAttribute(attr);
          if (raw) {
            const value = normalize(raw);
            if (value) {
              visit({ value, apply: (next) => node.setAttribute(attr, next) });
            }
          }
        }
      }
    }
    for (const child of node.childNodes || []) step(child);
  };
  step(root);
};

// Only `&`, `<` and `>` need escaping inside text content; accented es-ES
// characters are valid UTF-8 and pass through untouched.
export const encodeText = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// blockTextElements MUST stay limited to script/style: registering pre/code
// (or noscript) makes node-html-parser drop the <body> element of this
// document — its children get reparented and the serialized page loses the
// body tag and every class on it (page background, text color, font).
// Translation safety for pre/code/noscript is already enforced by SKIP_TAGS.
export const parseHtml = (html) =>
  parse(html, {
    comment: true,
    blockTextElements: {
      script: true,
      style: true,
    },
  });

const main = () => {
  const html = readFileSync(SOURCE, "utf8");
  const root = parseHtml(html);
  const strings = new Set();
  walkTranslatable(root, ({ value }) => {
    if (isTranslatable(value)) strings.add(value);
  });
  const inventory = [...strings].sort((a, b) => a.localeCompare(b, "en"));
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
  console.log(`extract-strings: ${inventory.length} strings -> ${OUTPUT}`);
};

// Run extraction only when invoked directly; stay a pure module when imported
// by build-locales.mjs.
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
