// R-PIIInterpolation: returned string is for JSX rendering only; do not pass
// to toast()/console.* without re-evaluating the static-source rule
// (scripts/check-no-pii-leakage.mjs walks components/hooks/lib).

import type { Units } from "../../../../lib/units/units";
import { formatWeightKg } from "../../../../lib/units/units";
import { formatOrEmpty } from "../../../charts/uplot-base/uplot-base";
import type { TrendMetricDef, TrendMetricKey } from "./trend-metrics";

const STEPS_FORMATTER = new Intl.NumberFormat("en-US");

type Formatter = (v: number) => string;

const FORMATTERS: Record<TrendMetricKey, Formatter> = {
  sleep: (v) => `${Math.round(v)}`,
  hrv: (v) => `${Math.round(v)} ms`,
  weight: (v) => `${v.toFixed(1)} kg`,
  steps: (v) => `${STEPS_FORMATTER.format(Math.round(v))} steps`,
};

export const formatPaneValue = (
  metric: TrendMetricDef,
  v: number | null | undefined,
  units: Units = "metric"
): string =>
  formatOrEmpty(v, (n) =>
    // Weight values are stored in kilograms; relabel in the active units.
    metric.key === "weight"
      ? formatWeightKg(n, units)
      : FORMATTERS[metric.key](n)
  );
