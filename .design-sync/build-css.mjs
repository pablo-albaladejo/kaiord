// Compiles the SPA's stylesheet for the design-sync bundle.
//
// The converter picks up component CSS from side-effect imports in the JS it
// bundles. This design system's real styling is not there: it is Tailwind v4,
// compiled from `src/index.css` (which pulls in `styles/brand-tokens.css`), and
// esbuild ships none of it. What DID land in `_ds_bundle.css` was 2.1 KB of
// uplot chart CSS — over the converter's 500-byte "placeholder" threshold, so
// its storybook-CSS scrape never fired and every preview would have rendered
// unstyled.
//
// This runs the repo's OWN postcss pipeline (`postcss.config.js`, i.e.
// `@tailwindcss/postcss`) so the output is the same CSS the SPA ships, at a
// stable path `cfg.cssEntry` can point at. The storybook build's compiled CSS
// is equivalent but its filename is content-hashed, so it cannot be configured.
//
// Run from the repo root: node .design-sync/build-css.mjs

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const PKG = resolve("packages/workout-spa-editor");
const INPUT = resolve(PKG, "src/index.css");
// Must live INSIDE the package: the converter bounds `cfg.cssEntry` to the
// package root (unlike `tsconfig`/`extraFonts`, which are bounded to the repo),
// and silently skips a path that escapes it. Gitignored — `buildCmd` rebuilds it.
const OUT = resolve(PKG, ".design-sync-styles.css");

// Resolve postcss and the repo's configured plugins from the package itself,
// so the versions match what the SPA build uses.
const req = (await import("node:module")).createRequire(
  pathToFileURL(resolve(PKG, "package.json"))
);
const postcss = req("postcss");
const config = (await import(pathToFileURL(resolve(PKG, "postcss.config.js"))))
  .default;

const plugins = Object.entries(config.plugins).map(([name, options]) =>
  req(name)(options ?? {})
);

const css = readFileSync(INPUT, "utf8");
// `from` drives Tailwind v4's source discovery and @import resolution, so it
// must be the real file path inside the package.
const result = await postcss(plugins).process(css, { from: INPUT, to: OUT });

// Drop the Inter @font-face rules: they point at absolute host paths
// (`/fonts/...` in dev, `/editor/fonts/...` under the production base) that
// resolve to nothing once the bundle is served from claude.ai/design. The
// converter relocates @font-face rules into `fonts/fonts.css`, which changes
// what a relative url() is relative to, so rewriting them here cannot be right
// in both places. `.design-sync/inter.css` (wired via cfg.extraFonts) is the
// single declaration instead, and the converter owns its url rewriting.
const styles = result.css.replace(
  /@font-face\s*\{[^}]*url\(\s*["']?\/(?:editor\/)?fonts\/[^}]*\}/g,
  ""
);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, styles);
console.log(`wrote ${OUT}: ${(styles.length / 1024).toFixed(0)} KB`);
