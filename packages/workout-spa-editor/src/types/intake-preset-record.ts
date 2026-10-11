/**
 * IntakePresetRecord — a reusable quick-log intake preset.
 *
 * Stored in the `intakePresets` Dexie table (v26), keyed on a nanoid `id`
 * with a `profileId` index for the per-profile preset list. Applying a preset
 * creates an `IntakeEntryRecord` from its values. It rides the cloud
 * snapshot; `updatedAt` is its last-write-wins clock (v37 backfilled it from
 * `createdAt`).
 */

import { mealSlotSchema } from "@kaiord/core";
import { z } from "zod";

const nonNegative = z.number().nonnegative();

export const intakePresetRecordSchema = z
  .object({
    id: z.string().min(1),
    profileId: z.string().min(1),
    label: z.string().min(1).max(120),
    kcal: nonNegative,
    proteinG: nonNegative,
    carbG: nonNegative,
    fatG: nonNegative,
    defaultMealSlot: mealSlotSchema.optional(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();

export type IntakePresetRecord = z.infer<typeof intakePresetRecordSchema>;
