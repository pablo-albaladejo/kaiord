import type { Profile } from "../../types/profile";
import type { Units } from "../units/units";
import type { ActiveSport } from "./sports";
import { thresholdCandidates } from "./threshold-candidates";

export type ThresholdMetric = {
  value: string;
  unit?: string;
  label: string;
  accent: boolean;
};

/** Derives the threshold metrics shown on the Athlete card for a sport.
    Omits metrics whose underlying value is unset; the first present metric
    is rendered in the accent color (per the design). */
export function deriveThresholdMetrics(
  profile: Profile,
  sport: ActiveSport,
  units: Units = "metric"
): ThresholdMetric[] {
  const thresholds = profile.sportZones[sport]?.thresholds;
  return thresholdCandidates(sport, thresholds, profile.maxHeartRate, units)
    .filter(
      (
        candidate
      ): candidate is { value: string; unit?: string; label: string } =>
        Boolean(candidate.value)
    )
    .map((candidate, index) => ({
      value: candidate.value,
      unit: candidate.unit,
      label: candidate.label,
      accent: index === 0,
    }));
}
