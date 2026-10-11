/**
 * IntakeEntryRecord — a manually-logged nutrition intake entry for one day.
 *
 * Stored in the `intakeEntries` Dexie table (v26), keyed on a nanoid `id`
 * with a `[profileId+date]` index for the per-day roll-up reads. It rides the
 * cloud snapshot; `updatedAt` is its last-write-wins clock and is stamped by
 * every writer (v37 backfilled it from `loggedAt`).
 *
 * Reuses the core `mealSlotSchema` value object so the SPA and core agree on
 * the meal-slot enum. Energy + macro values are non-negative (an empty meal
 * is allowed; a negative one is not).
 */

import { mealSlotSchema } from "@kaiord/core";
import { z } from "zod";

const nonNegative = z.number().nonnegative();

export const intakeEntryRecordSchema = z
  .object({
    id: z.string().min(1),
    profileId: z.string().min(1),
    /** YYYY-MM-DD in the user's local timezone (matches health-record convention). */
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    loggedAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    label: z.string().max(120).optional(),
    mealSlot: mealSlotSchema.optional(),
    kcal: nonNegative,
    proteinG: nonNegative,
    carbG: nonNegative,
    fatG: nonNegative,
  })
  .strict();

export type IntakeEntryRecord = z.infer<typeof intakeEntryRecordSchema>;
