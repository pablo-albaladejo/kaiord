import { z } from "zod";

/**
 * FIT-side schema for a single `sleep_level` message (mesgNum 275).
 *
 * Garmin emits one message per *transition* into a new sleep stage —
 * not one per stage with a duration. KRD sleep stages aggregate
 * consecutive same-level transitions and derive `durationSeconds`
 * from the timestamp delta in the field-level mapper.
 */
export const fitSleepLevelSchema = z.object({
  timestamp: z.union([z.date(), z.string(), z.number()]),
  sleepLevel: z.enum(["awake", "light", "deep", "rem", "unmeasurable"]),
});

export type FitSleepLevel = z.infer<typeof fitSleepLevelSchema>;
