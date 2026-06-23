/**
 * EnergyTargetRecord — the single active deficit/surplus goal for a profile.
 *
 * Stored in the device-local `energyTargets` Dexie table (v25), keyed on
 * `profileId` so there is exactly one active goal per profile (a new goal
 * overwrites the prior one). PII; excluded from the cloud snapshot.
 *
 * Reuses the core `goalTypeSchema` value object so the SPA and core agree on
 * the goal-type enum (`fat_loss` | `muscle_gain` | `maintain`).
 */

import { goalTypeSchema } from "@kaiord/core";
import { z } from "zod";

export const energyTargetRecordSchema = z
  .object({
    profileId: z.string().min(1),
    goalType: goalTypeSchema,
    startWeightKg: z.number().positive(),
    targetWeightKg: z.number().positive(),
    /** YYYY-MM-DD target date for reaching the goal weight. */
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /**
     * When true the user accepted an unsafe pace: the goal math returns the raw
     * (unclamped) delta while still flagging the cap so the warning stays.
     * Absent on goals saved before the override existed (treated as false).
     */
    overrideCap: z.boolean().optional(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();

export type EnergyTargetRecord = z.infer<typeof energyTargetRecordSchema>;
