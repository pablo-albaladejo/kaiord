/**
 * usePickableWorkouts — workouts the user MAY match a coaching activity
 * to, scoped to one (profile, date, sport) triple.
 *
 * Filter rules (per `spa-coaching-integration` "Match-to picker filter"):
 *   1. Workout's `date` equals the activity's `date`.
 *   2. Workout's canonical sport family equals the activity's sport.
 *   3. Workout is NOT already part of a `SessionMatch` row for the
 *      active profile (workouts matched in another profile remain
 *      candidates here — `SessionMatch` uniqueness is profile-scoped).
 *
 * Live-queried so the picker reactively hides workouts that get matched
 * mid-flight (e.g., the user matches in another tab).
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import { canonicalSportFamily } from "../application/canonical-sport-family";
import type { WorkoutRecord } from "../types/calendar-record";
import type { SessionMatch } from "../types/session-match";

export function usePickableWorkouts(
  profileId: string | null,
  date: string | null,
  sport: string | null
): WorkoutRecord[] | undefined {
  return useLiveQuery<WorkoutRecord[]>(async () => {
    if (!profileId || !date || !sport) return [];

    const targetFamily = canonicalSportFamily(sport);

    const sameDay = await db
      .table<WorkoutRecord>("workouts")
      .where("date")
      .equals(date)
      .toArray();

    if (sameDay.length === 0) return [];

    const matches = await db
      .table<SessionMatch>("sessionMatches")
      .where("profileId")
      .equals(profileId)
      .toArray();

    const matchedWorkoutIds = new Set(matches.map((m) => m.workoutId));

    return sameDay.filter(
      (w) =>
        canonicalSportFamily(w.sport) === targetFamily &&
        !matchedWorkoutIds.has(w.id)
    );
  }, [profileId, date, sport]);
}
