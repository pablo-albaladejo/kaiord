/**
 * The "export my data" file: the snapshot tables a backup carries (see
 * `application/backup/backup-table-policy`), their tombstones, and the
 * nutrition stores, which never ride the snapshot and are read through their
 * repositories. Plain JSON, not encrypted.
 */

import type { EnergyTargetRecord } from "./energy-target-record";
import type { IntakeEntryRecord } from "./intake-entry-record";
import type { IntakePresetRecord } from "./intake-preset-record";
import type { SnapshotManifest, SnapshotTables, Tombstone } from "./snapshot";

export const BACKUP_FORMAT = "kaiord-backup";
export const BACKUP_VERSION = 1;

export type BackupNutrition = {
  intakeEntries: IntakeEntryRecord[];
  intakePresets: IntakePresetRecord[];
  energyTargets: EnergyTargetRecord[];
};

export type KaiordBackup = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  manifest: SnapshotManifest;
  tables: SnapshotTables;
  tombstones: ReadonlyArray<Tombstone>;
  nutrition: BackupNutrition;
};
