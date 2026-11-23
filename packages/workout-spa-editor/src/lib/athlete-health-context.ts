/**
 * What a generation tells the model about the athlete, with or without their
 * heart-rate data (LTHR and heart-rate zones), the health data a generation
 * carries. The athlete is asked only when that data would actually go.
 */
import type { AthleteContext } from "@kaiord/ai";
import type { Sport } from "@kaiord/core";

import type { Profile } from "../types/profile";
import type { SportZoneConfig } from "../types/sport-zones";
import type { AthleteInput } from "./athlete-generation-context";
import { toAthleteContext } from "./athlete-generation-context";
import type { HealthShare } from "./health-sharing-gate";

const zonesWithoutHeartRate = (config: SportZoneConfig): SportZoneConfig => {
  return {
    ...config,
    thresholds: { ...config.thresholds, lthr: undefined },
    heartRateZones: { ...config.heartRateZones, zones: [] },
  };
};

const withoutHeartRate = (profile: Profile): Profile => ({
  ...profile,
  sportZones: Object.fromEntries(
    Object.entries(profile.sportZones).map(([sport, config]) => [
      sport,
      zonesWithoutHeartRate(config),
    ])
  ) as Profile["sportZones"],
});

export const generationContext = async (
  athlete: AthleteInput,
  sport: Sport | undefined,
  share: () => Promise<HealthShare>
): Promise<AthleteContext> => {
  const full = toAthleteContext(athlete, sport);
  if (!athlete.profile) return full;
  const stripped = toAthleteContext(
    { ...athlete, profile: withoutHeartRate(athlete.profile) },
    sport
  );
  if (stripped.zonesText === full.zonesText) return full;
  return (await share()) === "send" ? full : stripped;
};
