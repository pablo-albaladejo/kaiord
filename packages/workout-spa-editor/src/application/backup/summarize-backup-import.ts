/**
 * What a backup import did, counted over the file's rows: a row is `added`
 * when this device did not hold it, `updated` when the import changed this
 * device's copy, and `notRestored` when it is missing afterwards (a delete
 * made after the backup suppressed it). `meta` is not counted: this device's
 * own settings always win. Pure.
 */

import type { SnapshotTables } from "../../types/snapshot";
import { rowMergeKey } from "../sync/merge-row-hooks";

type Row = Record<string, unknown>;

export type BackupImportCounts = {
  added: number;
  updated: number;
  notRestored: number;
};

export type BackupImportSummary = BackupImportCounts;

const byKey = (table: string, rows: ReadonlyArray<unknown> = []) =>
  new Map((rows as Row[]).map((row) => [rowMergeKey(table, row), row]));

export const emptyCounts = (): BackupImportCounts => ({
  added: 0,
  updated: 0,
  notRestored: 0,
});

export function countImport(
  counts: BackupImportCounts,
  file: SnapshotTables,
  before: SnapshotTables,
  after: SnapshotTables
): BackupImportCounts {
  const next = { ...counts };
  for (const [table, rows] of Object.entries(file)) {
    if (table === "meta") continue;
    const had = byKey(table, before[table]);
    const has = byKey(table, after[table]);
    for (const key of byKey(table, rows).keys()) {
      const now = has.get(key);
      if (!now) next.notRestored += 1;
      else if (!had.has(key)) next.added += 1;
      else if (JSON.stringify(now) !== JSON.stringify(had.get(key)))
        next.updated += 1;
    }
  }
  return next;
}
