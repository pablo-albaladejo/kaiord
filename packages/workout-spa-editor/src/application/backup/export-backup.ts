/**
 * exportBackup — the whole database as a `KaiordBackup` file.
 *
 * Reuses `exportSnapshot` for the snapshot tables (nutrition included) and
 * filters them through the backup table policy, in one read transaction, so
 * the file is a single point in time. Nothing local is written: an unclaimed
 * default profile is written to the file as a real one and stays unclaimed
 * here. Rows of a profile deleted here that came back from Drive before the
 * sync learned to drop them are left out (`dropDeletedProfileRows`).
 */

import type { SnapshotPort } from "../../ports/snapshot-port";
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  EMPTY_NUTRITION_STUB,
  type KaiordBackup,
} from "../../types/backup";
import { dropDeletedProfileRows } from "../sync/drop-deleted-profile-rows";
import { exportSnapshot } from "../sync/export-snapshot";
import { applyBackupTablePolicy } from "./backup-table-policy";

export type ExportBackupDeps = {
  port: SnapshotPort;
  deviceId: string;
  now?: () => Date;
};

export const exportBackup = ({
  port,
  deviceId,
  now,
}: ExportBackupDeps): Promise<KaiordBackup> =>
  port.transaction("r", async () => {
    const snapshot = dropDeletedProfileRows(
      await exportSnapshot({ port, deviceId, now }),
      port.perProfileTables()
    );
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      manifest: snapshot.manifest,
      tables: applyBackupTablePolicy(snapshot.tables),
      tombstones: snapshot.tombstones,
      nutrition: EMPTY_NUTRITION_STUB,
    };
  });
