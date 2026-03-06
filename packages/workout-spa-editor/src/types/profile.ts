/**
 * Profile Types and Schemas
 *
 * Defines user profile data including FTP, max HR, and training zones.
 */

import { z } from "zod";
import { sportZonesRecordSchema } from "./sport-zones-schemas";
import { heartRateZoneSchema, powerZoneSchema } from "./zone-schemas";

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
  calculateHeartRateZones,
} from "./profile-defaults";

/**
 * Profile Schema
 */
export const profileSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(100),
  bodyWeight: z.number().positive().optional(),
  ftp: z.number().int().positive().optional(),
  maxHeartRate: z.number().int().positive().max(250).optional(),
  powerZones: z.array(powerZoneSchema).length(7),
  heartRateZones: z.array(heartRateZoneSchema).length(5),
  sportZones: sportZonesRecordSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Profile = z.infer<typeof profileSchema>;
