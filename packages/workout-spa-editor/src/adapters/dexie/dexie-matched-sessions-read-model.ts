/**
 * Dexie MatchedSessionsReadModel
 *
 * IndexedDB-backed read-model for the matched-sessions calendar projections.
 * Issues the same observable Dexie queries the two hooks used to inline, so
 * `useLiveQuery` reactivity is preserved when the hooks read through the port.
 */

import { activityToWorkoutRecord } from "../../application/coaching/activity-to-workout-record";
import type { MatchedSessionsReadModel } from "../../ports/matched-sessions-read-model";
import type { ActivityRecord } from "../../types/activity-record";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { CoachingActivityRecord } from "../../types/coaching-activity-record";
import type { SessionMatch } from "../../types/session-match";
import type { KaiordDatabase } from "./dexie-database";

export function createDexieMatchedSessionsReadModel(
  db: KaiordDatabase
): MatchedSessionsReadModel {
  const activities = () =>
    db.table<CoachingActivityRecord>("coachingActivities");
  const executedActivities = () => db.table<ActivityRecord>("activities");
  const workouts = () => db.table<WorkoutRecord>("workouts");
  const sessionMatches = () => db.table<SessionMatch>("sessionMatches");

  return {
    loadJoinSources: async (activityIds, workoutIds) => {
      const [activityRows, workoutRows, executedActivityRows] =
        await Promise.all([
          activities()
            .where("id")
            .anyOf([...activityIds])
            .toArray(),
          workouts()
            .where("id")
            .anyOf([...workoutIds])
            .toArray(),
          executedActivities()
            .where("id")
            .anyOf([...workoutIds])
            .toArray(),
        ]);
      const workoutsById = new Map(workoutRows.map((w) => [w.id, w]));
      // No-twin executed activities (e.g. the Garmin pull) have no
      // WorkoutRecord; project one so the executed slot renders through the
      // unchanged resolveExecuted join. Real WorkoutRecords win on id clash.
      for (const a of executedActivityRows) {
        if (!workoutsById.has(a.id)) {
          workoutsById.set(a.id, activityToWorkoutRecord(a));
        }
      }
      return {
        activitiesById: new Map(activityRows.map((a) => [a.id, a])),
        workoutsById,
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
