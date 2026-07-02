import { z } from "zod";

/**
 * WHOOP v2 sleep activity (`GET /v2/activity/sleep`).
 *
 * WHOOP reports stage durations as aggregate milliseconds, not a per-sample
 * timeline, so the adapter synthesises non-overlapping KRD stages from these
 * totals. `total_no_data_time_milli` has no KRD stage and is dropped (the
 * KRD sleep total is the sum of classified stages).
 */
export const whoopSleepStageSummarySchema = z.object({
  total_in_bed_time_milli: z.number().nonnegative().optional(),
  total_awake_time_milli: z.number().nonnegative(),
  total_no_data_time_milli: z.number().nonnegative().optional(),
  total_light_sleep_time_milli: z.number().nonnegative(),
  total_slow_wave_sleep_time_milli: z.number().nonnegative(),
  total_rem_sleep_time_milli: z.number().nonnegative(),
});

export const whoopSleepScoreSchema = z.object({
  stage_summary: whoopSleepStageSummarySchema,
  sleep_performance_percentage: z.number().min(0).max(100).optional(),
});

export const whoopSleepRecordSchema = z.object({
  id: z.string(),
  cycle_id: z.number().optional(),
  user_id: z.number().optional(),
  start: z.iso.datetime(),
  end: z.iso.datetime(),
  nap: z.boolean().optional(),
  score_state: z.string(),
  score: whoopSleepScoreSchema.optional(),
});

export type WhoopSleepStageSummary = z.infer<
  typeof whoopSleepStageSummarySchema
>;
export type WhoopSleepRecord = z.infer<typeof whoopSleepRecordSchema>;
