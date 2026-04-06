/**
 * Profile Types and Schemas
 *
 * Defines user profile data with sport-specific training zones.
 */

import { z } from "zod";

import { sportZonesRecordSchema } from "./sport-zones-schemas";

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
 */
export const profileSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(100),
  bodyWeight: z.number().positive().optional(),
  sportZones: sportZonesRecordSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Profile = z.infer<typeof profileSchema>;
