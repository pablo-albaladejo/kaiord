import type { Translate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { Workout } from "../../../types/krd";
import { getStructuredWorkout } from "../../../utils/structured-workout";
import { calculateWorkoutStats } from "../../../utils/workout-stats";

const SPORTS = new Set(["cycling", "running", "swimming", "strength"]);

/** Source id → the word the card says. Unknown sources show as they are. */
const ORIGINS: Record<string, string> = {
  scratch: "kaiord",
  kaiord: "kaiord",
  manual: "manual",
  train2go: "train2go",
  garmin: "garmin",
  "garmin-bridge": "garmin",
  trainingpeaks: "trainingpeaks",
  "trainingpeaks-bridge": "trainingpeaks",
  "auto-coaching": "coach",
  "ai-generated": "ai",
  "ai-extracted": "ai",
};

export const sportLabel = (t: Translate, sport: string): string =>
  SPORTS.has(sport) ? t(`sport.${sport}`) : sport;

export const originLabel = (t: Translate, source: string): string =>
  source in ORIGINS ? t(`origin.${ORIGINS[source]}`) : source;

/** The KRD's own name first: it is the one the editor shows and saves. */
export const cardTitle = (workout: WorkoutRecord): string | undefined =>
  (workout.krd ? getStructuredWorkout(workout.krd)?.name : undefined) ||
  workout.raw?.title ||
  undefined;

/** The raw import's stated duration, else the structure's when computable. */
export function cardDurationSeconds(workout: WorkoutRecord): number | null {
  if (workout.raw?.duration) return workout.raw.duration.value;
  const structured = workout.krd ? getStructuredWorkout(workout.krd) : null;
  if (!structured) return null;
  return calculateWorkoutStats(structured as Workout).totalDuration;
}
