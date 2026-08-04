/**
 * Per-series presentation for the Nutrition trends chart: stroke ladder step,
 * axis scale, and dash pattern. Legend labels are localized in the options
 * builder via the `trends.series.*` keys. Weight raw/EMA/goal share the
 * `weight` scale (kg); steps, sleep, and weekly training each own their own
 * scale so the overlays read as relative trends rather than fighting the kg
 * axis.
 *
 * Six series over a four-step ladder, so `strokeStep` repeats: the three
 * weight series wrap onto steps 0–2 but are additionally separated by dash
 * pattern, and the three overlays each own a step and a scale. No series takes
 * a hue — the five hues in this app mean training zones.
 */

import type { EnergyTrendKey } from "./energy-trend-series";

export type EnergyTrendMetricDef = {
  key: EnergyTrendKey;
  /** uPlot scale key; co-scaled series share one. */
  scale: string;
  /** Index into the neutral ink ladder in charts/uplot-base/series-strokes. */
  strokeStep: number;
  /** Dashed strokes mark de-emphasized / reference series. */
  dash?: number[];
  width?: number;
};

const RAW_DASH = [4, 4];
const GOAL_DASH = [8, 4];

export const ENERGY_TREND_METRICS: ReadonlyArray<EnergyTrendMetricDef> = [
  {
    key: "weightRaw",
    scale: "weight",
    strokeStep: 2,
    dash: RAW_DASH,
    width: 1,
  },
  { key: "weightEma", scale: "weight", strokeStep: 0, width: 2 },
  {
    key: "goal",
    scale: "weight",
    strokeStep: 3,
    dash: GOAL_DASH,
    width: 1,
  },
  { key: "steps", scale: "steps", strokeStep: 1, width: 1 },
  { key: "sleep", scale: "sleep", strokeStep: 2, width: 1 },
  { key: "training", scale: "training", strokeStep: 3, width: 1 },
];

export const ENERGY_TREND_METRIC_BY_KEY: Record<
  EnergyTrendKey,
  EnergyTrendMetricDef
> = Object.fromEntries(ENERGY_TREND_METRICS.map((m) => [m.key, m])) as Record<
  EnergyTrendKey,
  EnergyTrendMetricDef
>;
