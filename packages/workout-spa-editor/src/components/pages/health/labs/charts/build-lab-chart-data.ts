/**
 * Aligned uPlot data for a parameter's evolution chart. Five rows: the x axis
 * (real dates as Unix seconds, ascending), the canonical value line, the
 * out-of-range points (canonical value where `flag` is low/high, else null),
 * and the two flat reference edges (high/low). A two-sided band fills between
 * both edges; a one-sided threshold leaves the absent edge null so only its
 * limit line renders. When there is no reference the edge rows are all null.
 */
import type { LabValue } from "@kaiord/core";
import type uPlot from "uplot";

import { isoDateToSeconds } from "../../../../charts/uplot-base/uplot-base";
import { isOutOfRange } from "../lab-flag-display";
import type { ReferenceBand } from "./reference-band";

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

// Ascending by (date, id): overwriting per x keeps the greatest-id value on a
// shared date, matching the latest-per-parameter tie-break.
const byDateThenId = (a: LabValue, b: LabValue): number =>
  cmp(a.date, b.date) || cmp(a.id, b.id);

export const buildLabChartData = (
  values: readonly LabValue[],
  band: ReferenceBand | null
): uPlot.AlignedData => {
  const byX = new Map<number, LabValue>();
  for (const v of [...values].sort(byDateThenId)) {
    byX.set(isoDateToSeconds(v.date), v);
  }
  const xs = [...byX.keys()].sort((a, b) => a - b);

  const line = xs.map((x) => byX.get(x)!.valueCanonical);
  const outliers = xs.map((x) => {
    const v = byX.get(x)!;
    return isOutOfRange(v.flag) ? v.valueCanonical : null;
  });
  const high = xs.map(() => band?.high ?? null);
  const low = xs.map(() => band?.low ?? null);

  return [xs, line, outliers, high, low];
};

/** Count of out-of-range points in a built data set (F4 test/visual signal). */
export const countOutliers = (data: uPlot.AlignedData): number =>
  (data[2] ?? []).filter((v) => v != null).length;
