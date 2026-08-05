/**
 * Sleep-session duration presentation for the /health/sleep list.
 *
 * `totalDurationSeconds` is the record's own field (the stage durations are
 * validated against it), so nothing here re-derives it from start/end.
 */
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
/** The bar is proportional to a full night, not to the longest row: a short
    night has to read as short even when every row in view is short. */
export const SLEEP_BAR_FULL_SECONDS = 9 * SECONDS_PER_HOUR;
const FRACTION_MAX = 1;
const PERCENT = 100;

export type SleepDurationParts = { hours: number; minutes: number };

/** Whole hours and the remaining whole minutes; negatives clamp to zero. */
export const sleepDurationParts = (
  totalSeconds: number
): SleepDurationParts => {
  const safe =
    Number.isFinite(totalSeconds) && totalSeconds > 0
      ? Math.floor(totalSeconds)
      : 0;
  return {
    hours: Math.floor(safe / SECONDS_PER_HOUR),
    minutes: Math.floor((safe % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
  };
};

/** Width percentage of the duration bar, clamped to a full night. */
export const sleepBarPercent = (totalSeconds: number): number => {
  const safe =
    Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : 0;
  return Math.min(safe / SLEEP_BAR_FULL_SECONDS, FRACTION_MAX) * PERCENT;
};
