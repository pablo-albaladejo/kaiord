/**
 * Profile Types and Schemas
 *
 * Defines user profile data including FTP, max HR, and training zones.
 */

import { z } from "zod";

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
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Profile = z.infer<typeof profileSchema>;

/**
 * Default Power Zones
 *
 * Standard 7-zone power training zones based on Coggan's power zones.
 */
export const DEFAULT_POWER_ZONES: Array<PowerZone> = [
  { zone: 1, name: "Active Recovery", minPercent: 0, maxPercent: 55 },
  { zone: 2, name: "Endurance", minPercent: 56, maxPercent: 75 },
  { zone: 3, name: "Tempo", minPercent: 76, maxPercent: 90 },
  { zone: 4, name: "Lactate Threshold", minPercent: 91, maxPercent: 105 },
  { zone: 5, name: "VO2 Max", minPercent: 106, maxPercent: 120 },
  { zone: 6, name: "Anaerobic Capacity", minPercent: 121, maxPercent: 150 },
  { zone: 7, name: "Neuromuscular Power", minPercent: 151, maxPercent: 200 },
];

/**
 * Default Heart Rate Zones
 *
 * Standard 5-zone heart rate training zones.
 */
export const DEFAULT_HEART_RATE_ZONES: Array<HeartRateZone> = [
  { zone: 1, name: "Recovery", minBpm: 0, maxBpm: 0 },
  { zone: 2, name: "Aerobic", minBpm: 0, maxBpm: 0 },
  { zone: 3, name: "Tempo", minBpm: 0, maxBpm: 0 },
  { zone: 4, name: "Threshold", minBpm: 0, maxBpm: 0 },
  { zone: 5, name: "VO2 Max", minBpm: 0, maxBpm: 0 },
];

/**
 * Calculate Heart Rate Zones
 *
 * Calculates heart rate zones based on maximum heart rate using standard percentages.
 *
 * @param maxHeartRate - Maximum heart rate in BPM
 * @returns Array of 5 heart rate zones with calculated BPM ranges
 */
export const calculateHeartRateZones = (
  maxHeartRate: number
): Array<HeartRateZone> => {
  const percentages = [
    { zone: 1, name: "Recovery", min: 0, max: 60 },
    { zone: 2, name: "Aerobic", min: 60, max: 70 },
    { zone: 3, name: "Tempo", min: 70, max: 80 },
    { zone: 4, name: "Threshold", min: 80, max: 90 },
    { zone: 5, name: "VO2 Max", min: 90, max: 100 },
  ];

  return percentages.map(({ zone, name, min, max }) => ({
    zone,
    name,
    minBpm: Math.round((maxHeartRate * min) / 100),
    maxBpm: Math.round((maxHeartRate * max) / 100),
  }));
};
