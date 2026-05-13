/**
 * Ensure-match helper — auto-heal invariant for coaching-derived workouts.
 *
 * Used by every coaching-conversion use case (AI, Manual, legacy Convert)
 * AND by the Dexie v10 retro-match migration. Behaviour:
 *
 *   - If a SessionMatch already exists for `(profileId, coachingActivityId)`
 *     OR for `(profileId, workoutId)`, skip silently — preserve whatever
 *     the user (or a concurrent matcher) put there.
 *   - Otherwise, write a fresh match row.
 *
 * Concurrent-write tolerance: if `put` rejects with
 * `SessionAlreadyMatchedError`, the conflicting match is treated as the
 * winning row. Any other persistence error propagates.
 */

import type { SessionMatchRepository } from "../../ports/session-match-repository";
import type {
  SessionMatch,
  SessionMatchSource,
} from "../../types/session-match";
import { SessionAlreadyMatchedError } from "../../types/session-match-errors";

export type EnsureSessionMatchInput = {
  profileId: string;
  coachingActivityId: string;
  workoutId: string;
  date: string;
  source: SessionMatchSource;
  newId: () => string;
  clock: () => string;
};

export const ensureSessionMatch = async (
  sessionMatches: SessionMatchRepository,
  input: EnsureSessionMatchInput
): Promise<{ created: boolean }> => {
  const [activitySide, workoutSide] = await Promise.all([
    sessionMatches.getByActivityId(input.profileId, input.coachingActivityId),
    sessionMatches.getByWorkoutId(input.profileId, input.workoutId),
  ]);
  if (activitySide || workoutSide) return { created: false };

  const match: SessionMatch = {
    id: input.newId(),
    profileId: input.profileId,
    coachingActivityId: input.coachingActivityId,
    workoutId: input.workoutId,
    date: input.date,
    createdAt: input.clock(),
    source: input.source,
    executedWorkoutIds: [],
  };

  try {
    await sessionMatches.put(match);
    return { created: true };
  } catch (err) {
    if (err instanceof SessionAlreadyMatchedError) return { created: false };
    throw err;
  }
};
