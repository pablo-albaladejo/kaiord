/**
 * Single-purpose `rw` transaction that set-union-appends workout ids
 * into `sessionMatches.executedWorkoutIds`.
 *
 * Idempotent: the merge dedups against the current array, so re-running
 * with the same ids is a no-op. A missing row is also a no-op
 * (concurrent-delete tolerance — matches the `delete` contract).
 */

import type Dexie from "dexie";
import type { Table } from "dexie";

import type { SessionMatch } from "../../types/session-match";
import type { KaiordDatabase } from "./dexie-database";

const unionAppend = (
  current: readonly string[],
  incoming: readonly string[]
): { merged: string[]; changed: boolean } => {
  const seen = new Set(current);
  const merged = [...current];
  let changed = false;
  for (const id of incoming) {
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
    changed = true;
  }
  return { merged, changed };
};

export const appendExecutedWorkoutIdsTx = async (
  db: KaiordDatabase,
  table: () => Table<SessionMatch>,
  matchId: string,
  workoutIds: readonly string[]
): Promise<void> => {
  if (workoutIds.length === 0) return;
  // Cast to plain Dexie to avoid the deep-instantiation error TS hits
  // when matching `db.transaction` overloads against the typed
  // KaiordDatabase tables tuple — same workaround as elsewhere.
  const dexie = db as unknown as Dexie;
  await dexie.transaction("rw", "sessionMatches", async () => {
    const existing = await table().get(matchId);
    if (!existing) return;
    const { merged, changed } = unionAppend(
      existing.executedWorkoutIds,
      workoutIds
    );
    if (!changed) return;
    const next: SessionMatch = { ...existing, executedWorkoutIds: merged };
    await table().put(next);
  });
};
