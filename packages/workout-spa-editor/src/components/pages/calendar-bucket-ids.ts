/**
 * The id sets `buildCalendarBuckets` dedups with: the renderable ids of the
 * week's executed activities, and every workout a match absorbs.
 */
import type { MatchedSessionWithMetadata as PageMatchedSession } from "../../hooks/use-matched-sessions";
import type { ActivityRecord } from "../../types/activity-record";

export const collectExecutedRefIds = (
  activitiesByDay: Record<string, ActivityRecord[]>
): Set<string> =>
  new Set(
    Object.values(activitiesByDay)
      .flat()
      .map((a) => a.linkedWorkoutId ?? a.id)
  );

export const collectMatchedWorkoutIds = (
  matched: PageMatchedSession[],
  crossWeek: Iterable<string> = []
): Set<string> => {
  const out = new Set<string>(crossWeek);
  for (const m of matched) {
    out.add(m.workout.id);
    // Tolerate raw/pre-v12 rows that may lack the executed slot (see
    // use-matched-sessions-hydrate-helpers).
    for (const wid of m.match.executedWorkoutIds ?? []) out.add(wid);
  }
  return out;
};
