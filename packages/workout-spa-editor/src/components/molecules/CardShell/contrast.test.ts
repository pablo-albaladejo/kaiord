/**
 * WCAG 1.4.11 (Non-text Contrast) requires ≥ 3:1 contrast ratio for
 * graphical UI components against the adjacent colour. The 4-pixel
 * lateral border on every card variant is "graphical", and its
 * adjacent colour is the white card body (#ffffff).
 *
 * If any token below regresses below 3:1, the test fails — preventing
 * silent palette drift that would erode accessibility.
 */

import { describe, expect, it } from "vitest";

import {
  CHANNEL_MAX,
  CONTRAST_OFFSET,
  HEX_PARSE,
  LUMINANCE_WEIGHTS,
  SRGB_LINEARIZATION,
  WCAG_NON_TEXT_MIN_RATIO,
} from "./test-fixtures";

const WHITE = "#ffffff";

// Tailwind v3 reference values for the tokens used by status-tokens.ts
// and complianceBucketToBorderClass.
const PALETTE = {
  "amber-600": "#d97706",
  "emerald-600": "#059669",
  "slate-500": "#64748b", // skipped status AND null-compliance neutral
  "yellow-700": "#a16207", // mid-bucket gradient sample
} as const;

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(HEX_PARSE.rOffset, HEX_PARSE.rEnd), HEX_PARSE.radix),
    parseInt(h.slice(HEX_PARSE.rEnd, HEX_PARSE.gEnd), HEX_PARSE.radix),
    parseInt(h.slice(HEX_PARSE.gEnd, HEX_PARSE.bEnd), HEX_PARSE.radix),
  ];
};

const linearize = (channel: number): number => {
  const c = channel / CHANNEL_MAX;
  return c <= SRGB_LINEARIZATION.threshold
    ? c / SRGB_LINEARIZATION.lowSlope
    : Math.pow(
        (c + SRGB_LINEARIZATION.offset) / SRGB_LINEARIZATION.scale,
        SRGB_LINEARIZATION.exponent
      );
};

const relativeLuminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex);
  return (
    LUMINANCE_WEIGHTS.red * linearize(r) +
    LUMINANCE_WEIGHTS.green * linearize(g) +
    LUMINANCE_WEIGHTS.blue * linearize(b)
  );
};

const contrastRatio = (a: string, b: string): number => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + CONTRAST_OFFSET) / (dark + CONTRAST_OFFSET);
};

describe("WCAG 1.4.11 contrast against white card body", () => {
  it.each(Object.entries(PALETTE))(
    "should achieve ≥ 3:1 contrast against #ffffff for %s",
    (_token, hex) => {
      // Arrange

      // Act

      // Assert
      expect(contrastRatio(hex, WHITE)).toBeGreaterThanOrEqual(
        WCAG_NON_TEXT_MIN_RATIO
      );
    }
  );
});
