/**
 * Dexie Migration Helpers
 *
 * Pure row-level upgrade functions. Co-located with `dexie-database.ts`
 * but split out so the database class stays under the per-file line cap.
 */

import type { Transaction } from "dexie";

export function backfillUsageRow(row: Record<string, unknown>): void {
  if (typeof row.inputTokens === "number") return;
  const total = typeof row.totalTokens === "number" ? row.totalTokens : 0;
  row.inputTokens = total;
  row.outputTokens = 0;
  row.legacy = true;

  if (Array.isArray(row.entries)) {
    row.entries = row.entries.map((entry: Record<string, unknown>) => {
      if (typeof entry.inputTokens === "number") return entry;
      const tokens = typeof entry.tokens === "number" ? entry.tokens : 0;
      return { ...entry, inputTokens: tokens, outputTokens: 0 };
    });
  }
}

/**
 * v5 → v6: defaults `pendingClear` and `lastSuccessfulFingerprint` on
 * existing bridge rows so the profile-snapshot pusher can rely on
 * well-defined state.
 */
export function backfillBridgeSnapshotState(
  row: Record<string, unknown>
): void {
  if (typeof row.pendingClear !== "boolean") row.pendingClear = false;
  if (row.lastSuccessfulFingerprint === undefined) {
    row.lastSuccessfulFingerprint = null;
  }
}

/**
 * v7 → v8: stamps `createdAt` on legacy AI provider rows so getAll()
 * can orderBy("createdAt") and produce a stable insertion-order listing.
 *
 * Legacy rows have no insertion timestamp; we cannot reconstruct one,
 * so the upgrade collapses them to a single shared `Date.now()` value
 * captured at upgrade time. Their relative order among themselves
 * remains undefined (the secondary sort falls back to UUID-pk order),
 * but every provider added AFTER the upgrade strictly outranks them.
 * This is acceptable because the affected window is a one-time backfill
 * on already-installed users; the bug it fixes (UUID lottery on every
 * page load) is permanent.
 */
export function makeBackfillAiProviderCreatedAt(
  now: number = Date.now()
): (row: Record<string, unknown>) => void {
  return (row) => {
    if (typeof row.createdAt !== "number") row.createdAt = now;
  };
}

export const applyV8Upgrade = async (tx: Transaction): Promise<void> => {
  await tx
    .table("aiProviders")
    .toCollection()
    .modify(makeBackfillAiProviderCreatedAt());
};
