#!/usr/bin/env node
/**
 * Render every derived brand raster from its SVG master.
 *
 * Usage:
 *   pnpm brand:images
 *
 * `assets/AGENTS.md` has always said "regenerate PNG variants from the master
 * whenever it changes" without offering a way to; this is that way. Same
 * approach as scripts/build-extension-icons.mjs, applied to the brand set.
 *
 * The apple-touch icon renders from `mark-app-icon.svg`, not the favicon: on a
 * home screen the user is already inside the product, so the mark is ink.
 *
 * Each frontend keeps a hand-copied duplicate of the assets it serves under
 * its own `public/`; those copies are rewritten here so they cannot drift.
 */

import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import sharp from "sharp";

import { buildOgCardSvg, OG_HEIGHT, OG_WIDTH } from "./brand-og-card.mjs";
import { readBrandTokenColor } from "./brand-tokens.mjs";

export const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ASSETS = join(REPO_ROOT, "assets");

export const FAVICON_RASTERS = [
  { out: "favicon-16.png", size: 16 },
  { out: "favicon-32.png", size: 32 },
  { out: "favicon-48.png", size: 48 },
  { out: "favicon.png", size: 32 },
];

export const LANDING_SUBTITLE = "One framework. Every fitness format.";

// package public dir → the assets it serves verbatim.
export const MIRRORS = {
  "packages/landing/public": [
    "favicon.svg",
    "favicon.png",
    "apple-touch-icon.png",
    "og-image.png",
  ],
  "packages/workout-spa-editor/public": [
    "favicon.svg",
    "favicon.png",
    "apple-touch-icon.png",
  ],
  "packages/docs/public": ["favicon.svg"],
};

// VitePress renders its nav logo through <img src>, an isolated document that
// inherits no currentColor — so the docs site needs the mark with its ink
// baked, once per theme. Both are generated from assets/mark.svg.
export const DOCS_THEMED_MARKS = [
  { out: "packages/docs/public/logo-light.svg", token: "--text", dark: false },
  { out: "packages/docs/public/logo-dark.svg", token: "--text", dark: true },
];

const renderSvg = async (svg, width, height, outPath) => {
  const buffer = await sharp(svg)
    .resize(width, height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(outPath, buffer);
  return buffer.length;
};

async function main() {
  const favicon = readFileSync(join(ASSETS, "favicon.svg"));
  const appIcon = readFileSync(join(ASSETS, "mark-app-icon.svg"));

  console.log("Rendering favicon rasters from assets/favicon.svg...");
  for (const { out, size } of FAVICON_RASTERS) {
    const bytes = await renderSvg(favicon, size, size, join(ASSETS, out));
    console.log(`  ✓ assets/${out} (${size}px, ${bytes} bytes)`);
  }

  console.log("Rendering apple-touch-icon from assets/mark-app-icon.svg...");
  const touchBytes = await renderSvg(
    appIcon,
    180,
    180,
    join(ASSETS, "apple-touch-icon.png")
  );
  console.log(`  ✓ assets/apple-touch-icon.png (180px, ${touchBytes} bytes)`);

  console.log("Rendering the landing Open Graph card...");
  const ogBytes = await renderSvg(
    buildOgCardSvg({ subtitle: LANDING_SUBTITLE }),
    OG_WIDTH,
    OG_HEIGHT,
    join(ASSETS, "og-image.png")
  );
  console.log(`  ✓ assets/og-image.png (${Math.round(ogBytes / 1024)}KB)`);

  console.log(
    "Baking the docs nav marks (an <img> inherits no currentColor)..."
  );
  const mark = readFileSync(join(ASSETS, "mark.svg"), "utf8");
  for (const { out, token, dark } of DOCS_THEMED_MARKS) {
    const ink = readBrandTokenColor(token, undefined, dark ? "dark" : "light");
    writeFileSync(join(REPO_ROOT, out), mark.replaceAll("currentColor", ink));
    console.log(`  ✓ ${out} (${ink})`);
  }

  console.log("Mirroring into each package's public/...");
  for (const [dir, files] of Object.entries(MIRRORS)) {
    for (const file of files) {
      copyFileSync(join(ASSETS, file), join(REPO_ROOT, dir, file));
      console.log(`  ✓ ${dir}/${file}`);
    }
  }

  console.log("Done.");
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
