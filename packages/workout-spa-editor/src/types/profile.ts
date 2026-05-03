/**
 * Profile Types and Schemas
 *
 * Defines user profile data with sport-specific training zones.
 */

import { z } from "zod";

import { linkedCoachingAccountSchema } from "./coaching-account";
import { sportZonesRecordSchema } from "./sport-zones-schemas";

export type { LinkedCoachingAccount } from "./coaching-account";
export { linkedCoachingAccountSchema } from "./coaching-account";
export {
  DEFAULT_HEART_RATE_ZONES,
  DEFAULT_POWER_ZONES,
} from "./profile-defaults";
export type {
  PaceUnit,
  PaceZone,
  SportKey,
  SportThresholds,
  SportZoneConfig,
  ZoneConfig,
  ZoneMode,
} from "./sport-zones";
export { SPORT_ZONE_CAPABILITIES } from "./sport-zones";
export type { HeartRateZone, PowerZone } from "./zone-schemas";
export { heartRateZoneSchema, powerZoneSchema } from "./zone-schemas";

/**
 * Profile Schema
 *
 * `maxHeartRate` is the cross-sport hard ceiling (the value coaches
 * use to cap zone scaling on the most aerobic discipline). Sport-
 * specific HR zones live under `sportZones.<sport>.heartRateZones`;
 * `maxHeartRate` is the global safety cap, not a per-sport derivative.
 */
export const profileSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(100),
  bodyWeight: z.number().positive().optional(),
  maxHeartRate: z.number().int().positive().max(250).optional(),
  sportZones: sportZonesRecordSchema,
  linkedAccounts: z.array(linkedCoachingAccountSchema).default([]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Profile = z.infer<typeof profileSchema>;
