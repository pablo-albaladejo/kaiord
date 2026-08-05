/**
 * Presentation mapping for a `LabFlag` (F3.3).
 *
 * A value out of its reference range needs the user, so it says so with a
 * glyph plus its word on `--text`; a value inside its range, or one with no
 * range to judge it by, is muted and silent. Nothing here tints: the palette
 * has no success or warning role, and the danger ramp shares zone 5's hue —
 * a lab result is not a training zone. `unknown` (missing or unparsable
 * range) is deliberately NOT treated as out-of-range.
 */
import type { LabFlag } from "@kaiord/core";

export type LabFlagStyle = {
  /** English fallback; surfaces render `t("flag.<flag>")`. */
  label: string;
  className: string;
  /** Whether the badge draws the alert glyph beside its word. */
  showsGlyph: boolean;
};

const NEEDS_YOU = "font-medium text-ink-strong";
const SILENT = "text-ink-muted";

export const LAB_FLAG_STYLES: Record<LabFlag, LabFlagStyle> = {
  in: { label: "In range", className: SILENT, showsGlyph: false },
  low: { label: "Low", className: NEEDS_YOU, showsGlyph: true },
  high: { label: "High", className: NEEDS_YOU, showsGlyph: true },
  unknown: { label: "No range", className: SILENT, showsGlyph: false },
};

/** Whether a flag marks a value outside its reference range (highlightable). */
export const isOutOfRange = (flag: LabFlag): boolean =>
  flag === "low" || flag === "high";
