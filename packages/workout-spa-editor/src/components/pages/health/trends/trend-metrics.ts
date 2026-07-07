import type { ChartMetricDef } from "../../../charts/uplot-base/uplot-base";

export type TrendMetricKey = "sleep" | "hrv" | "weight" | "steps";

export type TrendMetricDef = ChartMetricDef<TrendMetricKey>;

export const TREND_METRICS: ReadonlyArray<TrendMetricDef> = [
  { key: "sleep", label: "Sleep", unit: "score" },
  { key: "hrv", label: "HRV", unit: "ms" },
  { key: "weight", label: "Weight", unit: "kg" },
  { key: "steps", label: "Steps", unit: "steps" },
];

export type TrendRangeDays = 30 | 90 | 365;

export const TREND_RANGES: ReadonlyArray<{
  days: TrendRangeDays;
  label: string;
}> = [
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
  { days: 365, label: "365d" },
];
