/**
 * In-Memory SessionMatchRepository — conflict detectors.
 *
 * Used by writers to enforce `(profileId, coachingActivityId)` and
 * `(profileId, workoutId)` uniqueness invariants. Both helpers ignore
 * the row being written (`m.id !== match.id`) so an update on the
 * same primary key is not flagged as a conflict against itself.
 */

import type { SessionMatch } from "../types/session-match";

type Store = Map<string, SessionMatch>;

export const findActivityConflict = (
  store: Store,
  match: SessionMatch
): SessionMatch | undefined =>
  [...store.values()].find(
    (m) =>
      m.id !== match.id &&
      m.profileId === match.profileId &&
      m.coachingActivityId === match.coachingActivityId
  );

export const findWorkoutConflict = (
  store: Store,
  match: SessionMatch
): SessionMatch | undefined =>
  [...store.values()].find(
    (m) =>
      m.id !== match.id &&
      m.profileId === match.profileId &&
      m.workoutId === match.workoutId
  );
