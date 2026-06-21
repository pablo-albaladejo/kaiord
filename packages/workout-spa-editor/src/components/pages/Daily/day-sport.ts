/**
 * Representative sport glyph for a WeekStrip day.
 *
 * Coaching activities already carry a display `sport.icon` (an emoji set
 * by the platform adapter), so it is used directly. Raw/structured
 * workouts only carry a sport name, mapped to an emoji for the core
 * sports; anything else returns null and the mark falls back to a dot.
 */
import type { MatchedSessionWithMetadata } from "../../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";

const WORKOUT_SPORT_EMOJI: Record<string, string> = {
  cycling: "\u{1F6B4}",
  indoor_cycling: "\u{1F6B4}",
  running: "\u{1F3C3}",
  treadmill_running: "\u{1F3C3}",
  swimming: "\u{1F3CA}",
  lap_swimming: "\u{1F3CA}",
  open_water_swimming: "\u{1F3CA}",
};

const workoutSportEmoji = (sport: string | undefined): string | null =>
  sport ? (WORKOUT_SPORT_EMOJI[sport.toLowerCase()] ?? null) : null;

/**
 * First coaching activity's icon, else a core workout sport's emoji, else
 * null (the day's mark then renders a plain intensity dot).
 */
export function representativeDaySport(
  matched: MatchedSessionWithMetadata[],
  plans: CoachingActivity[],
  actuals: WorkoutRecord[]
): string | null {
  return (
    matched[0]?.activity.sport.icon ??
    plans[0]?.sport.icon ??
    workoutSportEmoji(actuals[0]?.sport) ??
    null
  );
}
