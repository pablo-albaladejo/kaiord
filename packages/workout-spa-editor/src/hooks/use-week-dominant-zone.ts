/**
 * The dominant training zone of the current week — the value `--core-live`
 * takes on the header mark's wrapper (#1118).
 *
 * It is the week the athlete is in, not the week the calendar happens to be
 * showing: the mark is app chrome and is on screen from every route, so a
 * value that changed while paging through past weeks would read as a property
 * of the navigation rather than of the training.
 *
 * Returns `null` for a week with nothing classifiable — no sessions, or only
 * raw imports. That is not a failure state: the caller declares no custom
 * property at all and the core inherits the ink the role layer already
 * carries.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import { thresholdsForSport } from "../lib/athlete";
import {
  dominantZone,
  getStructuredWorkout,
  timeInZone,
} from "../lib/workout-review";
import type { ZoneNumber } from "../lib/zone-colors";
import type { WorkoutRecord } from "../types/calendar-record";
import type { Profile } from "../types/profile";
import { getCurrentWeekId, parseWeekId } from "../utils/week-utils";

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

export function useWeekDominantZone(
  profileId: string | null,
  profile: Profile | null
): ZoneNumber | null {
  const range = parseWeekId(getCurrentWeekId());
  const zone = useLiveQuery(async (): Promise<ZoneNumber | null> => {
    if (!range || !profileId) return null;
    const workouts = await db
      .table<WorkoutRecord>("workouts")
      .where("[profileId+date]")
      .between([profileId, range.start], [profileId, range.end], true, true)
      .toArray();
    return weekDominantZone(workouts, profile);
  }, [profileId, profile, range?.start, range?.end]);
  return zone ?? null;
}
