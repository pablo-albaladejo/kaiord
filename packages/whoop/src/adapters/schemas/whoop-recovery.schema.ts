import { z } from "zod";

/**
 * WHOOP v2 recovery record (`GET /v2/recovery`).
 *
 * `score` is only present once `score_state === "SCORED"`; while WHOOP is
 * still calibrating or the recovery is pending it is absent, so the adapter
 * treats a scoreless record as "no HRV yet" rather than fabricating one.
 *
 * Unknown fields (e.g. `spo2_percentage`, `skin_temp_celsius`) are stripped —
 * they have no KRD home in the six frozen health sub-schemas.
 */
export const whoopRecoveryScoreSchema = z.object({
  user_calibrating: z.boolean().optional(),
  recovery_score: z.number().min(0).max(100),
  resting_heart_rate: z.number().positive().optional(),
  hrv_rmssd_milli: z.number(),
});

export const whoopRecoveryRecordSchema = z.object({
  cycle_id: z.number(),
  sleep_id: z.string().optional(),
  user_id: z.number().optional(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime().optional(),
  score_state: z.string(),
  score: whoopRecoveryScoreSchema.optional(),
});

export type WhoopRecoveryRecord = z.infer<typeof whoopRecoveryRecordSchema>;
