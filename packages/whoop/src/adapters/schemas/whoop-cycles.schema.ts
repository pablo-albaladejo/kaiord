import { z } from "zod";

/**
 * Schemas for the WHOOP internal `core-details-bff/v0/cycles/details`
 * response. Only the fields the Wave-1 converters read are modelled; unknown
 * fields are tolerated (the objects are not strict). The response is either a
 * bare array of records or a `{ records: [...] }` wrapper — both normalize to
 * an array of records.
 */

export const whoopCycleSchema = z.object({
  id: z.number(),
});

export const whoopCycleRecoverySchema = z.object({
  hrv_rmssd: z.number(),
  recovery_score: z.number().min(0).max(100),
  created_at: z.iso.datetime(),
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
