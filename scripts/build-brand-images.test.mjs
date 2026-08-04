// The brand rasters are generated, so the thing worth pinning is not how they
// render but that the committed files still agree with their masters: each
// package's public/ copy is a hand-maintained duplicate, and a duplicate that
// nobody checks is a duplicate that drifts.

import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import sharp from "sharp";

import {
  FAVICON_RASTERS,
  LANDING_SUBTITLE,
  MIRRORS,
  REPO_ROOT,
} from "./build-brand-images.mjs";

const asset = (name) => join(REPO_ROOT, "assets", name);
const digest = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

test("every mirrored public/ copy is byte-identical to its assets master", () => {
  const drifted = [];
  for (const [dir, files] of Object.entries(MIRRORS)) {
    for (const file of files) {
      const copy = join(REPO_ROOT, dir, file);
      assert.ok(existsSync(copy), `${dir}/${file} is missing`);
      if (digest(copy) !== digest(asset(file))) drifted.push(`${dir}/${file}`);
    }
  }

  assert.deepEqual(drifted, [], "run `pnpm brand:images` to re-mirror");
});

test("every favicon raster is committed at the size its name promises", async () => {
  for (const { out, size } of FAVICON_RASTERS) {
    const meta = await sharp(asset(out)).metadata();
    assert.equal(meta.width, size, `${out} width`);
    assert.equal(meta.height, size, `${out} height`);
  }
});

test("apple-touch-icon is the 180px iOS size", async () => {
  const meta = await sharp(asset("apple-touch-icon.png")).metadata();

  assert.equal(meta.width, 180);
  assert.equal(meta.height, 180);
});

test("the Open Graph raster keeps the 1200x630 aspect", async () => {
  const meta = await sharp(asset("og-image.png")).metadata();

  assert.equal(meta.width, 1200);
  assert.equal(meta.height, 630);
});

test("the favicon master is the magenta mark, not the retired blue hub", () => {
  const svg = readFileSync(asset("favicon.svg"), "utf8");

  assert.match(svg, /#d061e9/i);
  assert.doesNotMatch(svg, /#0284c7/i);
  assert.doesNotMatch(svg, /M20 0L37\.32 10/);
});

test("the inlined marks carry no baked colour", () => {
  for (const name of ["mark.svg", "mark-core-live.svg"]) {
    const svg = readFileSync(asset(name), "utf8");
    assert.deepEqual(svg.match(/#[0-9a-fA-F]{3,8}/g), null, name);
  }
});

test("the core-live mark defers to the token with an ink fallback", () => {
  const svg = readFileSync(asset("mark-core-live.svg"), "utf8");

  assert.match(svg, /fill="var\(--core-live, currentColor\)"/);
});

test("the landing card names the product, not a placeholder", () => {
  assert.match(LANDING_SUBTITLE, /fitness format/);
});
