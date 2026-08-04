import type { Profile } from "../../types/profile";
import type { Units } from "../units/units";
import { isActiveSport } from "./sports";
import { thresholdCandidates } from "./threshold-candidates";

/**
 * The threshold a sport's intensity targets are written against, plus the only
 * origin the profile actually stores for it.
 *
 * `sportThresholdsSchema` carries no source field and no per-field timestamp,
 * so `updatedAt` is the PROFILE's own timestamp and callers must label it as
 * such — "from your athlete profile, updated 4 days ago", never "FTP updated
 * 4 days ago". Inventing a source would be exactly the supposition principle 1
 * exists to prevent.
 *
 * The primary metric comes from `thresholdCandidates`, the same ordered
 * derivation the Athlete screen renders, so the two surfaces cannot disagree
 * about which number a sport trains against.
 */

export type ThresholdMetricKey = "ftp" | "thresholdPace" | "cssPace";

export type ThresholdProvenance = {
  metric: ThresholdMetricKey;
  value: string;
  unit: string;
  /** The profile's own `updatedAt`, not the threshold field's. */
  updatedAt: Date | undefined;
};

const METRIC_KEYS: Record<string, ThresholdMetricKey> = {
  cycling: "ftp",
  running: "thresholdPace",
  swimming: "cssPace",
};

const parseDate = (iso: string): Date | undefined => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

/** The sport's primary threshold with its provenance, or null when unset. */
export function buildThresholdProvenance(
  profile: Profile | null | undefined,
  sport: string,
  units: Units = "metric"
): ThresholdProvenance | null {
  if (!profile || !isActiveSport(sport)) return null;

  const metric = METRIC_KEYS[sport];
  if (!metric) return null;

  const thresholds = profile.sportZones[sport]?.thresholds;
  const primary = thresholdCandidates(
    sport,
    thresholds,
    profile.maxHeartRate,
    units
  )[0];
  if (!primary?.value) return null;

  return {
    metric,
    value: primary.value,
    unit: primary.unit ?? "",
    updatedAt: parseDate(profile.updatedAt),
  };
}
