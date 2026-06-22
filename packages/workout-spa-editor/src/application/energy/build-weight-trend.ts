/**
 * `buildWeightTrend` — pure assembly of the weight-trend view-model: the raw
 * weigh-ins, an EMA-smoothed trend over them, and the goal's flat target-weight
 * line spanning the same date axis.
 *
 * Weigh-ins MUST be ascending by date (the EMA contract). The smoothed trend is
 * the progress source-of-truth; the raw points stay available but de-emphasized
 * by the chart. The goal line is `null` when no active goal carries a target
 * weight, so callers omit it rather than draw a misleading flat zero.
 */

import { type EmaPoint, exponentialMovingAverage } from "@kaiord/core";

import type { EnergyTargetRecord } from "../../types/energy-target-record";
import type { HealthWeightRecord } from "../../types/health/health-records";

/** A single weigh-in / trend datum on the shared date axis. */
export type WeightTrendPoint = { date: string; value: number };

export type WeightTrend = {
  /** Raw weigh-ins, ascending by date. */
  raw: WeightTrendPoint[];
  /** EMA-smoothed trend, one entry per raw point. */
  smoothed: WeightTrendPoint[];
  /** Flat goal target-weight line over the same dates, or null when no goal. */
  goalLine: WeightTrendPoint[] | null;
};

/** Default EMA smoothing window for daily weigh-ins (days). */
export const DEFAULT_WEIGHT_EMA_WINDOW_DAYS = 7;

const toEmaPoints = (records: HealthWeightRecord[]): EmaPoint[] =>
  [...records]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((record) => ({
      date: record.date,
      value: record.krd.weightKilograms,
    }));

const toGoalLine = (
  points: ReadonlyArray<EmaPoint>,
  target: EnergyTargetRecord | undefined
): WeightTrendPoint[] | null => {
  if (!target || points.length === 0) return null;
  return points.map((point) => ({
    date: point.date,
    value: target.targetWeightKg,
  }));
};

export type BuildWeightTrendInput = {
  weighIns: HealthWeightRecord[];
  target: EnergyTargetRecord | undefined;
  windowDays?: number;
};

export const buildWeightTrend = ({
  weighIns,
  target,
  windowDays = DEFAULT_WEIGHT_EMA_WINDOW_DAYS,
}: BuildWeightTrendInput): WeightTrend => {
  const points = toEmaPoints(weighIns);
  const ema = exponentialMovingAverage(points, { windowDays });
  return {
    raw: points.map((point) => ({ date: point.date, value: point.value })),
    smoothed: ema.map((entry) => ({ date: entry.date, value: entry.ema })),
    goalLine: toGoalLine(points, target),
  };
};
