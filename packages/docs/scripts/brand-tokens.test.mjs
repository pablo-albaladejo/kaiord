// Verifies that `readBrandTokenColor` parses the shared brand-tokens file
// and returns the expected CSS variable value. The VitePress config uses
// this helper to wire `<meta name="theme-color">` from the token, so the
// test pins the parity between the docs head tag and the source of truth.

import { strict as assert } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  BRAND_TOKENS_PATH,
  readBrandTokenColor,
} from "../.vitepress/brand-tokens.mjs";

test("reads --brand-bg-primary from the shared tokens file", () => {
  const value = readBrandTokenColor("--brand-bg-primary");

  assert.equal(value, "#0f172a");
});

test("reads --brand-text-primary from the shared tokens file", () => {
  const value = readBrandTokenColor("--brand-text-primary");

  assert.equal(value, "#f8fafc");
});

test("throws when the token is missing", () => {
  assert.throws(
    () => readBrandTokenColor("--brand-does-not-exist"),
    /--brand-does-not-exist not found/
  );
});

test("throws when the name is not a CSS custom property", () => {
  assert.throws(
    () => readBrandTokenColor("brand-bg-primary"),
    /must start with "--"/
  );
});

test("reads from an override path (unit-testable isolation)", () => {
  const dir = mkdtempSync(join(tmpdir(), "brand-tokens-"));
  const p = join(dir, "brand.css");
  writeFileSync(p, ":root { --demo: #123456; }\n");

  try {
    assert.equal(readBrandTokenColor("--demo", p), "#123456");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("canonical path points to repo-root styles/brand-tokens.css", () => {
  assert.match(BRAND_TOKENS_PATH, /styles\/brand-tokens\.css$/);
});
