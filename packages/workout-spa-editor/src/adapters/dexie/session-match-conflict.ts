/**
 * Compound-uniqueness check for SessionMatch — Dexie has no native
 * compound-unique constraint beyond the primary key, so we read-then-throw
 * inside the same `rw` transaction as the put.
 */

import type { Table } from "dexie";

import type { SessionMatch } from "../../types/session-match";
import { SessionAlreadyMatchedError } from "../../types/session-match-errors";

export const assertNoSessionMatchConflict = async (
  t: Table<SessionMatch>,
  match: SessionMatch
): Promise<void> => {
  const byActivity = await t
    .where("[profileId+coachingActivityId]")
    .equals([match.profileId, match.coachingActivityId])
    .first();
  if (byActivity && byActivity.id !== match.id) {
    throw new SessionAlreadyMatchedError(
      `activity ${match.coachingActivityId} already matched in profile ${match.profileId}`
    );
  }
  const byWorkout = await t
    .where("[profileId+workoutId]")
    .equals([match.profileId, match.workoutId])
    .first();
  if (byWorkout && byWorkout.id !== match.id) {
    throw new SessionAlreadyMatchedError(
      `workout ${match.workoutId} already matched in profile ${match.profileId}`
    );
  }
};
