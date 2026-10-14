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
  energyTargets: ["profileId"],
};

type Row = Record<string, unknown>;

/** Build a stable string key from a row's primary-key field(s). */
export function recordKey(table: string, row: Row): string {
  const fields = PRIMARY_KEYS[table] ?? ["id"];
  return fields.map((f) => String(row[f] ?? "")).join("\u0000");
}

/**
 * Composite-key tables whose user deletes ARE tombstoned: the tombstone id
 * joins the key fields with `:`, profile first, so a re-keyed auto profile's
 * tombstones are dropped like its other `<profileId>:`-prefixed ones.
 */
const COMPOSITE_TOMBSTONED: ReadonlySet<string> = new Set(["aiModelBindings"]);

/**
 * The id a tombstone files a row under: its single-field primary key (`id`,
 * or `profileId` for `energyTargets`), or the `:`-joined composite key of a
 * `COMPOSITE_TOMBSTONED` table. Any other composite key has none, so those
 * rows are never suppressed.
 */
export function tombstoneIdOf(table: string, row: Row): string | undefined {
  const fields = PRIMARY_KEYS[table] ?? ["id"];
  if (fields.length > 1 && !COMPOSITE_TOMBSTONED.has(table)) return undefined;
  const parts = fields.map((f) => row[f]);
  if (!parts.every((v) => typeof v === "string")) return undefined;
  return parts.join(":");
}

/** Comparison clock for a row: `updatedAt` else `createdAt` else epoch 0. */
export function recordClock(row: Row): number {
  const stamp = row.updatedAt ?? row.createdAt;
  if (typeof stamp !== "string") return 0;
  const ms = Date.parse(stamp);
  return Number.isNaN(ms) ? 0 : ms;
}
