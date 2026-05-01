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
