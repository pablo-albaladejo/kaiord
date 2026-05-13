/**
 * Set-union append helper for the in-memory SessionMatchRepository's
 * `appendExecutedWorkoutIds` writer. Extracted so the entry file stays
 * under the per-file line cap.
 */

import type { SessionMatch } from "../types/session-match";

type Store = Map<string, SessionMatch>;

export const appendExecutedWorkoutIdsInMemory = (
  store: Store,
  id: string,
  workoutIds: readonly string[]
): void => {
  if (workoutIds.length === 0) return;
  const existing = store.get(id);
  if (!existing) return;
  const seen = new Set(existing.executedWorkoutIds);
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
