/**
 * Per-series presentation for the Nutrition trends chart: stroke colour, axis
 * scale, and dash pattern. Legend labels are localized in the options builder
 * via the `trends.series.*` keys. Weight raw/EMA/goal share the `weight`
 * scale (kg); steps, sleep, and weekly training each own their own scale so the
 * overlays read as relative trends rather than fighting the kg axis.
 */

import type { EnergyTrendKey } from "./energy-trend-series";

export type EnergyTrendMetricDef = {
  key: EnergyTrendKey;
  /** uPlot scale key; co-scaled series share one. */
  scale: string;
  stroke: string;
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
    stroke: "#94a3b8",
    dash: RAW_DASH,
    width: 1,
  },
  { key: "weightEma", scale: "weight", stroke: "#2563eb", width: 2 },
  {
    key: "goal",
    scale: "weight",
    stroke: "#16a34a",
    dash: GOAL_DASH,
    width: 1,
  },
  { key: "steps", scale: "steps", stroke: "#f59e0b", width: 1 },
  { key: "sleep", scale: "sleep", stroke: "#8b5cf6", width: 1 },
  { key: "training", scale: "training", stroke: "#ef4444", width: 1 },
];

export const ENERGY_TREND_METRIC_BY_KEY: Record<
  EnergyTrendKey,
  EnergyTrendMetricDef
> = Object.fromEntries(ENERGY_TREND_METRICS.map((m) => [m.key, m])) as Record<
  EnergyTrendKey,
  EnergyTrendMetricDef
>;
