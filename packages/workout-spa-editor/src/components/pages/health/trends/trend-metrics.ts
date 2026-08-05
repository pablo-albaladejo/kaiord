import type { ChartMetricDef } from "../../../charts/uplot-base/uplot-base";

export type TrendMetricKey = "sleep" | "hrv" | "weight" | "steps";

export type TrendMetricDef = ChartMetricDef<TrendMetricKey> & {
  /** Ladder step shared by the canvas stroke and the selector's swatch. */
  strokeStep: number;
  /** Set on the series that wraps onto an already-used step. */
  dash?: number[];
};

// Four metrics over a three-step ladder (see charts/uplot-base/series-strokes:
// a fourth step would fall under the 3:1 graphical-contrast floor on the light
// theme). `steps` wraps onto step 0 and takes the dash as its second channel.
// The assignment is fixed rather than derived from the live selection so a
// metric keeps the same swatch whatever else is toggled on.
const WRAP_DASH = [5, 4];

/** `label` is the English fallback; surfaces localize via `trends.metric.*`. */
export const TREND_METRICS: ReadonlyArray<TrendMetricDef> = [
  { key: "sleep", label: "Sleep", unit: "score", strokeStep: 0 },
  { key: "hrv", label: "HRV", unit: "ms", strokeStep: 1 },
  { key: "weight", label: "Weight", unit: "kg", strokeStep: 2 },
  {
    key: "steps",
    label: "Steps",
    unit: "steps",
    strokeStep: 0,
    dash: WRAP_DASH,
  },
];

export type TrendRangeDays = 30 | 90 | 365;

/** `labelKey` resolves against the `health` namespace. */
export const TREND_RANGES: ReadonlyArray<{
  days: TrendRangeDays;
  labelKey: string;
}> = [
  { days: 30, labelKey: "trends.range.d30" },
  { days: 90, labelKey: "trends.range.d90" },
  { days: 365, labelKey: "trends.range.d365" },
];
