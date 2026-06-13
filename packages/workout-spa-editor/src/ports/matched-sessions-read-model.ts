/**
 * MatchedSessionsReadModel — the read-only (CQRS query) surface the
 * matched-sessions calendar projections need. Lets the two reactive hooks
 * (`useActivityMatchState`, `useMatchedSessions`) read their join data through
 * the persistence port instead of importing `db` directly, while preserving
 * `useLiveQuery` reactivity: the Dexie adapter issues the same observable table
 * queries the hooks used to inline.
 *
 * The write surface for matches lives on `SessionMatchRepository`; this port is
 * intentionally read-only.
 */

import type { WorkoutRecord } from "../types/calendar-record";
import type { CoachingActivityRecord } from "../types/coaching-activity-record";

/** Coaching-activity and workout lookups, keyed by id, for the calendar join. */
export type MatchedSessionJoinSources = {
  activitiesById: Map<string, CoachingActivityRecord>;
  workoutsById: Map<string, WorkoutRecord>;
};

/** One coaching activity's current match plus its executed workout. */
export type ActivityMatch = {
  matchId: string;
  workout: WorkoutRecord;
};

export type MatchedSessionsReadModel = {
  /**
   * Batch-load the coaching activities and workouts referenced by a set of
   * matches, keyed by id. The caller supplies the id sets (gathered from the
   * matches, including executed-workout ids) so all match-shaped logic stays
   * in the application layer and this port remains a pure fetcher.
   */
  loadJoinSources: (
    activityIds: readonly string[],
    workoutIds: readonly string[]
  ) => Promise<MatchedSessionJoinSources>;
  /**
   * The activity's current match + its executed workout, or `null` when no
   * match exists or the referenced workout is a dangling ref (treated as solo
   * by callers).
   */
  findActivityMatch: (
    profileId: string,
    persistedCoachingActivityId: string
  ) => Promise<ActivityMatch | null>;
};
