import type { SportThresholds } from "../../types/sport-zones";
import type { Units } from "../units/units";
import type { ActiveSport } from "./sports";
import {
  hrCandidates,
  paceCandidate,
  type ThresholdCandidate,
} from "./threshold-candidate-builders";

export type { ThresholdCandidate };

/** Ordered metric candidates for a sport, before unset values are filtered.
    The order is also the order the zone map falls back through, so the first
    surviving candidate is the threshold the zones derive from. */
export function thresholdCandidates(
  sport: ActiveSport,
  thresholds: SportThresholds | undefined,
  maxHeartRate: number | undefined,
  units: Units = "metric"
): ThresholdCandidate[] {
  if (sport === "cycling") {
    return [
      {
        value: thresholds?.ftp?.toString(),
        unit: "W",
        label: "FTP",
        field: "cycling.thresholds.ftp",
        raw: thresholds?.ftp,
      },
      ...hrCandidates(sport, thresholds, maxHeartRate, true),
    ];
  }
  if (sport === "running") {
    const field = "running.thresholds.thresholdPaceSecPerKm";
    return [
      paceCandidate(thresholds, "min_per_km", "Threshold pace", units, field),
      ...hrCandidates(sport, thresholds, maxHeartRate, true),
    ];
  }
  const field = "swimming.thresholds.cssPaceSecPer100m";
  return [
    paceCandidate(thresholds, "min_per_100m", "CSS pace", units, field),
    ...hrCandidates(sport, thresholds, maxHeartRate, false),
  ];
}
