import { z } from "zod";

import { krdSchema } from "./krd";

/**
 * Zod schema for the lightweight summary carried by every `activity`
 * (executed session). The summary is always present — the calendar and
 * SessionMatch read from it — while the full recorded detail is optional
 * (see {@link activitySchema}).
 */
export const activitySummarySchema = z.object({
  /** YYYY-MM-DD local calendar date the activity was recorded. */
  date: z.iso.date(),
  /** ISO-8601 start timestamp when the source provides it. */
  start_time: z.iso.datetime().optional(),
  sport: z.string(),
  sub_sport: z.string().optional(),
  /** seconds */
  duration_seconds: z.number().nonnegative().optional(),
  /** meters */
  distance_meters: z.number().nonnegative().optional(),
  /** bpm */
  avg_heart_rate: z.number().int().min(0).max(300).optional(),
  /** watts */
  avg_power: z.number().nonnegative().optional(),
  /** kcal */
  total_calories: z.number().int().nonnegative().optional(),
  /** Provenance source key (e.g. `"garmin"`, `"fit-import"`). */
  source: z.string(),
  /** Stable external id within the source, for dedup. */
  source_id: z.string(),
});

export type ActivitySummary = z.infer<typeof activitySummarySchema>;

/**
 * Zod schema for an `activity` — a first-class executed session (the
 * executed side of a SessionMatch). Shape mirrors the health records'
 * `{ summary, krd? }` split: a mandatory summary for list/match reads plus
 * the optional full KRD payload attached when the source provides recorded
 * detail (records/laps/sessions).
 */
export const activitySchema = z.object({
  kind: z.literal("activity"),
  summary: activitySummarySchema,
  /** Full recorded KRD, attached only when the source delivers detail. */
  krd: krdSchema.optional(),
});

export type Activity = z.infer<typeof activitySchema>;
