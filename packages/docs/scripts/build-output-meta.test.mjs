// End-to-end assertion: after `pnpm build`, the rendered `/docs/index.html`
// contains the `<meta name="theme-color">` tag with the exact value parsed
// from the shared `--brand-bg-primary` token.
//
// Skipped when `dist/` does not exist (local runs without a prior build).
// CI runs `pnpm -r build` before `pnpm lint` (via lint:specs), so this
// fires post-build and catches divergence in the rendered artifact — not
// just the config shape.

import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { readBrandTokenColor } from "../.vitepress/brand-tokens.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX_HTML = resolve(__dirname, "..", ".vitepress", "dist", "index.html");

test(
  "rendered index.html contains theme-color meta with the token value",
  { skip: !existsSync(INDEX_HTML) && "dist/ not built" },
  () => {
    const html = readFileSync(INDEX_HTML, "utf8");
    const expected = readBrandTokenColor("--brand-bg-primary");

    const match = html.match(
      /<meta\s+name="theme-color"\s+content="([^"]+)"\s*\/?>/i
    );

    assert.ok(match, `theme-color meta not found in rendered index.html`);
    assert.equal(
      match[1],
      expected,
      `theme-color in rendered HTML (${match[1]}) does not match --brand-bg-primary (${expected})`
    );
  }
);
