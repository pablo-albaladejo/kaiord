/**
 * exportBackup — the whole database as a `KaiordBackup` file.
 *
 * Reuses `exportSnapshot` for the snapshot tables, filters them through the
 * backup table policy, and adds the nutrition stores of every profile through
 * their repositories. One read transaction spans both, so the file is a
 * single point in time. Nothing local is written: an unclaimed default
 * profile is written to the file as a real one and stays unclaimed here.
 */

import type { EnergyBalanceRepositories } from "../../ports/energy-balance-repositories";
import type { SnapshotPort } from "../../ports/snapshot-port";
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  type BackupNutrition,
  type KaiordBackup,
} from "../../types/backup";
import { exportSnapshot } from "../sync/export-snapshot";
import { applyBackupTablePolicy } from "./backup-table-policy";

export type ExportBackupDeps = {
  port: SnapshotPort;
  nutrition: EnergyBalanceRepositories;
  deviceId: string;
  now?: () => Date;
};

const readNutrition = async (
  repos: EnergyBalanceRepositories,
  profileIds: ReadonlyArray<string>
): Promise<BackupNutrition> => {
  const perProfile = await Promise.all(
    profileIds.map(async (id) => ({
      entries: await repos.intakeEntries.listByProfile(id),
      presets: await repos.intakePresets.getByProfile(id),
      target: await repos.energyTargets.get(id),
    }))
  );
  return {
    intakeEntries: perProfile.flatMap((p) => p.entries),
    intakePresets: perProfile.flatMap((p) => p.presets),
    energyTargets: perProfile.flatMap((p) => (p.target ? [p.target] : [])),
  };
};

const profileIdsOf = (rows: ReadonlyArray<unknown> = []): string[] =>
  rows.map((row) => (row as { id: string }).id);

export const exportBackup = ({
  port,
  nutrition,
  deviceId,
  now,
}: ExportBackupDeps): Promise<KaiordBackup> =>
  port.transaction("r", async () => {
    const snapshot = await exportSnapshot({ port, deviceId, now });
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      manifest: snapshot.manifest,
      tables: applyBackupTablePolicy(snapshot.tables),
      tombstones: snapshot.tombstones,
      nutrition: await readNutrition(
        nutrition,
        profileIdsOf(snapshot.tables.profiles)
      ),
    };
  });
