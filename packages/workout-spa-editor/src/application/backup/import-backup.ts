/**
 * importBackup — merges a `kaiord-backup` file into this device, never
 * replacing it: `exportSnapshot(local) → merge with the file → reconcile the
 * default profile → importSnapshot`, then the device-local rewrite (default
 * profile's rows re-keyed, the file's nutrition merged in). Everything runs in
 * one read-write transaction, so a failure leaves the database as it was and
 * no write can land between the read and the import. When the file holds
 * several profiles and this device only has its unclaimed default profile,
 * nothing is written and the caller asks which one to join (`choice`).
 */

import type { SnapshotPort } from "../../ports/snapshot-port";
import type { KaiordBackup } from "../../types/backup";
import type { SnapshotTables } from "../../types/snapshot";
import { exportSnapshot } from "../sync/export-snapshot";
import { importSnapshot } from "../sync/import-snapshot";
import type { ProfileChoice } from "../sync/reconcile-auto-profile";
import { mergeBackupNutrition, ownedNutrition } from "./merge-backup-nutrition";
import { BackupFileError } from "./parse-backup";
import {
  backupSnapshot,
  prepareBackupSnapshot,
} from "./prepare-backup-snapshot";
import {
  type BackupImportSummary,
  countImport,
  emptyCounts,
} from "./summarize-backup-import";

export type ImportBackupDeps = {
  port: SnapshotPort;
  deviceId: string;
  backup: KaiordBackup;
  /** The profile picked after a `needsChoice` result. */
  choice?: string | null;
  now?: () => Date;
};

export type ImportBackupResult =
  | { kind: "imported"; summary: BackupImportSummary }
  | { kind: "needsChoice"; candidates: ProfileChoice[] };

export const importBackup = ({
  port,
  deviceId,
  backup,
  choice = null,
  now,
}: ImportBackupDeps): Promise<ImportBackupResult> =>
  port.transaction("rw", async (): Promise<ImportBackupResult> => {
    if (backup.manifest.schemaVersion > (await port.schemaVersion()))
      throw new BackupFileError("newerApp");
    const local = await exportSnapshot({ port, deviceId, now });
    const prepared = prepareBackupSnapshot(
      local,
      backup,
      port.perProfileTables(),
      { choice, now }
    );
    if (prepared.kind === "needsChoice") return prepared;
    const { snapshot, deviceLocalRekey } = prepared;
    await importSnapshot({ port, snapshot, now });
    const merge = {
      rekey: deviceLocalRekey,
      nutrition: backup.nutrition,
      profileIds: new Set(
        (snapshot.tables.profiles ?? []).map((p) => (p as { id: string }).id)
      ),
    };
    let nutritionBefore: SnapshotTables = {};
    let nutritionAfter: SnapshotTables = {};
    await port.updateDeviceLocal((tables) => {
      nutritionBefore = tables;
      nutritionAfter = mergeBackupNutrition(merge)(tables);
      return nutritionAfter;
    });
    const counts = countImport(
      countImport(
        emptyCounts(),
        backupSnapshot(backup).tables,
        local.tables,
        snapshot.tables
      ),
      ownedNutrition(merge),
      nutritionBefore,
      nutritionAfter
    );
    const { intakeEntries, intakePresets } = backup.nutrition;
    const nutritionMayReappear =
      intakeEntries.length + intakePresets.length > 0;
    return { kind: "imported", summary: { ...counts, nutritionMayReappear } };
  });
