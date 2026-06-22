/**
 * Pure series model for the Nutrition trends chart. Converts each dated input
 * (weight raw/EMA, goal line, steps, sleep, weekly training time) into a
 * `{ x, y }` series on a shared epoch-seconds x-axis, then aligns them into the
 * `uPlot.AlignedData` shape (missing per-x positions become literal `null`).
 *
 * Mirrors the health-trends `build-trend-chart-data` alignment so the chart
 * renders gaps as breaks rather than interpolated lines.
 */

import type uPlot from "uplot";

import type { WeightTrendPoint } from "../../../../application/energy/build-weight-trend";

const MS_PER_SECOND = 1000;

export type DatedValue = { date: string; value: number };

export const ENERGY_TREND_KEYS = [
  "weightRaw",
  "weightEma",
  "goal",
  "steps",
  "sleep",
  "training",
] as const;

export type EnergyTrendKey = (typeof ENERGY_TREND_KEYS)[number];

export type EnergyTrendSeries = Record<EnergyTrendKey, DatedValue[]>;

export const toEpochSeconds = (isoDate: string): number =>
  Math.floor(new Date(`${isoDate}T00:00:00Z`).getTime() / MS_PER_SECOND);

export const asDatedValues = (
  points: ReadonlyArray<WeightTrendPoint>
): DatedValue[] => points.map((p) => ({ date: p.date, value: p.value }));

const collectXs = (
  keys: ReadonlyArray<EnergyTrendKey>,
  series: EnergyTrendSeries
): number[] => {
  const xs = new Set<number>();
  for (const key of keys)
    for (const point of series[key]) xs.add(toEpochSeconds(point.date));
  return [...xs].sort((a, b) => a - b);
};

const yColumn = (
  points: ReadonlyArray<DatedValue>,
  xArr: ReadonlyArray<number>
): Array<number | null> => {
  const map = new Map<number, number>();
  for (const point of points) map.set(toEpochSeconds(point.date), point.value);
  return xArr.map((x) => (map.has(x) ? (map.get(x) as number) : null));
};

export const buildEnergyTrendData = (
  keys: ReadonlyArray<EnergyTrendKey>,
  series: EnergyTrendSeries
): uPlot.AlignedData => {
  const xArr = collectXs(keys, series);
  const ys = keys.map((key) => yColumn(series[key], xArr));
  return [xArr, ...ys] as uPlot.AlignedData;
};
