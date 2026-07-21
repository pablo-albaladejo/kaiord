import { z } from "zod";

/**
 * Schema for a WHOOP cycle `workouts[]` entry (from
 * `core-details-bff/v0/cycles/details`). WHOOP identifies the workout's
 * sport by a numeric `sport_id`, resolved via the `sports/history` catalog
 * (see `whoop-sports.schema.ts`) rather than carried as a name. Modelled
 * non-strict: unknown fields (`percent_recorded`, `zone_durations`,
 * `gps_data`, `score`, ...) are tolerated.
 *
 * Every field is deliberately LENIENT (`z.number()`/`z.string()` + `.nullish()`,
 * no `.int()/.min()/.max()/.uuid()/.nonnegative()` refinements). This array is
 * part of the shared `whoopCycleRecordSchema` that ALSO drives the Wave-1/2
 * hrv/sleep/strain/vitals sync: a single out-of-range value on one workout must
 * not fail the whole-window `safeParse` and silently drop every health record
 * for that window. Correctness is enforced downstream — `workoutToActivity`
 * rounds/clamps/guards each value so its KRD `activity` output is always valid.
 */
export const whoopWorkoutSchema = z.object({
  during: z.string().nullish(),
  timezone_offset: z.string().nullish(),
  sport_id: z.number().nullish(),
  activity_id: z.string().nullish(),
  kilojoules: z.number().nullish(),
  average_heart_rate: z.number().nullish(),
  max_heart_rate: z.number().nullish(),
});

export type WhoopWorkout = z.infer<typeof whoopWorkoutSchema>;
