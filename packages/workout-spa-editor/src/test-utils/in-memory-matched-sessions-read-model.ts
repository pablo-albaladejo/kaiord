import type { MatchedSessionsReadModel } from "../ports/matched-sessions-read-model";
import type { WorkoutRecord } from "../types/calendar-record";
import type { CoachingActivityRecord } from "../types/coaching-activity-record";

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
  workouts: Map<string, WorkoutRecord>
): MatchedSessionsReadModel {
  return {
    loadJoinSources: async (activityIds, workoutIds) => ({
      activitiesById: collectInto(coaching, activityIds),
      workoutsById: collectInto(workouts, workoutIds),
    }),
  };
}
