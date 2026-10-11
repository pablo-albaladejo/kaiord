/**
 * The "export my data" file: the snapshot tables a backup carries (see
 * `application/backup/backup-table-policy`) and their tombstones. Plain JSON,
 * not encrypted. Version 2 carries nutrition in `tables`, like every other
 * synced store; version 1 files kept it apart (see `legacy-backup`). An
 * empty `nutrition` stub stays in version 2 files only so an app that reads
 * version 1 (whose schema requires it) reports an unsupported version rather
 * than a file that is not a backup; this app ignores it.
 */

import type { SnapshotManifest, SnapshotTables, Tombstone } from "./snapshot";

export const BACKUP_FORMAT = "kaiord-backup";
export const BACKUP_VERSION = 2;

export const EMPTY_NUTRITION_STUB = {
  intakeEntries: [],
  intakePresets: [],
  energyTargets: [],
} as const;

export type KaiordBackup = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  manifest: SnapshotManifest;
  tables: SnapshotTables;
  tombstones: ReadonlyArray<Tombstone>;
  nutrition?: typeof EMPTY_NUTRITION_STUB;
};
