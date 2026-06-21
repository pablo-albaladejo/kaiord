/**
 * Per-day WeekStrip summary: presence (count), an honest intensity bucket
 * (measured TSS or estimated coaching effort), the representative sport glyph,
 * and the measured duration in seconds (null when no KRD-backed workout yields
 * one — no fabricated magnitude).
 */
import type { MatchedSessionWithMetadata } from "../../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { Profile } from "../../../types/profile";
import { measuredDurationSec } from "./day-duration";
import { estimatedBucket, measuredBucket } from "./day-intensity";
import { representativeDaySport } from "./day-sport";
import type { IntensityBucket } from "./intensity-bucket";

export type DaySummary = {
  count: number;
  intensity: IntensityBucket | null;
  estimated: boolean;
  /** Representative sport glyph (emoji) for the day, or null for a dot. */
  sport: string | null;
  /** Measured total duration in seconds, or null when unknown. */
  durationSec: number | null;
};

export function summarizeDay(
  dayMatched: MatchedSessionWithMetadata[],
  plans: CoachingActivity[],
  actuals: WorkoutRecord[],
  profile: Profile | null
): DaySummary {
  const count = dayMatched.length + plans.length + actuals.length;
  const sport = representativeDaySport(dayMatched, plans, actuals);
  const measuredWorkouts = [...dayMatched.map((m) => m.workout), ...actuals];
  const durationSec = measuredDurationSec(measuredWorkouts);
  const measured = measuredBucket(measuredWorkouts, profile);
  if (measured) {
    return { count, intensity: measured, estimated: false, sport, durationSec };
  }
  const estimated = estimatedBucket([
    ...plans,
    ...dayMatched.map((m) => m.activity),
  ]);
  return {
    count,
    intensity: estimated,
    estimated: estimated !== null,
    sport,
    durationSec,
  };
}
