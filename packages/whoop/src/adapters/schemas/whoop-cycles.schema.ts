import { z } from "zod";

/**
 * Schemas for the WHOOP internal `core-details-bff/v0/cycles/details`
 * response. Only the fields the Wave-1 (hrv/sleep) and Wave-2 (strain/vitals)
 * converters read are modelled; unknown fields are tolerated (the objects are
 * not strict). All Wave-2 fields are `.optional()` since in-progress cycles
 * may omit strain/vitals data — they must not regress Wave-1 parsing. The
 * response is either a bare array of records or a `{ records: [...] }`
 * wrapper — both normalize to an array of records.
 */

export const whoopCycleSchema = z.object({
  id: z.number(),
  days: z.string().optional(),
  scaled_strain: z.number().optional(),
  kilojoule: z.number().nonnegative().optional(),
});

export const whoopCycleRecoverySchema = z.object({
  hrv_rmssd: z.number(),
  recovery_score: z.number().min(0).max(100),
  created_at: z.iso.datetime(),
  resting_heart_rate: z.number().int().min(0).max(300).optional(),
  spo2: z.number().min(0).max(100).optional(),
  skin_temp_celsius: z.number().optional(),
});

export const whoopCycleSleepSchema = z.object({
  during: z.string(),
  activity_id: z.string().uuid(),
  time_in_bed: z.number(),
  light_sleep_duration: z.number(),
  slow_wave_sleep_duration: z.number(),
  rem_sleep_duration: z.number(),
  wake_duration: z.number(),
  score: z.number().min(0).max(100).optional(),
  respiratory_rate: z.number().positive().optional(),
});

export const whoopCycleRecordSchema = z.object({
  cycle: whoopCycleSchema,
  recovery: whoopCycleRecoverySchema,
  sleeps: z.array(whoopCycleSleepSchema),
});

export const whoopCyclesResponseSchema = z
  .union([
    z.array(whoopCycleRecordSchema),
    z.object({ records: z.array(whoopCycleRecordSchema) }),
  ])
  .transform((value) => (Array.isArray(value) ? value : value.records));

export type WhoopCycle = z.infer<typeof whoopCycleSchema>;
export type WhoopCycleRecovery = z.infer<typeof whoopCycleRecoverySchema>;
export type WhoopCycleSleep = z.infer<typeof whoopCycleSleepSchema>;
export type WhoopCycleRecord = z.infer<typeof whoopCycleRecordSchema>;
export type WhoopCyclesResponse = z.infer<typeof whoopCyclesResponseSchema>;
