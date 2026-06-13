import type { MatchedSessionsReadModel } from "../ports/matched-sessions-read-model";
import type { WorkoutRecord } from "../types/calendar-record";
import type { CoachingActivityRecord } from "../types/coaching-activity-record";
import type { SessionMatch } from "../types/session-match";

const collectInto = <T extends { id: string }>(
  store: Map<string, T>,
  ids: readonly string[]
): Map<string, T> => {
  const out = new Map<string, T>();
  for (const id of ids) {
    const row = store.get(id);
    if (row) out.set(id, row);
  }
  return out;
};

export function createInMemoryMatchedSessionsReadModel(
  coaching: Map<string, CoachingActivityRecord>,
  workouts: Map<string, WorkoutRecord>,
  sessionMatch: Map<string, SessionMatch>
): MatchedSessionsReadModel {
  return {
    loadJoinSources: async (activityIds, workoutIds) => ({
      activitiesById: collectInto(coaching, activityIds),
      workoutsById: collectInto(workouts, workoutIds),
    }),

    findActivityMatch: async (profileId, persistedCoachingActivityId) => {
      const match = [...sessionMatch.values()].find(
        (m) =>
          m.profileId === profileId &&
          m.coachingActivityId === persistedCoachingActivityId
      );
      if (!match) return null;

      const workout = workouts.get(match.workoutId);
      if (!workout) return null;

      return { matchId: match.id, workout };
    },
  };
}
