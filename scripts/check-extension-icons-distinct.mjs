#!/usr/bin/env node
/**
 * Mechanical guard: extension icons MUST be visually distinct.
 *
 * Two checks per size:
 *   (a) Inter-bridge mean per-pixel color delta MUST exceed a fixed
 *       threshold so the user can tell Garmin from Train2Go in the
 *       browser toolbar at every size (especially 16x16).
 *   (b) At 16x16, the bridge's accent color (within ±15° hue tolerance
 *       of the bridge's accent token) MUST occupy ≥25% of the
 *       non-transparent pixel mass — guards against a thin-stripe
 *       accent that could pass (a) without being recognisable.
 *
 * Runs against the produced PNGs at packages/<bridge>/icons/, not the
 * SVG master, so it catches rasteriser drift too.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const BRIDGES = [
  { name: "garmin-bridge", accent: "#007cc3" },
  { name: "train2go-bridge", accent: "#f74464" },
];
const SIZES = [16, 48, 128];
const MEAN_COLOR_DELTA_THRESHOLD = 8;
const ACCENT_MASS_THRESHOLD_PCT = 25;
const HUE_TOLERANCE_DEG = 15;

const loadRaw = async (path) => {
  const { data, info } = await sharp(readFileSync(path))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
};

const meanColorDelta = (a, b) => {
  if (a.data.length !== b.data.length) {
    throw new Error(
      `Pixel buffers differ in length: ${a.data.length} vs ${b.data.length}`
    );
  }
  let total = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    total +=
      Math.abs(a.data[i] - b.data[i]) +
      Math.abs(a.data[i + 1] - b.data[i + 1]) +
      Math.abs(a.data[i + 2] - b.data[i + 2]);
  }
  return total / ((a.data.length / 4) * 3);
};

const rgbToHsl = (r, g, b) => {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return { h, s, l };
};

const hexToRgb = (hex) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

const accentMassPct = (raw, accentHex) => {
  const accentHsl = rgbToHsl(...Object.values(hexToRgb(accentHex)));
  let opaque = 0;
  let inAccent = 0;
  for (let i = 0; i < raw.data.length; i += 4) {
    const a = raw.data[i + 3];
    if (a < 128) continue;
    opaque += 1;
    const { h, s, l } = rgbToHsl(raw.data[i], raw.data[i + 1], raw.data[i + 2]);
    if (s < 0.2 || l < 0.1 || l > 0.95) continue;
    const dh = Math.min(
      Math.abs(h - accentHsl.h),
      360 - Math.abs(h - accentHsl.h)
    );
    if (dh <= HUE_TOLERANCE_DEG) inAccent += 1;
  }
  return opaque === 0 ? 0 : (inAccent / opaque) * 100;
};

const main = async () => {
  const violations = [];
  for (const size of SIZES) {
    const a = await loadRaw(
      join(REPO_ROOT, "packages", BRIDGES[0].name, "icons", `icon${size}.png`)
    );
    const b = await loadRaw(
      join(REPO_ROOT, "packages", BRIDGES[1].name, "icons", `icon${size}.png`)
    );
    const delta = meanColorDelta(a, b);
    if (delta < MEAN_COLOR_DELTA_THRESHOLD) {
      violations.push(
        `icons at ${size}x${size}: mean color delta ${delta.toFixed(2)} < ${MEAN_COLOR_DELTA_THRESHOLD}`
      );
    }
  }
  // Pixel-mass check at the smallest size only — the threshold is most
  // load-bearing at 16x16 where toolbar identity matters.
  for (const bridge of BRIDGES) {
    const raw = await loadRaw(
      join(REPO_ROOT, "packages", bridge.name, "icons", "icon16.png")
    );
    const pct = accentMassPct(raw, bridge.accent);
    if (pct < ACCENT_MASS_THRESHOLD_PCT) {
      violations.push(
        `${bridge.name} icon16.png: accent (${bridge.accent}) covers ${pct.toFixed(1)}% non-transparent pixels < ${ACCENT_MASS_THRESHOLD_PCT}%`
      );
    }
  }

  if (violations.length > 0) {
    console.error("❌ Extension icon distinctness violations:");
    for (const v of violations) console.error(`  ${v}`);
    process.exit(1);
  }
  console.log("✅ Extension icons are visually distinct.");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
