/**
 * Snapshot merge helpers — record identity and comparison clocks.
 *
 * Pure helpers used by `mergeSnapshots`: which tables lack per-record
 * timestamps, how to key a row by its primary key, and how to read the
 * comparison timestamp (`updatedAt` → `createdAt`). No I/O.
 */

/** Tables whose rows carry no `updatedAt`/`createdAt`; merged by manifest. */
export const TIMESTAMPLESS_TABLES: ReadonlySet<string> = new Set(["meta"]);

/** Per-table primary-key fields; defaults to `["id"]` when unlisted. */
const PRIMARY_KEYS: Readonly<Record<string, ReadonlyArray<string>>> = {
  meta: ["key"],
  syncState: ["source"],
  userPreferences: ["profileId"],
  autoMatchDismissals: ["profileId", "weekStart"],
  coachingSyncState: ["source", "profileId"],
  bridges: ["extensionId"],
  aiModelBindings: ["profileId", "purpose"],
  dataTypeSourcePolicy: ["profileId", "dataType"],
};

type Row = Record<string, unknown>;

/** Build a stable string key from a row's primary-key field(s). */
export function recordKey(table: string, row: Row): string {
  const fields = PRIMARY_KEYS[table] ?? ["id"];
  return fields.map((f) => String(row[f] ?? "")).join("\u0000");
}

/** Comparison clock for a row: `updatedAt` else `createdAt` else epoch 0. */
export function recordClock(row: Row): number {
  const stamp = row.updatedAt ?? row.createdAt;
  if (typeof stamp !== "string") return 0;
  const ms = Date.parse(stamp);
  return Number.isNaN(ms) ? 0 : ms;
}
