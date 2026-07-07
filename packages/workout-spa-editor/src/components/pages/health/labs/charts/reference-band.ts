/**
 * Resolve the reference band for a parameter's evolution chart (DoD-2). The
 * band is GLOBAL — one horizontal region across the whole x-range — taken from
 * the canonical bounds of the MOST RECENT value that carries both (not a
 * per-point band). Every `LabValue` stores its range in the parameter's
 * canonical unit, so the band and the plotted points are directly comparable
 * (the C1 fix). No value with both canonical bounds → no band.
 */
import type { LabValue } from "@kaiord/core";

export type ReferenceBand = { low: number; high: number };

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
    if (v.refLowCanonical != null && v.refHighCanonical != null) {
      return { low: v.refLowCanonical, high: v.refHighCanonical };
    }
  }
  return null;
};
