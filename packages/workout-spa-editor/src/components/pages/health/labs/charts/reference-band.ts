/**
 * Resolve the reference band for a parameter's evolution chart (DoD-2). The
 * reference is GLOBAL — one horizontal region/line across the whole x-range —
 * taken from the canonical bounds of the MOST RECENT value that carries any
 * bound (not a per-point band). A value with BOTH bounds yields a `"band"`
 * (two-sided fill); a value with only one bound yields a `"threshold"` (a
 * single limit line), which is the common case for one-sided lipids (LDL,
 * cholesterol, triglycerides = high-only; HDL = low-only). Every `LabValue`
 * stores its range in the parameter's canonical unit, so the reference and the
 * plotted points are directly comparable (the C1 fix). No value with any
 * canonical bound → no reference.
 */
import type { LabValue } from "@kaiord/core";

export type ReferenceBand =
  | { kind: "band"; low: number; high: number }
  | { kind: "threshold"; low?: number; high?: number };

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

// Newest first: greatest (date, id) — mirrors the latest-per-parameter
// tie-break (ids carry no time component, so the order is stable, not
// temporal).
const byDateThenIdDesc = (a: LabValue, b: LabValue): number =>
  cmp(b.date, a.date) || cmp(b.id, a.id);

export const resolveReferenceBand = (
  values: readonly LabValue[]
): ReferenceBand | null => {
  for (const v of [...values].sort(byDateThenIdDesc)) {
    const hasLow = v.refLowCanonical != null;
    const hasHigh = v.refHighCanonical != null;
    if (hasLow && hasHigh) {
      return {
        kind: "band",
        low: v.refLowCanonical!,
        high: v.refHighCanonical!,
      };
    }
    if (hasLow || hasHigh) {
      return {
        kind: "threshold",
        low: v.refLowCanonical,
        high: v.refHighCanonical,
      };
    }
  }
  return null;
};
