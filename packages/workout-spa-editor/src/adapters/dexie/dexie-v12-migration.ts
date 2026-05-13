/**
 * v11 → v12 migration — `SessionMatch.executedWorkoutIds` backfill.
 *
 * Adds the `executedWorkoutIds: string[]` field to every existing row,
 * defaulting to `[]` so 1–N executed activities (e.g., Garmin/FIT)
 * can be auto-linked to the same prescribed+structured slot. Schema
 * unchanged from v8 (no new index — queries go by primary key or
 * live-query scan over the `[profileId+date]` index that already
 * exists).
 *
 * Idempotent: re-running on a row that already has the array is a
 * no-op (the field is left in place).
 */
import type { Transaction } from "dexie";

type MatchRow = { id: string; executedWorkoutIds?: string[] };

export const applyV12Upgrade = async (tx: Transaction): Promise<void> => {
  await tx
    .table("sessionMatches")
    .toCollection()
    .modify((row: MatchRow) => {
      if (!Array.isArray(row.executedWorkoutIds)) {
        row.executedWorkoutIds = [];
      }
    });
};
