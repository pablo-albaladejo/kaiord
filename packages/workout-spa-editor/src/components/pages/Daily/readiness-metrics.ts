/**
 * Pure per-stat derivations for the Today readiness card. Each resolves to a
 * display string (or the em-dash placeholder when its record is absent); no
 * values are invented.
 */
import type { HrvSummary, SleepRecord, StressEpisode } from "@kaiord/core";

export const EM_DASH = "—";
export const SCORE_MAX = 100;
const SCORE_MIN = 0;
const SECONDS_PER_HOUR = 3600;
const HRV_TREND_THRESHOLD = 0;

export function compositeScore(
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

export function sleepValue(sleep: SleepRecord | undefined): string {
  if (!sleep) return EM_DASH;
  const hours = sleep.totalDurationSeconds / SECONDS_PER_HOUR;
  return `${hours.toFixed(1)}h`;
}

export function hrvTrend(hrv: HrvSummary | undefined): string | undefined {
  if (!hrv?.score) return undefined;
  return hrv.score > HRV_TREND_THRESHOLD ? "balanced" : undefined;
}

/**
 * Daily-energy proxy from the day's stress episodes: 100 − mean(averageLevel),
 * clamped to 0..100. Em-dash when no stress record exists for the day.
 */
export function batteryValue(stress: StressEpisode[] | undefined): string {
  if (!stress || stress.length === 0) return EM_DASH;
  const mean =
    stress.reduce((sum, episode) => sum + episode.averageLevel, 0) /
    stress.length;
  const energy = Math.min(
    SCORE_MAX,
    Math.max(SCORE_MIN, Math.round(SCORE_MAX - mean))
  );
  return `${energy}`;
}
