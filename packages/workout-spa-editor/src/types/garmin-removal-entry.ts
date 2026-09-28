import { z } from "zod";

import {
  calendarDate,
  garminScheduleIdSchema,
  garminWorkoutIdSchema,
} from "./garmin-ledger";

/**
 * One state per schedule id, only ever raised: `held` (unverified legacy
 * entry: never Placed, never drained) < `keep` (verified live and current)
 * < `retire` (verified superseded: the only drainable state) < `gone`
 * (tombstone). Garmin never reuses an id, so the merge joins by max.
 */
export const GARMIN_REMOVAL_STATES = [
  "held",
  "keep",
  "retire",
  "gone",
] as const;
export type GarminRemovalState = (typeof GARMIN_REMOVAL_STATES)[number];

export const garminRemovalEntrySchema = z.object({
  workoutScheduleId: garminScheduleIdSchema,
  workoutId: garminWorkoutIdSchema,
  date: calendarDate,
  attempts: z.number().int().nonnegative(),
  abandoned: z.boolean(),
  state: z.enum(GARMIN_REMOVAL_STATES),
});
export type GarminRemovalEntry = z.infer<typeof garminRemovalEntrySchema>;
