// The root 404 (`packages/landing/public/404.html`) is what GitHub Pages
// serves for EVERY missing URL — Pages supports exactly one 404 document, so
// deep links into /docs/ and /editor/ land here too, not on the docs theme's
// NotFound.vue (that component only renders on client-side navigation).
//
// The page is a self-contained static file: it cannot read
// `styles/brand-tokens.css` at runtime, so its colors are literals. Literals
// rot — this page shipped the retired palette for a full rebrand cycle
// because nothing tied it to the token file. This suite is that tie: every
// hex the file uses MUST equal a resolved dark-theme role, and any hex
// outside the mapping is a failure by construction.

import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { readBrandTokenColor } from "./brand-tokens.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_PATH = resolve(__dirname, "..", "packages/landing/public/404.html");

// The page is pinned dark, like the landing: it has no theme toggle and no
// stylesheet to resolve one, so it renders the default theme's roles.
const ROLES = [
  "--bg-page",
  "--text",
  "--text-secondary",
  "--border",
  "--control",
  "--control-ink",
];

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;

test("every hex in the root 404 is a resolved dark-theme role", () => {
  const page = readFileSync(PAGE_PATH, "utf8");
  const allowed = new Map(
    ROLES.map((role) => [readBrandTokenColor(role).toLowerCase(), role])
  );

  const offenders = [];
  for (const match of page.matchAll(HEX_RE)) {
    const hex = match[0].toLowerCase();
    if (!allowed.has(hex)) {
      const line = page.slice(0, match.index).split("\n").length;
      offenders.push(`404.html:${line} ${match[0]}`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Root 404 uses hexes that resolve to no dark-theme role. ` +
      `Repaint from styles/brand-tokens.css (roles: ${ROLES.join(", ")}):\n` +
      offenders.map((o) => `  - ${o}`).join("\n")
  );
});

test("the root 404 theme-color equals the dark page background", () => {
  const page = readFileSync(PAGE_PATH, "utf8");
  const match = page.match(/<meta\s+name="theme-color"\s+content="([^"]+)"/i);

  assert.ok(match, "root 404 is missing its theme-color meta tag");
  assert.equal(match[1].toLowerCase(), readBrandTokenColor("--bg-page"));
});

test("the root 404 carries no weight above 600", () => {
  const page = readFileSync(PAGE_PATH, "utf8");
  const heavy = [...page.matchAll(/font-weight:\s*([7-9]\d\d)/g)].map(
    (m) => m[1]
  );

  assert.deepEqual(heavy, [], "the type scale caps at 600");
});
