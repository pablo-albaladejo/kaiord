// R-PIIInterpolation: returned string is for JSX rendering only; do not pass
// to toast()/console.* without re-evaluating the static-source rule
// (scripts/check-no-pii-leakage.mjs walks components/hooks/lib).

import type { Units } from "../../../../lib/units/units";
import { formatWeightKg } from "../../../../lib/units/units";
import type { TrendMetricDef, TrendMetricKey } from "./trend-metrics";

const EMPTY = "—";

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
): string => {
  if (v === null || v === undefined || !Number.isFinite(v)) return EMPTY;
  // Weight values are stored in kilograms; relabel in the active units.
  if (metric.key === "weight") return formatWeightKg(v, units);
  return FORMATTERS[metric.key](v);
};
