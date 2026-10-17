import type { AthleteZoneTables, PowerZoneBounds } from "@kaiord/ai";

import type { Profile } from "../types/profile";
import type { SportKey } from "../types/sport-zones";
import { paceZoneTableFor } from "../utils/garmin-pace-zones";

const PERCENT = 100;

const powerTableFor = (
  profile: Profile,
  sport: SportKey
): Array<PowerZoneBounds> => {
  const config = profile.sportZones[sport];
  const ftp = config?.thresholds.ftp;
  if (!ftp || !config?.powerZones) return [];
  return config.powerZones.zones
    .filter((z) => z.maxPercent > 0)
    .map((z) => ({
      zone: z.zone,
      minWatts: Math.round((ftp * z.minPercent) / PERCENT),
      maxWatts: Math.round((ftp * z.maxPercent) / PERCENT),
    }));
};

/**
 * The numeric zones a generation resolves its zone targets against. With no
 * sport requested, the model may pick one: pace comes from running and power
 * from cycling, the sports whose steps always carry those targets. The
 * resolver only applies each table to its own sport (pace to running, power
 * to cycling), so a swimming or cross-sport zone never takes these values.
 */
export const athleteZoneTables = (
  profile: Profile | null,
  sport: SportKey | undefined
): AthleteZoneTables => {
  if (!profile) return {};
  const pace = paceZoneTableFor(profile, sport ?? "running");
  const power = powerTableFor(profile, sport ?? "cycling");
  return {
    ...(pace.length > 0 ? { pace } : {}),
    ...(power.length > 0 ? { power } : {}),
  };
};
