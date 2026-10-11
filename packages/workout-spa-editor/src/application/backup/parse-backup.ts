/**
 * Reads the text of a `kaiord-backup` file. The shape is checked, not trusted:
 * table rows only need to be records (the import keeps the tables the backup
 * policy allows and rewrites them), while nutrition rows must match their
 * record schemas because they are written to the device-local stores as they
 * come.
 */

import { z } from "zod";

import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  type KaiordBackup,
} from "../../types/backup";
import { energyTargetRecordSchema } from "../../types/energy-target-record";
import { intakeEntryRecordSchema } from "../../types/intake-entry-record";
import { intakePresetRecordSchema } from "../../types/intake-preset-record";

export type BackupFileProblem = "invalid" | "unsupportedVersion" | "newerApp";

export class BackupFileError extends Error {
  readonly reason: BackupFileProblem;

  constructor(reason: BackupFileProblem) {
    super(`Backup file rejected: ${reason}`);
    this.reason = reason;
    this.name = "BackupFileError";
  }
}

const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.number(),
  manifest: z.object({
    schemaVersion: z.number().int().nonnegative(),
    deviceId: z.string(),
    exportedAt: z.iso.datetime(),
    encrypted: z.literal(false),
  }),
  tables: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
  tombstones: z.array(
    z.object({
      table: z.string(),
      id: z.string(),
      deletedAt: z.iso.datetime(),
      profileId: z.string().optional(),
    })
  ),
  nutrition: z.object({
    intakeEntries: z.array(intakeEntryRecordSchema),
    intakePresets: z.array(intakePresetRecordSchema),
    energyTargets: z.array(energyTargetRecordSchema),
  }),
});

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    throw new BackupFileError("invalid");
  }
};

export function parseBackup(text: string): KaiordBackup {
  const parsed = backupSchema.safeParse(parseJson(text));
  if (!parsed.success) throw new BackupFileError("invalid");
  if (parsed.data.version !== BACKUP_VERSION)
    throw new BackupFileError("unsupportedVersion");
  return parsed.data as KaiordBackup;
}
