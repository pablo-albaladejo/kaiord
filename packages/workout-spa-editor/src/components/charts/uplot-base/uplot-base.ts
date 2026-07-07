/**
 * Neutral uPlot primitives shared across chart surfaces (health trends and lab
 * analytics): the chart def-object shape, the temporal x-scale fragment, the
 * em-dash value formatter, and an ISO-date → Unix-second helper.
 */
import type uPlot from "uplot";

/**
 * Shared def-object for a chart series: a stable `key` plus a display `label`
 * and `unit`. Trends and labs both build uPlot axes/series from this shape.
 */
export type ChartMetricDef<K extends string = string> = {
  key: K;
  label: string;
  unit: string;
};

/** Placeholder rendered for a null / non-finite chart value. */
export const EMPTY = "—";

/** Apply `fmt` to a finite value, else return the em-dash placeholder. */
export const formatOrEmpty = (
  v: number | null | undefined,
  fmt: (n: number) => string
): string => (v == null || !Number.isFinite(v) ? EMPTY : fmt(v));

/**
 * A fresh temporal x-scale fragment (`{ x: { time: true } }`) for a uPlot
 * chart whose x axis holds Unix-second timestamps.
 */
export const timeXScale = (): uPlot.Scales => ({ x: { time: true } });

const MS_PER_SECOND = 1000;

/** Convert a `YYYY-MM-DD` date to the Unix-second x used by the time scale. */
export const isoDateToSeconds = (isoDate: string): number =>
  Math.floor(new Date(`${isoDate}T00:00:00Z`).getTime() / MS_PER_SECOND);
