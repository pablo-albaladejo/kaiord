import type { ThresholdFieldKey } from "../../types/coaching-zones";
import type { SportThresholds } from "../../types/sport-zones";
import type { Units } from "../units/units";
import { paceSecondsFactor, paceUnitLabelFor } from "../units/units";
import { formatPace } from "./format";
import type { ActiveSport } from "./sports";

export type ThresholdCandidate = {
  value: string | undefined;
  unit?: string;
  label: string;
  /** Logical identity of the value, for provenance lookup. */
  field: ThresholdFieldKey;
  /** The stored number behind `value`, before any unit conversion. */
  raw: number | undefined;
};

const LTHR_FIELD: Record<ActiveSport, ThresholdFieldKey> = {
  cycling: "cycling.thresholds.lthr",
  running: "running.thresholds.lthr",
  swimming: "swimming.thresholds.lthr",
};

/** Threshold HR, and max HR for the sports whose card shows it. */
export function hrCandidates(
  sport: ActiveSport,
  thresholds: SportThresholds | undefined,
  maxHeartRate: number | undefined,
  includeMax: boolean
): ThresholdCandidate[] {
  const items: ThresholdCandidate[] = [
    {
      value: thresholds?.lthr?.toString(),
      unit: "bpm",
      label: "Threshold HR",
      field: LTHR_FIELD[sport],
      raw: thresholds?.lthr,
    },
  ];
  if (includeMax) {
    items.push({
      value: maxHeartRate?.toString(),
      unit: "bpm",
      label: "Max HR",
      field: "heartRate.max",
      raw: maxHeartRate,
    });
  }
  return items;
}

/** Threshold pace, converted for display but kept raw for comparison. */
export function paceCandidate(
  thresholds: SportThresholds | undefined,
  fallbackUnit: SportThresholds["paceUnit"],
  label: string,
  units: Units,
  field: ThresholdFieldKey
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
    field,
    raw: pace,
  };
}
