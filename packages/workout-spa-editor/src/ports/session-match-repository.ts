/**
 * SessionMatchRepository port — links a planned coaching activity with the
 * executed workout. Uniqueness is enforced at the adapter layer per
 * `(profileId, coachingActivityId)` AND `(profileId, workoutId)`; violation
 * is surfaced as `SessionAlreadyMatchedError` from `put`.
 *
 * The cascade helpers (`deleteByActivityId`, `deleteByWorkoutId`,
 * `deleteByProfile`) are no-ops on missing rows — concurrent-delete
 * tolerance matches the convention of `CoachingRepository.delete`.
 */

import type { SessionMatch } from "../types/session-match";

export type SessionMatchRepository = {
  put: (match: SessionMatch) => Promise<void>;
  /**
   * Rewrites the `coachingActivityId` of an existing match row in-place.
   *
   * Used by `healSessionMatchIdShape` to migrate legacy SHORT-form rows
   * (`"${source}:${sourceId}"`) to the canonical COMPOSITE shape
   * (`"${profileId}:${source}:${sourceId}"`) without churning the row's
   * primary key — preserves the same `(matchId, workoutId, date)` so the
   * calendar hydrate join immediately picks the healed row up on next
   * `useLiveQuery` tick. Throws `SessionAlreadyMatchedError` if the new
   * id collides with a different row's index slot.
   */
  updateCoachingActivityId: (
    matchId: string,
    newCoachingActivityId: string
  ) => Promise<void>;
  /** Direct lookup by primary key. Used by unmatchSession to verify ownership. */
  getById: (id: string) => Promise<SessionMatch | undefined>;
  getByActivityId: (
    profileId: string,
    coachingActivityId: string
  ) => Promise<SessionMatch | undefined>;
  getByWorkoutId: (
    profileId: string,
    workoutId: string
  ) => Promise<SessionMatch | undefined>;
  /** Inclusive `[weekStart, weekEnd]` lookup for the calendar week view. */
  listByProfileAndWeek: (
    profileId: string,
    weekStart: string,
    weekEnd: string
  ) => Promise<SessionMatch[]>;
  /** No-op when the row does not exist. */
  delete: (id: string) => Promise<void>;
  /** Cascade hook: deletes any matches whose `coachingActivityId` matches. */
  deleteByActivityId: (coachingActivityId: string) => Promise<void>;
  /** Cascade hook: deletes any matches whose `workoutId` matches. */
  deleteByWorkoutId: (workoutId: string) => Promise<void>;
  /** Cascade hook on profile delete. */
  deleteByProfile: (profileId: string) => Promise<void>;
};
