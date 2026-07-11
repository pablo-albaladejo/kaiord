// Synchronously reads a CSS variable from the shared brand tokens file.
// Used at VitePress config load time to wire the <meta name="theme-color">
// value from the same source of truth as the landing page and editor.
//
// Tokens resolve AS UNDER `.dark`: the brand identity consumed here
// (theme-color meta, OG cards) is the dark palette. Themed tokens are
// overridden in the `.dark { … }` block, while theme-invariant tokens
// (fonts, zones) exist only on `:root` — so the dark block is searched
// first with the full file as fallback.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const BRAND_TOKENS_PATH = resolve(
  __dirname,
  "..",
  "..",
  "..",
  "styles",
  "brand-tokens.css"
);

function matchToken(source, name) {
  const pattern = new RegExp(
    `${name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*:\\s*([^;]+?)\\s*(?:;|\\n)`
  );
  return source.match(pattern)?.[1].trim();
}

function extractDarkBlock(source) {
  const match = source.match(/\.dark\s*\{([^}]*)\}/);
  return match?.[1] ?? "";
}

export function readBrandTokenColor(name, tokensPath = BRAND_TOKENS_PATH) {
  if (!name.startsWith("--")) {
    throw new Error(
      `readBrandTokenColor: token name must start with "--"; got ${name}`
    );
  }

  const source = readFileSync(tokensPath, "utf8");
  const value =
    matchToken(extractDarkBlock(source), name) ?? matchToken(source, name);

  if (!value) {
    throw new Error(
      `readBrandTokenColor: token ${name} not found in ${tokensPath}`
    );
  }

  return value;
}
