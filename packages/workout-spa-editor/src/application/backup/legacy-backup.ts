/**
 * Version 1 backup files kept nutrition in a `nutrition` field, read through
 * the repositories, because it did not ride the snapshot. Their intake entries
 * and presets also predate the `updatedAt` sync clock. Reading one folds that
 * field into `tables` and backfills the clock the way the v37 Dexie upgrade
 * does (entries from `loggedAt`, presets from `createdAt`), so the rest of the
 * import only ever sees the current shape.
 */

import { z } from "zod";

import { energyTargetRecordSchema } from "../../types/energy-target-record";
import { intakeEntryRecordSchema } from "../../types/intake-entry-record";
import { intakePresetRecordSchema } from "../../types/intake-preset-record";
import type { SnapshotTables } from "../../types/snapshot";

const unclocked = { updatedAt: z.iso.datetime().optional() };

export const legacyNutritionSchema = z.object({
  intakeEntries: z.array(intakeEntryRecordSchema.extend(unclocked)),
  intakePresets: z.array(intakePresetRecordSchema.extend(unclocked)),
  energyTargets: z.array(energyTargetRecordSchema),
});

type LegacyNutrition = z.infer<typeof legacyNutritionSchema>;

export const foldLegacyNutrition = (
  tables: SnapshotTables,
  nutrition: LegacyNutrition
): SnapshotTables => ({
  ...tables,
  intakeEntries: nutrition.intakeEntries.map((row) => ({
    ...row,
    updatedAt: row.updatedAt ?? row.loggedAt,
  })),
  intakePresets: nutrition.intakePresets.map((row) => ({
    ...row,
    updatedAt: row.updatedAt ?? row.createdAt,
  })),
  energyTargets: nutrition.energyTargets,
});
