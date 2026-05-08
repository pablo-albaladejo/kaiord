/**
 * Test fixtures for CardShell/contrast.test.ts.
 *
 * Co-located fixture module — pure constants only.
 *
 * WCAG 2.x Non-text Contrast (1.4.11) reference constants. Values are
 * specified verbatim by the W3C standard; grouping them under a single
 * keyed record keeps the formula readable while removing the per-line
 * `no-magic-numbers` warnings the inline constants triggered.
 */

// sRGB hex parsing offsets / channel byte width.
export const HEX_PARSE = {
  rOffset: 0,
  rEnd: 2,
  gEnd: 4,
  bEnd: 6,
  radix: 16,
} as const;

// 8-bit channel max.
export const CHANNEL_MAX = 255;

// W3C sRGB linearization piecewise breakpoint and slopes.
export const SRGB_LINEARIZATION = {
  threshold: 0.03928,
  lowSlope: 12.92,
  offset: 0.055,
  scale: 1.055,
  exponent: 2.4,
} as const;

// W3C relative luminance channel weights.
export const LUMINANCE_WEIGHTS = {
  red: 0.2126,
  green: 0.7152,
  blue: 0.0722,
} as const;

// W3C contrast ratio constant (added to both luminances).
export const CONTRAST_OFFSET = 0.05;

// WCAG 1.4.11 minimum non-text contrast ratio.
export const WCAG_NON_TEXT_MIN_RATIO = 3;
