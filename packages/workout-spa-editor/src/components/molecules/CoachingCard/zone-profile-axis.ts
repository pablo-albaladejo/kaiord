import type { ProfileSegment } from "../../../lib/workout-review";

const SECONDS_PER_MINUTE = 60;
const FULL_PERCENT = 100;
/** Tick spacings tried in order; the first that fits under MAX_TICKS wins. */
const WIDEST_STEP_MINUTES = 60;
const TICK_STEPS_MINUTES = [15, 30, WIDEST_STEP_MINUTES] as const;
const MAX_TICKS = 7;

export type AxisTick = { minutes: number; percent: number };

export const profileTotalSeconds = (
  segments: readonly ProfileSegment[]
): number => segments.reduce((sum, segment) => sum + segment.seconds, 0);

const tickStepMinutes = (totalMinutes: number): number =>
  TICK_STEPS_MINUTES.find((step) => totalMinutes / step + 1 <= MAX_TICKS) ??
  WIDEST_STEP_MINUTES;

/**
 * Minute marks under the profile — 0′, 15′, 30′… — each placed at its share
 * of the session's length. Long sessions widen the spacing, up to hourly marks,
 * so the axis stays within MAX_TICKS labels for sessions up to six hours.
 */
export function axisTicks(totalSeconds: number): AxisTick[] {
  if (totalSeconds <= 0) return [];
  const totalMinutes = totalSeconds / SECONDS_PER_MINUTE;
  const step = tickStepMinutes(totalMinutes);
  const ticks: AxisTick[] = [];
  for (let minutes = 0; minutes <= totalMinutes; minutes += step) {
    ticks.push({
      minutes,
      percent: ((minutes * SECONDS_PER_MINUTE) / totalSeconds) * FULL_PERCENT,
    });
  }
  return ticks;
}
