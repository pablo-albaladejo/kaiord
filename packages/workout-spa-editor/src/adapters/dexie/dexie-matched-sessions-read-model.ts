/**
 * Dexie MatchedSessionsReadModel
 *
 * IndexedDB-backed read-model for the matched-sessions calendar projections.
 * Issues the same observable Dexie queries the two hooks used to inline, so
 * `useLiveQuery` reactivity is preserved when the hooks read through the port.
 */

import type { MatchedSessionsReadModel } from "../../ports/matched-sessions-read-model";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { SessionMatch } from "../../types/session-match";
import type { KaiordDatabase } from "./dexie-database";

export function createDexieMatchedSessionsReadModel(
  db: KaiordDatabase
): MatchedSessionsReadModel {
  const activities = () =>
    db.table<CoachingActivityRecord>("coachingActivities");
  const workouts = () => db.table<WorkoutRecord>("workouts");
  const sessionMatches = () => db.table<SessionMatch>("sessionMatches");

  return {
    loadJoinSources: async (activityIds, workoutIds) => {
      const [activityRows, workoutRows] = await Promise.all([
        activities()
          .where("id")
          .anyOf([...activityIds])
          .toArray(),
        workouts()
          .where("id")
          .anyOf([...workoutIds])
          .toArray(),
      ]);
      return {
        activitiesById: new Map(activityRows.map((a) => [a.id, a])),
        workoutsById: new Map(workoutRows.map((w) => [w.id, w])),
      };
    },

    findActivityMatch: async (profileId, persistedCoachingActivityId) => {
      const match = await sessionMatches()
        .where("[profileId+coachingActivityId]")
        .equals([profileId, persistedCoachingActivityId])
        .first();
      if (!match) return null;

      const workout = await workouts().get(match.workoutId);
      // Dangling-ref tolerance: the match exists but the workout is gone
      // (mid-cascade race). Callers treat null as solo.
      if (!workout) return null;

      return { matchId: match.id, workout };
    },
  };
}
