/**
 * Band-level write helpers. Each returns a fresh Profile with the
 * targeted band's bound updated; the array is cloned-or-seeded to 5
 * entries so the index-based mutate is safe.
 */
import type { Profile } from "../../types/profile";
import type {
  Band,
  HrBound,
  PaceBound,
  PowerBound,
  Sport,
} from "./sync-zones-band-fields";
import {
  BAND_INDEX,
  cloneOrSeedHrZones,
  cloneOrSeedPowerZones,
  seedPaceZones,
} from "./sync-zones-band-fields";

const mergeSport = (profile: Profile, sport: Sport, patch: object): Profile => {
  const existing = profile.sportZones[sport];
  const base = existing ?? {
    thresholds: {},
    heartRateZones: { method: "custom", zones: [] },
  };
  return {
    ...profile,
    sportZones: { ...profile.sportZones, [sport]: { ...base, ...patch } },
  };
};

export const writeHrBand = (
  profile: Profile,
  sport: Sport,
  band: Band,
  bound: HrBound,
  value: number
): Profile => {
  const zones = cloneOrSeedHrZones(
    profile.sportZones[sport]?.heartRateZones?.zones
  );
  if (bound === "minBpm") zones[BAND_INDEX[band]].minBpm = value;
  else zones[BAND_INDEX[band]].maxBpm = value;
  const method = profile.sportZones[sport]?.heartRateZones?.method ?? "custom";
  return mergeSport(profile, sport, { heartRateZones: { method, zones } });
};

export const writePowerBand = (
  profile: Profile,
  band: Band,
  bound: PowerBound,
  value: number
): Profile => {
  const zones = cloneOrSeedPowerZones(
    profile.sportZones.cycling?.powerZones?.zones
  );
  if (bound === "minPercent") zones[BAND_INDEX[band]].minPercent = value;
  else zones[BAND_INDEX[band]].maxPercent = value;
  const method = profile.sportZones.cycling?.powerZones?.method ?? "custom";
  return mergeSport(profile, "cycling", { powerZones: { method, zones } });
};

export const writePaceBand = (
  profile: Profile,
  sport: "running" | "swimming",
  band: Band,
  bound: PaceBound,
  value: number
): Profile => {
  const zones = seedPaceZones(
    sport,
    profile.sportZones[sport]?.paceZones?.zones
  );
  if (bound === "minPace") zones[BAND_INDEX[band]].minPace = value;
  else zones[BAND_INDEX[band]].maxPace = value;
  const method = profile.sportZones[sport]?.paceZones?.method ?? "custom";
  return mergeSport(profile, sport, { paceZones: { method, zones } });
};
