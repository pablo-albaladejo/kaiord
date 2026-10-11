/**
 * Reads the text of a `kaiord-backup` file. The shape is checked, not trusted:
 * table rows only need to be records (the import keeps the tables the backup
 * policy allows and rewrites them), except the nutrition tables, whose rows
 * must match their record schemas because the screens read them as they are.
 * A version 1 file is folded into the current shape (see `legacy-backup`).
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
import { foldLegacyNutrition, legacyNutritionSchema } from "./legacy-backup";

export type BackupFileProblem = "invalid" | "unsupportedVersion" | "newerApp";

export class BackupFileError extends Error {
  readonly reason: BackupFileProblem;

  constructor(reason: BackupFileProblem) {
    super(`Backup file rejected: ${reason}`);
    this.reason = reason;
    this.name = "BackupFileError";
  }
}

const LEGACY_VERSION = 1;

const nutritionTables = z.object({
  intakeEntries: z.array(intakeEntryRecordSchema).optional(),
  intakePresets: z.array(intakePresetRecordSchema).optional(),
  energyTargets: z.array(energyTargetRecordSchema).optional(),
});

const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.number(),
  manifest: z.object({
    schemaVersion: z.number().int().nonnegative(),
    deviceId: z.string(),
    exportedAt: z.iso.datetime(),
    encrypted: z.literal(false),
  }),
  tables: z
    .record(z.string(), z.array(z.record(z.string(), z.unknown())))
    .refine((tables) => nutritionTables.safeParse(tables).success),
  tombstones: z.array(
    z.object({
      table: z.string(),
      id: z.string(),
      deletedAt: z.iso.datetime(),
      profileId: z.string().optional(),
    })
  ),
  nutrition: z.unknown().optional(),
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
  const { nutrition, version, ...file } = parsed.data;
  if (version === BACKUP_VERSION)
    return { ...file, version: BACKUP_VERSION } as KaiordBackup;
  if (version !== LEGACY_VERSION)
    throw new BackupFileError("unsupportedVersion");
  const legacy = legacyNutritionSchema.safeParse(nutrition);
  if (!legacy.success) throw new BackupFileError("invalid");
  const tables = foldLegacyNutrition(file.tables, legacy.data);
  return { ...file, version: BACKUP_VERSION, tables } as KaiordBackup;
}
