/**
 * Builds the `uPlot.Options` for the Nutrition trends chart from the present
 * series keys. The x-axis is time; the weight axis is shown on the left, the
 * overlay scales (steps/sleep/training) are auto-ranged but axis-hidden so they
 * read as relative trend lines, not competing numeric axes.
 */

import type uPlot from "uplot";

import { ENERGY_TREND_METRIC_BY_KEY } from "./energy-trend-metrics";
import type { EnergyTrendKey } from "./energy-trend-series";

const WEIGHT_SCALE = "weight";

const uniqueScales = (keys: ReadonlyArray<EnergyTrendKey>): string[] => [
  ...new Set(keys.map((key) => ENERGY_TREND_METRIC_BY_KEY[key].scale)),
];

const buildScales = (keys: ReadonlyArray<EnergyTrendKey>): uPlot.Scales => {
  const scales: uPlot.Scales = { x: { time: true } };
  for (const scale of uniqueScales(keys)) scales[scale] = { auto: true };
  return scales;
};

const buildSeries = (keys: ReadonlyArray<EnergyTrendKey>): uPlot.Series[] => [
  {},
  ...keys.map((key) => {
    const def = ENERGY_TREND_METRIC_BY_KEY[key];
    return {
      label: def.label,
      scale: def.scale,
      stroke: def.stroke,
      width: def.width ?? 1,
      ...(def.dash ? { dash: def.dash } : {}),
      spanGaps: false,
    } satisfies uPlot.Series;
  }),
];

export const buildEnergyTrendOptions = (
  keys: ReadonlyArray<EnergyTrendKey>
): uPlot.Options => ({
  width: 0,
  height: 0,
  scales: buildScales(keys),
  axes: [{}, { scale: WEIGHT_SCALE, side: 3, label: "Weight (kg)" }],
  series: buildSeries(keys),
  legend: { show: true, live: true },
  cursor: { x: true, y: true },
});
