import type { SportThresholds } from "../../types/sport-zones";
import {
  paceSecondsFactor,
  paceUnitLabelFor,
  type Units,
} from "../units/units";
import { formatPace } from "./format";
import type { ActiveSport } from "./sports";

export type ThresholdCandidate = {
  value: string | undefined;
  unit?: string;
  label: string;
};

function hrCandidates(
  thresholds: SportThresholds | undefined,
  maxHeartRate: number | undefined,
  includeMax: boolean
): ThresholdCandidate[] {
  const items: ThresholdCandidate[] = [
    { value: thresholds?.lthr?.toString(), unit: "bpm", label: "Threshold HR" },
  ];
  if (includeMax) {
    items.push({
      value: maxHeartRate?.toString(),
      unit: "bpm",
      label: "Max HR",
    });
  }
  return items;
}

function paceCandidate(
  thresholds: SportThresholds | undefined,
  fallbackUnit: SportThresholds["paceUnit"],
  label: string,
  units: Units
): ThresholdCandidate {
  const pace = thresholds?.thresholdPace;
  const base = thresholds?.paceUnit ?? fallbackUnit ?? "min_per_km";
  return {
    value:
      pace === undefined
        ? undefined
        : formatPace(pace * paceSecondsFactor(base, units)),
    unit: paceUnitLabelFor(base, units),
    label,
  };
}

/** Ordered metric candidates for a sport, before unset values are filtered. */
export function thresholdCandidates(
  sport: ActiveSport,
  thresholds: SportThresholds | undefined,
  maxHeartRate: number | undefined,
  units: Units = "metric"
): ThresholdCandidate[] {
  if (sport === "cycling") {
    return [
      { value: thresholds?.ftp?.toString(), unit: "W", label: "FTP" },
      ...hrCandidates(thresholds, maxHeartRate, true),
    ];
  }
  if (sport === "running") {
    return [
      paceCandidate(thresholds, "min_per_km", "Threshold pace", units),
      ...hrCandidates(thresholds, maxHeartRate, true),
    ];
  }
  return [
    paceCandidate(thresholds, "min_per_100m", "CSS pace", units),
    ...hrCandidates(thresholds, maxHeartRate, false),
  ];
}
