/**
 * Sessions of this week's coach activities that are matched in another week
 * (design §3.6): a session moved across a week boundary renders in the week
 * of `match.date`, so this week hides its plan, its workout and its
 * recordings. Read inside `useMatchedSessions`' live query and perf measure.
 */
import type { PersistencePort } from "../ports/persistence-port";

export type CrossWeekMatches = {
  /** View-model coach activity ids (`${source}:${sourceId}`). */
  crossWeekMatchedActivityIds: ReadonlySet<string>;
  /** Each match's `workoutId` plus its `executedWorkoutIds`. */
  crossWeekMatchedWorkoutIds: ReadonlySet<string>;
};

export const NO_CROSS_WEEK: CrossWeekMatches = {
  crossWeekMatchedActivityIds: new Set(),
  crossWeekMatchedWorkoutIds: new Set(),
};

export const queryCrossWeekMatches = async (
  persistence: Pick<PersistencePort, "coaching" | "sessionMatch">,
  profileId: string,
  days: string[]
): Promise<CrossWeekMatches> => {
  const first = days[0] ?? "";
  const last = days.at(-1) ?? first;
  const activities = await persistence.coaching.getByProfileAndDateRange(
    profileId,
    first,
    last
  );
  if (activities.length === 0) return NO_CROSS_WEEK;
  const viewIds = new Map(
    activities.map((a) => [a.id, `${a.source}:${a.sourceId}`])
  );
  const matches = await persistence.sessionMatch.listByActivityIds(
    profileId,
    activities.map((a) => a.id)
  );
  const outside = matches.filter((m) => m.date < first || m.date > last);
  if (outside.length === 0) return NO_CROSS_WEEK;
  return {
    crossWeekMatchedActivityIds: new Set(
      outside.flatMap((m) => viewIds.get(m.coachingActivityId) ?? [])
    ),
    crossWeekMatchedWorkoutIds: new Set(
      outside.flatMap((m) => [m.workoutId, ...(m.executedWorkoutIds ?? [])])
    ),
  };
};
