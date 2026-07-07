/**
 * Wire schema for the raw Garmin Connect activity feed returned by the
 * garmin-bridge `activities` action. Kept in the application layer (neutral,
 * framework-free) so both the bridge adapter transport and the pull use case
 * share one definition. `safeParse` at the bridge edge is defense-in-depth
 * against a Garmin API shape change (the pre-existing pattern for un-parsed
 * bridge reads). Unknown Garmin fields are stripped, not rejected.
 */
import { z } from "zod";

export const garminRawActivitySchema = z.object({
  activityId: z.union([z.number(), z.string()]),
  activityName: z.string().optional(),
  /** Garmin local start, "YYYY-MM-DD HH:mm:ss". */
  startTimeLocal: z.string().optional(),
  startTimeGMT: z.string().optional(),
  activityType: z.object({ typeKey: z.string().optional() }).optional(),
  /** meters */
  distance: z.number().nonnegative().optional(),
  /** seconds */
  duration: z.number().nonnegative().optional(),
});

export type GarminRawActivity = z.infer<typeof garminRawActivitySchema>;

export const garminActivitiesResponseSchema = z.object({
  activities: z.array(garminRawActivitySchema),
  disabled: z.boolean(),
  throttled: z.boolean(),
});

export type GarminActivitiesResponse = z.infer<
  typeof garminActivitiesResponseSchema
>;
