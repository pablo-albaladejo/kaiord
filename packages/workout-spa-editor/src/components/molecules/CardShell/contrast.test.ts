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
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};

const linearize = (channel: number): number => {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

const relativeLuminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
};

const contrastRatio = (a: string, b: string): number => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
};

describe("WCAG 1.4.11 contrast against white card body", () => {
  it.each(Object.entries(PALETTE))(
    "%s achieves ≥ 3:1 contrast against #ffffff",
    (_token, hex) => {
      // Arrange

      // Act

      // Assert
      expect(contrastRatio(hex, WHITE)).toBeGreaterThanOrEqual(3);
    }
  );
});
