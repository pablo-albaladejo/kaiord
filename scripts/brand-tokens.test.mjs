// Pins the Node-side token resolver: role tokens are `var()` chains into
// oklch ramps, and every consumer downstream (theme-color meta, OG cards,
// popup palette parity) needs a literal sRGB colour instead.

import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  BRAND_TOKENS_PATH,
  oklchToHex,
  readBrandTokenColor,
} from "./brand-tokens.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const withTokens = (css, run) => {
  const dir = mkdtempSync(join(tmpdir(), "brand-tokens-"));
  const path = join(dir, "brand.css");
  writeFileSync(path, css);
  try {
    run(path);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test("canonical path points to repo-root styles/brand-tokens.css", () => {
  assert.match(BRAND_TOKENS_PATH, /styles\/brand-tokens\.css$/);
});

test("resolves a role through its ramp to an sRGB hex", () => {
  assert.equal(readBrandTokenColor("--bg-page"), "#0d0d0d");
  assert.equal(readBrandTokenColor("--text"), "#ffffff");
});

test("reads the dark block, not the light one", () => {
  // --bg-page is n-50 on :root and n-1200 under .dark.
  assert.notEqual(readBrandTokenColor("--bg-page"), "#f7f7f7");
});

test("falls back to the whole file for theme-invariant tokens", () => {
  assert.match(readBrandTokenColor("--font-sans"), /^Inter,/);
});

test("the marketing roles resolve to the magenta baked into the mark", () => {
  // assets/favicon.svg carries #d061e9 as a literal; it must stay the same
  // colour the landing renders from the token.
  assert.equal(readBrandTokenColor("--mkt-cta"), "#d061e9");
});

test("the light theme is read from :root, not from .dark", () => {
  assert.equal(
    readBrandTokenColor("--text", BRAND_TOKENS_PATH, "light"),
    "#303030"
  );
  assert.equal(
    readBrandTokenColor("--bg-page", BRAND_TOKENS_PATH, "light"),
    "#f7f7f7"
  );
});

// The two hand-written index.html files cannot use var() in a meta tag, so
// their hex is the one place the palette is transcribed by hand. The docs
// surface derives its own through buildStaticHead().
test("every static theme-color tag equals the resolved page background", () => {
  const expected = readBrandTokenColor("--bg-page");

  for (const html of [
    "packages/landing/index.html",
    "packages/workout-spa-editor/index.html",
  ]) {
    const source = readFileSync(join(REPO, html), "utf8");
    const match = source.match(/name="theme-color"\s+content="([^"]+)"/);
    assert.ok(match, `${html} has no theme-color meta tag`);
    assert.equal(match[1], expected, html);
  }
});

test("oklch conversion: achromatic extremes", () => {
  assert.equal(oklchToHex(1, 0, 0), "#ffffff");
  assert.equal(oklchToHex(0, 0, 0), "#000000");
});

test("oklch conversion: out-of-gamut chroma clamps rather than wrapping", () => {
  assert.match(oklchToHex(0.6, 0.4, 25), /^#[0-9a-f]{6}$/);
});

test("percentage lightness is accepted", () => {
  withTokens(":root { --demo: oklch(100% 0 0); }\n", (path) => {
    assert.equal(readBrandTokenColor("--demo", path), "#ffffff");
  });
});

test("a hex literal passes through untouched", () => {
  withTokens(":root { --demo: #123456; }\n", (path) => {
    assert.equal(readBrandTokenColor("--demo", path), "#123456");
  });
});

test("throws when the token is missing", () => {
  assert.throws(
    () => readBrandTokenColor("--not-a-real-token"),
    /--not-a-real-token not found/
  );
});

test("throws naming the missing link when a chain dangles", () => {
  withTokens(":root { --demo: var(--gone); }\n", (path) => {
    assert.throws(
      () => readBrandTokenColor("--demo", path),
      /token --gone not found/
    );
  });
});

test("throws instead of hanging on a var() cycle", () => {
  withTokens(":root { --a: var(--b); --b: var(--a); }\n", (path) => {
    assert.throws(() => readBrandTokenColor("--a", path), /var\(\) cycle/);
  });
});

test("throws when the name is not a CSS custom property", () => {
  assert.throws(() => readBrandTokenColor("bg-page"), /must start with "--"/);
});
