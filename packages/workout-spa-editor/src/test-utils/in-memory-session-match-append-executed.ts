/**
 * Set-union append helper for the in-memory SessionMatchRepository's
 * `appendExecutedWorkoutIds` writer. Extracted so the entry file stays
 * under the per-file line cap.
 */

import {
  idsHeldByOtherMatches,
  type SessionMatch,
} from "../types/session-match";

type Store = Map<string, SessionMatch>;

export const appendExecutedWorkoutIdsInMemory = (
  store: Store,
  id: string,
  workoutIds: readonly string[]
): void => {
  if (workoutIds.length === 0) return;
  const existing = store.get(id);
  if (!existing) return;
  const held = idsHeldByOtherMatches(
    [...store.values()].filter((m) => m.profileId === existing.profileId),
    id
  );
  const seen = new Set([...existing.executedWorkoutIds, ...held]);
  const merged = [...existing.executedWorkoutIds];
  let changed = false;
  for (const wid of workoutIds) {
    if (seen.has(wid)) continue;
    seen.add(wid);
    merged.push(wid);
    changed = true;
  }
  if (!changed) return;
  store.set(id, { ...existing, executedWorkoutIds: merged });
};
