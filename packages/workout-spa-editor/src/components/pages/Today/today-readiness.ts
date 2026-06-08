/**
 * Readiness view-model derivation for the Today page.
 *
 * Inputs are Garmin daily metrics persisted under the v16 health stores:
 * the overnight HRV summary (`rMSSD` + optional 0..100 `score`) and the
 * sleep session (`score` + duration). No values are invented — every metric
 * resolves to a string or the em-dash placeholder when its record is absent.
 */
import type { HrvSummary, SleepRecord } from "@kaiord/core";

const EM_DASH = "—";
const SECONDS_PER_HOUR = 3600;
const HRV_TREND_THRESHOLD = 0;
const SCORE_MAX = 100;

const HEADLINE_PUSH_TODAY = "Good to push today";
const HEADLINE_PUSH = "Good to push";
const HEADLINE_EASY_TODAY = "Take it easy today";
const HEADLINE_EASY = "Take it easy";

function readyHeadline(ready: boolean, isFocusToday: boolean): string {
  if (ready) return isFocusToday ? HEADLINE_PUSH_TODAY : HEADLINE_PUSH;
  return isFocusToday ? HEADLINE_EASY_TODAY : HEADLINE_EASY;
}

export type ReadinessMetric = {
  label: string;
  value: string;
  trend?: string;
};

export type ReadinessModel = {
  score: number | null;
  headline: string;
  rationale: string;
  hrv: ReadinessMetric;
  sleep: ReadinessMetric;
  battery: ReadinessMetric;
};

function compositeScore(
  hrv: HrvSummary | undefined,
  sleep: SleepRecord | undefined
): number | null {
  const scores = [hrv?.score, sleep?.score].filter(
    (value): value is number => typeof value === "number"
  );
  if (scores.length === 0) return null;
  const sum = scores.reduce((acc, value) => acc + value, 0);
  return Math.round(sum / scores.length);
}

function sleepValue(sleep: SleepRecord | undefined): string {
  if (!sleep) return EM_DASH;
  const hours = sleep.totalDurationSeconds / SECONDS_PER_HOUR;
  return `${hours.toFixed(1)}h`;
}

function hrvTrend(hrv: HrvSummary | undefined): string | undefined {
  if (!hrv?.score) return undefined;
  return hrv.score > HRV_TREND_THRESHOLD ? "balanced" : undefined;
}

export function buildReadinessModel(
  hrv: HrvSummary | undefined,
  sleep: SleepRecord | undefined,
  isFocusToday: boolean
): ReadinessModel {
  const score = compositeScore(hrv, sleep);
  const ready = score !== null && score >= SCORE_MAX / 2;
  return {
    score,
    headline:
      score === null
        ? "No readiness data yet"
        : readyHeadline(ready, isFocusToday),
    rationale:
      score === null
        ? "Connect Garmin to sync HRV and sleep."
        : "Based on your overnight HRV and sleep.",
    hrv: {
      label: "HRV",
      value: hrv ? `${Math.round(hrv.rMSSD)}` : EM_DASH,
      trend: hrvTrend(hrv),
    },
    sleep: { label: "Sleep", value: sleepValue(sleep) },
    battery: {
      label: "Battery",
      value: hrv?.score !== undefined ? `${hrv.score}` : EM_DASH,
    },
  };
}
