import type { ThresholdFieldKey } from "../../types/coaching-zones";
import type { SportKey } from "../../types/sport-zones";
import type { PaceBase } from "../units/units";
import type { ActiveSport } from "./sports";

/** The number a threshold field edits: one of the sport's thresholds, or the
    cross-sport max heart rate the HR zones are bounded by. */
export type ThresholdFieldId =
  "ftp" | "lthr" | "thresholdPace" | "maxHeartRate";

export type ThresholdFieldSpec = {
  id: ThresholdFieldId;
  /** Where provenance looks the value up; absent when no source sends it. */
  provenance?: ThresholdFieldKey;
  /** A threshold the sport's zones do not need. */
  optional?: boolean;
};

const MAX_HR: ThresholdFieldSpec = {
  id: "maxHeartRate",
  provenance: "heartRate.max",
};

/* The order a sport is trained by: pace sports lead with pace, power is
   optional for a runner, and the max heart rate closes every sport. */
const SPECS: Record<ActiveSport, ThresholdFieldSpec[]> = {
  cycling: [
    { id: "ftp", provenance: "cycling.thresholds.ftp" },
    { id: "lthr", provenance: "cycling.thresholds.lthr" },
    MAX_HR,
  ],
  running: [
    {
      id: "thresholdPace",
      provenance: "running.thresholds.thresholdPaceSecPerKm",
    },
    { id: "lthr", provenance: "running.thresholds.lthr" },
    { id: "ftp", optional: true },
    MAX_HR,
  ],
  swimming: [
    {
      id: "thresholdPace",
      provenance: "swimming.thresholds.cssPaceSecPer100m",
    },
    { id: "lthr", provenance: "swimming.thresholds.lthr" },
    MAX_HR,
  ],
};

export const thresholdFieldSpecs = (sport: ActiveSport): ThresholdFieldSpec[] =>
  SPECS[sport];

/** The pace base a sport's threshold pace is stored in. */
export const sportPaceBase = (sport: SportKey): PaceBase =>
  sport === "swimming" ? "min_per_100m" : "min_per_km";
