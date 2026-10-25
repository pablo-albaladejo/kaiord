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
  APP_ICONS,
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

test("every web app icon is committed at the size its name promises", async () => {
  for (const { out, size } of APP_ICONS) {
    const meta = await sharp(asset(out)).metadata();
    assert.equal(meta.width, size, `${out} width`);
    assert.equal(meta.height, size, `${out} height`);
  }
});

// The OS crops a maskable icon to its own shape; only the circle of radius
// 40% around the centre is guaranteed to survive, so the mark lives there and
// the background reaches every edge.
test("the maskable icon is full-bleed with its mark inside the safe zone", async () => {
  const { out, size } = APP_ICONS.find((icon) => icon.maskable);
  const { data, info } = await sharp(asset(out))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixel = (x, y) =>
    data.subarray((y * size + x) * 4, (y * size + x) * 4 + 4);
  const safeRadius = size * 0.4;
  let markPixels = 0;
  const outside = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, , , a] = pixel(x, y);
      assert.ok(a === 255, `transparent pixel at ${x},${y}`);
      if (r < 128) continue;
      markPixels++;
      const d = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2);
      if (d > safeRadius) outside.push(`${x},${y}`);
    }
  }

  assert.equal(info.width, size);
  assert.ok(markPixels > 0, "the mark rendered no pixels");
  assert.deepEqual(
    outside.slice(0, 5),
    [],
    "mark pixels outside the safe zone"
  );
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
