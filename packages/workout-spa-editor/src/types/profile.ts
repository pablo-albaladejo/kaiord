/**
 * Profile Types and Schemas
 *
 * Defines user profile data with sport-specific training zones.
 */

import { z } from "zod";
import { sportZonesRecordSchema } from "./sport-zones-schemas";

export { heartRateZoneSchema, powerZoneSchema } from "./zone-schemas";
export type { HeartRateZone, PowerZone } from "./zone-schemas";

export type {
  PaceZone,
  PaceUnit,
  SportThresholds,
  ZoneMode,
  ZoneConfig,
  SportZoneConfig,
  SportKey,
} from "./sport-zones";
export { SPORT_ZONE_CAPABILITIES } from "./sport-zones";
export {
  DEFAULT_POWER_ZONES,
  DEFAULT_HEART_RATE_ZONES,
} from "./profile-defaults";

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
