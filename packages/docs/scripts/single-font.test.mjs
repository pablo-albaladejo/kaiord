// The docs ship exactly one font file: the brand Inter, self-hosted.
//
// Production once preloaded `/docs/fonts/inter-var-latin.woff2`, a 404,
// and then fell back to the 16 Inter subsets that `vitepress/theme`
// bundles. Nothing noticed: the preload and the `@font-face` both named a
// file nobody put in the build. This guard checks each link in that chain:
// - source: the theme extends `vitepress/theme-without-fonts`, and the
//   `head-config.mjs` preload and the `custom.css` `@font-face` name the
//   same file;
// - build (REQUIRE_DOCS_DIST=1, set in the CI `build` job and in deploy):
//   that file exists in `.vitepress/dist`, it is the only `.woff2` there,
//   and its bytes are the canonical `styles/fonts/inter-var-latin.woff2`.

import { strict as assert } from "node:assert";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { buildStaticHead } from "../.vitepress/head-config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(__dirname, "..");
const DIST = join(DOCS, ".vitepress", "dist");
const CANONICAL = resolve(
  DOCS,
  "..",
  "..",
  "styles",
  "fonts",
  "inter-var-latin.woff2"
);
const DOCS_BASE = "/docs/";
const skip =
  process.env.REQUIRE_DOCS_DIST !== "1" &&
  "reads the docs build (set REQUIRE_DOCS_DIST=1 after building it)";

/** Strip the `/docs/` base: the path the file has inside the dist. */
function inDist(url) {
  assert.ok(url.startsWith(DOCS_BASE), `${url} is not under ${DOCS_BASE}`);
  return url.slice(DOCS_BASE.length);
}

function preloadHref() {
  const head = buildStaticHead({ docsBase: DOCS_BASE, ogImage: "x" });
  const fonts = head.filter(
    ([tag, a]) => tag === "link" && a.rel === "preload" && a.as === "font"
  );
  assert.equal(fonts.length, 1, "expected exactly one font preload");
  return fonts[0][1].href;
}

function fontFaceSrc() {
  const css = readFileSync(
    join(DOCS, ".vitepress", "theme", "custom.css"),
    "utf8"
  );
  const srcs = [...css.matchAll(/src:\s*url\("?([^")]+)"?\)/g)].map(
    (m) => m[1]
  );
  assert.equal(
    srcs.length,
    1,
    "expected exactly one @font-face src in custom.css"
  );
  return srcs[0];
}

function woff2Files(root, dir = root) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return woff2Files(root, full);
    return entry.name.endsWith(".woff2") ? [relative(root, full)] : [];
  });
}

/** Theme sources and markdown pages: any of them can import the theme. */
function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (["node_modules", "dist", "cache", "api"].includes(entry.name))
      return [];
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(md|vue|ts|mts|js|mjs)$/.test(entry.name) ? [full] : [];
  });
}

test("no page or theme file imports the VitePress bundled fonts", () => {
  // A single `from "vitepress/theme"` anywhere (index.md did) pulls in the
  // 16 bundled Inter subsets, whatever theme/index.ts extends.
  // Bare (`import "vitepress/theme"`) and dynamic (`import("vitepress/theme")`)
  // imports pull in the bundled fonts too, not just `from "vitepress/theme"`.
  // The quoted literal alone is enough: "vitepress/theme-without-fonts" has
  // extra characters before its closing quote, so it never matches.
  const self = fileURLToPath(import.meta.url);
  const offenders = sourceFiles(DOCS).filter(
    (file) =>
      file !== self &&
      /["']vitepress\/theme["']/.test(readFileSync(file, "utf8"))
  );
  assert.deepEqual(
    offenders.map((file) => relative(DOCS, file)),
    []
  );
  const theme = readFileSync(
    join(DOCS, ".vitepress", "theme", "index.ts"),
    "utf8"
  );
  assert.match(theme, /from\s+["']vitepress\/theme-without-fonts["']/);
});

test("the bundled-theme pattern catches bare and dynamic imports too", () => {
  const pattern = /["']vitepress\/theme["']/;
  assert.match('import "vitepress/theme";', pattern);
  assert.match('await import("vitepress/theme")', pattern);
  assert.match("import DefaultTheme from 'vitepress/theme';", pattern);
  assert.doesNotMatch(
    'import Theme from "vitepress/theme-without-fonts";',
    pattern
  );
});

test("the font preload and the @font-face src name the same file", () => {
  assert.equal(inDist(preloadHref()), inDist(fontFaceSrc()));
});

test("the preloaded font exists in the docs build", { skip }, () => {
  const path = inDist(preloadHref());
  assert.ok(
    existsSync(join(DIST, path)),
    `${path} is missing from ${DIST}: the preload is a 404`
  );
});

test(
  "the docs build ships exactly one .woff2, the canonical Inter",
  { skip },
  () => {
    const files = woff2Files(DIST);
    assert.deepEqual(
      files,
      [inDist(preloadHref())],
      `expected one font, found ${files.length}: ${files.join(", ")}`
    );
    assert.ok(
      readFileSync(join(DIST, files[0])).equals(readFileSync(CANONICAL)),
      "the shipped font differs from styles/fonts/inter-var-latin.woff2"
    );
  }
);
