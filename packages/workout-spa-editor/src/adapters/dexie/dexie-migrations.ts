/**
 * Dexie Migration Helpers
 *
 * Pure row-level upgrade functions. Co-located with `dexie-database.ts`
 * but split out so the database class stays under the per-file line cap.
 */

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
