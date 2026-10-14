/**
 * Narrows a non-band `FieldKey` to a profile threshold. The weight is a
 * `FieldKey` too, but it is the current weight (a weigh-in), not a profile
 * field, so it never narrows. The record keeps the list exhaustive: a new
 * threshold key does not compile until it is listed here.
 */
import type { FieldKey } from "../../types/coaching-zones";
import type { ProfileThresholdKey } from "./sync-zones-threshold-fields";

const PROFILE_THRESHOLD_KEYS: Record<ProfileThresholdKey, true> = {
  "cycling.thresholds.ftp": true,
  "cycling.thresholds.lthr": true,
  "running.thresholds.lthr": true,
  "running.thresholds.thresholdPaceSecPerKm": true,
  "swimming.thresholds.lthr": true,
  "swimming.thresholds.cssPaceSecPer100m": true,
  "heartRate.max": true,
};

export const isProfileThresholdKey = (
  field: FieldKey
): field is ProfileThresholdKey => Object.hasOwn(PROFILE_THRESHOLD_KEYS, field);
