/**
 * Profile Types and Schemas
 *
 * Defines user profile data including FTP, max HR, and training zones.
 */

import { z } from "zod";
import { sportZonesRecordSchema } from "./sport-zones-schemas";

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
 * Power Zone Schema
 *
 * Represents a single power training zone with percentage ranges based on FTP.
 */
export const powerZoneSchema = z.object({
  zone: z.number().int().min(1).max(7),
  name: z.string().min(1).max(50),
  minPercent: z.number().min(0).max(200),
  maxPercent: z.number().min(0).max(200),
});

export type PowerZone = z.infer<typeof powerZoneSchema>;

/**
 * Heart Rate Zone Schema
 *
 * Represents a single heart rate training zone with BPM ranges based on max HR.
 */
export const heartRateZoneSchema = z.object({
  zone: z.number().int().min(1).max(5),
  name: z.string().min(1).max(50),
  minBpm: z.number().int().min(0).max(250),
  maxBpm: z.number().int().min(0).max(250),
});

export type HeartRateZone = z.infer<typeof heartRateZoneSchema>;

/**
 * Profile Schema
 *
 * Represents a complete user profile with personal data and training zones.
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
