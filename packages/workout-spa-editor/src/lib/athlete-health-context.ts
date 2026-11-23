/**
 * What a generation tells the model about the athlete, with or without their
 * heart-rate data (LTHR and heart-rate zones), the health data a generation
 * carries, and the kinds of data it put in: the Trace records those. The
 * athlete is asked only when that data would actually go.
 */
import type { AthleteContext } from "@kaiord/ai";
import type { Sport } from "@kaiord/core";

import type { DataKind } from "../application/data-flows/data-kinds";
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

export type GenerationContent = {
  context: AthleteContext;
  /** In the generation flow's order; the workout description always goes. */
  kinds: DataKind[];
};

const kindsOf = (context: AthleteContext, heartRate: boolean): DataKind[] => [
  "workoutDescription",
  ...(context.instructions?.trim() ? (["aiInstructions"] as const) : []),
  ...(context.zonesText?.trim() ? (["powerPaceZones"] as const) : []),
  ...(heartRate ? (["heartRateZones"] as const) : []),
];

export const generationContext = async (
  athlete: AthleteInput,
  sport: Sport | undefined,
  share: () => Promise<HealthShare>
): Promise<GenerationContent> => {
  const full = toAthleteContext(athlete, sport);
  if (!athlete.profile) return { context: full, kinds: kindsOf(full, false) };
  const stripped = toAthleteContext(
    { ...athlete, profile: withoutHeartRate(athlete.profile) },
    sport
  );
  const withHeartRate =
    stripped.zonesText !== full.zonesText && (await share()) === "send";
  const context = withHeartRate ? full : stripped;
  return {
    context,
    kinds: kindsOf(stripped, withHeartRate),
  };
};
