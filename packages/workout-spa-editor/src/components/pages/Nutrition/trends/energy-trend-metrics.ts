/**
 * Per-series presentation for the Nutrition trends chart: stroke colour, axis
 * scale, dash pattern, and legend label. Weight raw/EMA/goal share the `weight`
 * scale (kg); steps, sleep, and weekly training each own their own scale so the
 * overlays read as relative trends rather than fighting the kg axis.
 */

import type { EnergyTrendKey } from "./energy-trend-series";

export type EnergyTrendMetricDef = {
  key: EnergyTrendKey;
  label: string;
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
    label: "Weight",
    scale: "weight",
    stroke: "#94a3b8",
    dash: RAW_DASH,
    width: 1,
  },
  {
    key: "weightEma",
    label: "Weight trend",
    scale: "weight",
    stroke: "#2563eb",
    width: 2,
  },
  {
    key: "goal",
    label: "Goal",
    scale: "weight",
    stroke: "#16a34a",
    dash: GOAL_DASH,
    width: 1,
  },
  { key: "steps", label: "Steps", scale: "steps", stroke: "#f59e0b", width: 1 },
  { key: "sleep", label: "Sleep", scale: "sleep", stroke: "#8b5cf6", width: 1 },
  {
    key: "training",
    label: "Weekly training (min)",
    scale: "training",
    stroke: "#ef4444",
    width: 1,
  },
];

export const ENERGY_TREND_METRIC_BY_KEY: Record<
  EnergyTrendKey,
  EnergyTrendMetricDef
> = Object.fromEntries(ENERGY_TREND_METRICS.map((m) => [m.key, m])) as Record<
  EnergyTrendKey,
  EnergyTrendMetricDef
>;
