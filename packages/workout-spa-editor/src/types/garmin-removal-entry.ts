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
 *
 * Who made the entry, two facts only ever set (ORed by the merge):
 * `created`, a POST of Kaiord made it; `recognized`, Kaiord found it on the
 * calendar without having posted it (the athlete placed the library
 * workout, or a record was lost). Kaiord may send a delete only for an
 * entry its record holds as created: `created`, or never `recognized` (an
 * entry of Kaiord's own record from before these facts were kept).
 * `noticed`: the athlete was told once that such an entry stayed behind.
 * `deleted`: Garmin confirmed it gone (a delete answered ok, or a 404
 * with a read that lacks it) or the athlete said they removed it; it
 * outranks every revival, so a read that still shows it is stale and never
 * revives it, on any device. `revival`: how many times a `gone` entry of Kaiord's was seen live
 * again; a higher revival outranks any state of a lower one, so a revived
 * entry can be the `Placed` or be drained like any other.
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
  created: z.literal(true).optional(),
  recognized: z.literal(true).optional(),
  noticed: z.literal(true).optional(),
  deleted: z.literal(true).optional(),
  revival: z.number().int().positive().optional(),
});
export type GarminRemovalEntry = z.infer<typeof garminRemovalEntrySchema>;
