/**
 * Pure builders for minimal valid KRD v2.0 health payloads entered by
 * hand. Every metric derives its timestamp from the clicked `day`
 * (YYYY-MM-DD) at noon UTC, sidestepping timezone-boundary drift.
 *
 * Steps is the only merge-preserving builder: a prior daily row (e.g.
 * imported) keeps its calorie/intensity fields; only `steps` is
 * overridden. With no prior row the non-entered required fields are
 * deterministically zero-filled.
 */
import type {
  DailyWellness,
  HrvSummary,
  SleepRecord,
  WeightMeasurement,
} from "@kaiord/core";

const KRD_VERSION = "2.0";

const noonOf = (day: string): string => `${day}T12:00:00.000Z`;

export const buildWeightPayload = (
  weightKilograms: number,
  day: string
): WeightMeasurement => ({
  kind: "weight",
  version: KRD_VERSION,
  measuredAt: noonOf(day),
  weightKilograms,
});

export const buildSleepPayload = (score: number, day: string): SleepRecord => {
  const at = noonOf(day);
  return {
    kind: "sleep",
    version: KRD_VERSION,
    startTime: at,
    endTime: at,
    totalDurationSeconds: 0,
    stages: [],
    score,
  };
};

export const buildHrvPayload = (rMSSD: number, day: string): HrvSummary => ({
  kind: "hrv",
  version: KRD_VERSION,
  measuredAt: noonOf(day),
  rMSSD,
  measurementWindow: "spot",
});

export const buildStepsPayload = (
  steps: number,
  day: string,
  prior?: DailyWellness
): DailyWellness =>
  prior
    ? { ...prior, steps }
    : {
        kind: "daily",
        version: KRD_VERSION,
        date: day,
        steps,
        activeCalories: 0,
        restingCalories: 0,
        intensityMinutes: { moderate: 0, vigorous: 0 },
      };
