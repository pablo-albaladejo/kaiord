// Synchronously reads a CSS variable from the shared brand tokens file.
// Used at VitePress config load time to wire the <meta name="theme-color">
// value from the same source of truth as the landing page and editor.

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

export function readBrandTokenColor(name, tokensPath = BRAND_TOKENS_PATH) {
  if (!name.startsWith("--")) {
    throw new Error(
      `readBrandTokenColor: token name must start with "--"; got ${name}`
    );
  }

  const source = readFileSync(tokensPath, "utf8");
  const pattern = new RegExp(
    `${name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*:\\s*([^;]+?)\\s*(?:;|\\n)`
  );
  const match = source.match(pattern);

  if (!match) {
    throw new Error(
      `readBrandTokenColor: token ${name} not found in ${tokensPath}`
    );
  }

  return match[1].trim();
}
