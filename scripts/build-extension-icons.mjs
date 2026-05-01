#!/usr/bin/env node
/**
 * Render Chrome-extension icon PNGs from the shared SVG master.
 *
 * Usage:
 *   node scripts/build-extension-icons.mjs
 *
 * For each registered bridge, substitutes the accent placeholder in
 * packages/_shared/extension-icon/master.svg and rasterises to PNG
 * at three sizes (16, 48, 128) into packages/<bridge>/icons/.
 *
 * Source-of-truth: the SVG master. Hand-editing the produced PNGs is
 * forbidden; the privacy-surface guard does NOT cover icons, but the
 * distinctness guard at scripts/check-extension-icons-distinct.mjs
 * fails the lint job if either bridge's icons drift from the
 * inter-bridge / accent-mass thresholds.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MASTER = join(REPO_ROOT, "packages/_shared/extension-icon/master.svg");

const BRIDGES = [
  { name: "garmin-bridge", accent: "#007cc3" },
  { name: "train2go-bridge", accent: "#f74464" },
];
const SIZES = [16, 48, 128];

const renderBridge = async ({ name, accent }) => {
  const masterSvg = readFileSync(MASTER, "utf8");
  const svgWithAccent = masterSvg.replace(/__ACCENT__/g, accent);
  for (const size of SIZES) {
    const buffer = await sharp(Buffer.from(svgWithAccent))
      .resize(size, size, { fit: "fill" })
      .png()
      .toBuffer();
    const out = join(REPO_ROOT, "packages", name, "icons", `icon${size}.png`);
    writeFileSync(out, buffer);
    console.log(`  ✓ ${name}/icons/icon${size}.png (${buffer.length} bytes)`);
  }
};

const main = async () => {
  console.log("Rendering extension icons from master SVG...");
  for (const bridge of BRIDGES) {
    console.log(` ${bridge.name} (accent ${bridge.accent}):`);
    await renderBridge(bridge);
  }
  console.log("Done.");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
