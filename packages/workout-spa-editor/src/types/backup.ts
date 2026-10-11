/**
 * The "export my data" file: the snapshot tables a backup carries (see
 * `application/backup/backup-table-policy`) and their tombstones. Plain JSON,
 * not encrypted. Version 2 carries nutrition in `tables`, like every other
 * synced store; version 1 files kept it apart (see `legacy-backup`).
 */

import type { SnapshotManifest, SnapshotTables, Tombstone } from "./snapshot";

export const BACKUP_FORMAT = "kaiord-backup";
export const BACKUP_VERSION = 2;

export type KaiordBackup = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  manifest: SnapshotManifest;
  tables: SnapshotTables;
  tombstones: ReadonlyArray<Tombstone>;
};
