import type { WorkoutRecord } from "../types/calendar-record";
import type { Profile } from "../types/profile";
import { thresholdsForSport } from "./athlete";
import {
  dominantZone,
  getStructuredWorkout,
  timeInZone,
} from "./workout-review";
import type { ZoneNumber } from "./zone-colors";

const ZONE_COUNT = 5;

/** Sum each session's zone distribution, weighted by nothing but its shares. */
export function weekDominantZone(
  workouts: readonly WorkoutRecord[],
  profile: Profile | null
): ZoneNumber | null {
  const totals = new Array<number>(ZONE_COUNT).fill(0);
  for (const record of workouts) {
    if (!record.krd) continue;
    const workout = getStructuredWorkout(record.krd);
    if (!workout) continue;
    const dist = timeInZone(workout, thresholdsForSport(profile, record.sport));
    dist.forEach((share, i) => {
      totals[i] = (totals[i] ?? 0) + share;
    });
  }
  return dominantZone(totals);
}
