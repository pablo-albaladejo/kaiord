/**
 * Profile Default Values
 *
 * Default zone configurations and legacy heart rate calculation.
 */

import type { HeartRateZone, PowerZone } from "./profile";

export const DEFAULT_POWER_ZONES: Array<PowerZone> = [
  { zone: 1, name: "Active Recovery", minPercent: 0, maxPercent: 55 },
  { zone: 2, name: "Endurance", minPercent: 56, maxPercent: 75 },
  { zone: 3, name: "Tempo", minPercent: 76, maxPercent: 90 },
  { zone: 4, name: "Lactate Threshold", minPercent: 91, maxPercent: 105 },
  { zone: 5, name: "VO2 Max", minPercent: 106, maxPercent: 120 },
  { zone: 6, name: "Anaerobic Capacity", minPercent: 121, maxPercent: 150 },
  { zone: 7, name: "Neuromuscular Power", minPercent: 151, maxPercent: 200 },
];

export const DEFAULT_HEART_RATE_ZONES: Array<HeartRateZone> = [
  { zone: 1, name: "Recovery", minBpm: 0, maxBpm: 0 },
  { zone: 2, name: "Aerobic", minBpm: 0, maxBpm: 0 },
  { zone: 3, name: "Tempo", minBpm: 0, maxBpm: 0 },
  { zone: 4, name: "Threshold", minBpm: 0, maxBpm: 0 },
  { zone: 5, name: "VO2 Max", minBpm: 0, maxBpm: 0 },
];

/**
 * Calculate Heart Rate Zones (legacy, max HR based)
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
