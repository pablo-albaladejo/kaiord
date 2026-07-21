import { z } from "zod";

/**
 * Schema for a WHOOP cycle `workouts[]` entry (from
 * `core-details-bff/v0/cycles/details`). WHOOP identifies the workout's
 * sport by a numeric `sport_id`, resolved via the `sports/history` catalog
 * (see `whoop-sports.schema.ts`) rather than carried as a name. Modelled
 * non-strict: unknown fields (`percent_recorded`, `zone_durations`,
 * `gps_data`, `score`, ...) are tolerated. All fields are `.nullish()`
 * since an in-progress or un-scored workout may omit or explicitly null any
 * of them.
 */
export const whoopWorkoutSchema = z.object({
  during: z.string().nullish(),
  sport_id: z.number().nullish(),
  activity_id: z.string().uuid().nullish(),
  kilojoules: z.number().nonnegative().nullish(),
  average_heart_rate: z.number().int().min(0).max(300).nullish(),
  max_heart_rate: z.number().int().min(0).max(300).nullish(),
});

export type WhoopWorkout = z.infer<typeof whoopWorkoutSchema>;
