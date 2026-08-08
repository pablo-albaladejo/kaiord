/**
 * A few SPA modules cannot read a CSS custom property at the moment they
 * paint: a `<canvas>` has no cascade, and the chart helpers run before the
 * stylesheet exists under jsdom. Those modules freeze a hex mirror of the
 * role they stand for.
 *
 * A frozen mirror is a hand transcription, and hand transcriptions go stale
 * the moment the ramp moves — silently, because nothing renders wrong until
 * someone looks. This check pins every one of them to the role it claims to
 * mirror, so moving the palette fails the build here instead of drifting.
 *
 * Rule id: R-FrozenHexParity.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { BRAND_TOKENS_PATH, readBrandTokenColor } from "./brand-tokens.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SPA = "packages/workout-spa-editor/src/components";

/**
 * Each entry: the file, the constant that holds the frozen hex, the brand
 * role it mirrors, and which theme's value it froze. The SPA's `--ink-*`
 * aliases are declared in `index.css` over the brand roles named here.
 */
export const FROZEN_MIRRORS = [
  {
    file: `${SPA}/molecules/SaveToLibraryButton/thumbnail/canvas-setup.ts`,
    constant: "FROZEN_SURFACE",
    role: "--bg-elevated",
    theme: "light",
  },
  {
    file: `${SPA}/molecules/SaveToLibraryButton/thumbnail/canvas-setup.ts`,
    constant: "FROZEN_PLACEHOLDER_INK",
    role: "--text-dim",
    theme: "light",
  },
  {
    file: `${SPA}/molecules/SaveToLibraryButton/thumbnail/step-colors.ts`,
    constant: "UNRESOLVED",
    role: "--text-dim",
    theme: "light",
  },
  {
    file: `${SPA}/charts/uplot-base/chart-theme.ts`,
    constant: "FALLBACK_AXIS_STROKE",
    role: "--text-dim",
    theme: "light",
  },
  {
    file: `${SPA}/charts/uplot-base/chart-theme.ts`,
    constant: "FALLBACK_GRID_STROKE",
    role: "--border",
    theme: "light",
  },
  {
    file: `${SPA}/pages/health/labs/charts/reference-band-style.ts`,
    constant: "FALLBACK_EDGE",
    role: "--border",
    theme: "light",
  },
];

const hexOf = (source, constant) => {
  const match = new RegExp(
    `${constant}\\s*=\\s*["'](#[0-9a-fA-F]{6})["']`
  ).exec(source);
  return match?.[1]?.toLowerCase() ?? null;
};

export function runCheck({
  srcRoot = REPO,
  tokensPath = BRAND_TOKENS_PATH,
} = {}) {
  const violations = [];
  for (const mirror of FROZEN_MIRRORS) {
    let source;
    try {
      source = readFileSync(resolve(srcRoot, mirror.file), "utf8");
    } catch {
      violations.push({
        rule: "R-FrozenHexParity",
        file: mirror.file,
        detail: `missing file for ${mirror.constant}`,
      });
      continue;
    }
    const frozen = hexOf(source, mirror.constant);
    if (frozen === null) {
      violations.push({
        rule: "R-FrozenHexParity",
        file: mirror.file,
        detail: `${mirror.constant} is no longer a hex literal`,
      });
      continue;
    }
    const expected = readBrandTokenColor(
      mirror.role,
      tokensPath,
      mirror.theme
    ).toLowerCase();
    if (frozen !== expected) {
      violations.push({
        rule: "R-FrozenHexParity",
        file: mirror.file,
        detail: `${mirror.constant} froze ${frozen}, but ${mirror.role} (${mirror.theme}) is ${expected}`,
      });
    }
  }
  return violations;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const found = runCheck();
  if (found.length === 0) {
    console.log("✅ Frozen hex mirrors match their roles.");
  } else {
    console.error("❌ Frozen hex mirrors drifted from the palette:");
    for (const v of found) {
      console.error(`  [${v.rule}] ${v.file} — ${v.detail}`);
    }
    console.error(
      "  Remediation: re-read the role with scripts/brand-tokens.mjs and update the constant, or stop freezing it."
    );
    process.exit(1);
  }
}
