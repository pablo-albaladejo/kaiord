/**
 * Band-level FieldKey ↔ Profile zone-array accessors.
 */
import type { HeartRateZone, PowerZone, Profile } from "../../types/profile";
import {
  DEFAULT_HEART_RATE_ZONES,
  DEFAULT_POWER_ZONES,
} from "../../types/profile";
import type { PaceZone } from "../../types/sport-zones";

export type Sport = "cycling" | "running" | "swimming";
export type Band = "z1" | "z2" | "z3" | "z4" | "z5";
export type HrBound = "minBpm" | "maxBpm";
export type PowerBound = "minPercent" | "maxPercent";
export type PaceBound = "minPace" | "maxPace";

export const BAND_INDEX: Record<Band, number> = {
  z1: 0,
  z2: 1,
  z3: 2,
  z4: 3,
  z5: 4,
};

const PACE_UNIT = {
  running: "min_per_km" as const,
  swimming: "min_per_100m" as const,
};

export const cloneOrSeedHrZones = (
  existing: HeartRateZone[] | undefined
): HeartRateZone[] =>
  existing && existing.length === 5
    ? existing.map((z) => ({ ...z }))
    : DEFAULT_HEART_RATE_ZONES.map((z) => ({ ...z }));

export const cloneOrSeedPowerZones = (
  existing: PowerZone[] | undefined
): PowerZone[] =>
  existing && existing.length >= 5
    ? existing.slice(0, 5).map((z) => ({ ...z }))
    : DEFAULT_POWER_ZONES.slice(0, 5).map((z) => ({ ...z }));

export const seedPaceZones = (
  sport: "running" | "swimming",
  existing: PaceZone[] | undefined
): PaceZone[] =>
  existing && existing.length === 5
    ? existing.map((z) => ({ ...z }))
    : DEFAULT_HEART_RATE_ZONES.map((z) => ({
        zone: z.zone,
        name: z.name,
        minPace: 0,
        maxPace: 0,
        unit: PACE_UNIT[sport],
      }));

export const readHrBand = (
  profile: Profile,
  sport: Sport,
  band: Band,
  bound: HrBound
): number | undefined => {
  const z =
    profile.sportZones[sport]?.heartRateZones?.zones?.[BAND_INDEX[band]];
  return z ? (bound === "minBpm" ? z.minBpm : z.maxBpm) : undefined;
};

export const readPowerBand = (
  profile: Profile,
  band: Band,
  bound: PowerBound
): number | undefined => {
  const z = profile.sportZones.cycling?.powerZones?.zones?.[BAND_INDEX[band]];
  return z ? (bound === "minPercent" ? z.minPercent : z.maxPercent) : undefined;
};

export const readPaceBand = (
  profile: Profile,
  sport: "running" | "swimming",
  band: Band,
  bound: PaceBound
): number | undefined => {
  const z = profile.sportZones[sport]?.paceZones?.zones?.[BAND_INDEX[band]];
  return z ? (bound === "minPace" ? z.minPace : z.maxPace) : undefined;
};
