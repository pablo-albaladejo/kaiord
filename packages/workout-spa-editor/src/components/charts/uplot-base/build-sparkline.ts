/**
 * Generic sparkline builder over a series of `{ x, y }` points — a compact,
 * chrome-free uPlot line (no axes, legend, or cursor). Consumed by F3.1's
 * per-parameter list; F4's full evolution chart adds bands and outliers.
 */
import type uPlot from "uplot";

import { timeXScale } from "./uplot-base";

export type SparklinePoint = { x: number; y: number };

const DEFAULT_STROKE = "#2563eb";

/** Aligned `[xs, ys]` for a sparkline, x-sorted ascending. */
export const buildSparklineData = (
  points: readonly SparklinePoint[]
): uPlot.AlignedData => {
  const sorted = [...points].sort((a, b) => a.x - b.x);
  return [sorted.map((p) => p.x), sorted.map((p) => p.y)];
};

export type SparklineStyle = {
  width: number;
  height: number;
  stroke?: string;
};

/**
 * Minimal uPlot options for a sparkline: temporal x, auto y, and every axis /
 * legend / cursor disabled so only the line renders.
 */
export const buildSparklineOptions = ({
  width,
  height,
  stroke = DEFAULT_STROKE,
}: SparklineStyle): uPlot.Options => ({
  width,
  height,
  scales: { ...timeXScale(), y: { auto: true } },
  axes: [{ show: false }, { show: false }],
  series: [{}, { stroke, width: 1, points: { show: false } }],
  legend: { show: false },
  cursor: { show: false },
});
