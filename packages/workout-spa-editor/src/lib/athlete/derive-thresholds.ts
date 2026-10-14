import type { Profile } from "../../types/profile";
import type { Units } from "../units/units";
import type { ActiveSport } from "./sports";
import type { ThresholdLabelKey } from "./threshold-candidate-builders";
import {
  type ThresholdCandidate,
  thresholdCandidates,
} from "./threshold-candidates";
import {
  deriveThresholdProvenance,
  type ThresholdProvenance,
} from "./threshold-provenance";

export type ThresholdMetric = {
  value: string;
  unit?: string;
  /** Key under `athlete` `metric.*`. */
  labelKey: ThresholdLabelKey;
  provenance: ThresholdProvenance;
};

type PresentCandidate = ThresholdCandidate & { value: string };

const isPresent = (
  candidate: ThresholdCandidate
): candidate is PresentCandidate => Boolean(candidate.value);

/** Derives the threshold metrics shown on the Athlete card for a sport.
    Omits metrics whose underlying value is unset. Every metric that survives
    carries where its number came from: a value without an origin is a
    supposition, not a datum. */
export function deriveThresholdMetrics(
  profile: Profile,
  sport: ActiveSport,
  units: Units = "metric",
  now: Date = new Date(),
  hrUnit?: string
): ThresholdMetric[] {
  const thresholds = profile.sportZones[sport]?.thresholds;
  return thresholdCandidates(
    sport,
    thresholds,
    profile.maxHeartRate,
    units,
    hrUnit
  )
    .filter(isPresent)
    .map((candidate) => ({
      value: candidate.value,
      unit: candidate.unit,
      labelKey: candidate.labelKey,
      provenance: deriveThresholdProvenance(
        profile,
        candidate.field,
        candidate.raw,
        now
      ),
    }));
}
