/**
 * Profile Default Values
 *
 * Default zone configurations for profiles.
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
