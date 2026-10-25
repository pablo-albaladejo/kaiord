// Installability guard over the built SPA: the HTML links the web app
// manifest under the build base, the manifest is scoped to /app/ (where the
// deploy serves the SPA), and every icon it names exists at its stated size.
//
// Reads the build, so it skips unless REQUIRE_SPA_DIST=1 (set in the CI
// `build` job and in deploy): a stale local dist would otherwise fail
// `pnpm test:scripts` for reasons unrelated to the change. SPA_DIST and
// SPA_BASE point it at another tree, e.g. the merged deploy's `app/`.

import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { pngSize } from "./png-size.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(process.env.SPA_DIST ?? join(__dirname, "..", "dist"));
const BASE = process.env.SPA_BASE ?? "/";
const APP_PATH = "/app/";
const skip =
  process.env.REQUIRE_SPA_DIST !== "1" &&
  "reads the SPA build (set REQUIRE_SPA_DIST=1 after building it)";

const readManifest = () =>
  JSON.parse(readFileSync(join(DIST, "manifest.webmanifest"), "utf8"));

test("the SPA's HTML links the manifest under the build base", { skip }, () => {
  const html = readFileSync(join(DIST, "index.html"), "utf8");
  const links = [...html.matchAll(/<link\b[^>]*\brel="manifest"[^>]*>/g)];

  assert.equal(links.length, 1, "exactly one manifest link");
  const href = links[0][0].match(/\bhref="([^"]+)"/)?.[1];
  assert.equal(href, `${BASE}manifest.webmanifest`);
});

test("the manifest installs a standalone app scoped to /app/", { skip }, () => {
  const manifest = readManifest();

  assert.equal(manifest.id, APP_PATH);
  assert.equal(manifest.start_url, APP_PATH);
  assert.equal(manifest.scope, APP_PATH);
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.name, "Kaiord");
  assert.equal(manifest.short_name, "Kaiord");
});

test("the manifest colours match the theme-color meta tag", { skip }, () => {
  const html = readFileSync(join(DIST, "index.html"), "utf8");
  const themeColor = html.match(
    /<meta\s+name="theme-color"\s+content="([^"]+)"/
  )?.[1];
  const manifest = readManifest();

  assert.ok(themeColor, "index.html has a theme-color meta tag");
  assert.equal(manifest.theme_color, themeColor);
  assert.equal(manifest.background_color, themeColor);
});

test("every manifest icon exists at its stated size", { skip }, () => {
  const { icons } = readManifest();
  const found = icons.map(({ src, sizes, purpose = "any" }) => {
    assert.doesNotMatch(src, /^\//, `${src} must be relative to the manifest`);
    const path = join(DIST, src);
    assert.ok(existsSync(path), `${src} is missing from the dist`);
    const { width, height } = pngSize(readFileSync(path));
    assert.equal(`${width}x${height}`, sizes, `${src} pixel size`);
    return `${sizes} ${purpose}`;
  });

  for (const required of ["192x192 any", "512x512 any", "512x512 maskable"]) {
    assert.ok(found.includes(required), `missing a ${required} icon`);
  }
});
