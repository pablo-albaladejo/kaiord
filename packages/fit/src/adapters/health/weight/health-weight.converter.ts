import type { WeightMeasurement } from "@kaiord/core";

import type { FitWeightScale } from "./fit-weight-scale.schema";

const HEALTH_VERSION = "2.0";
const FIT_WEIGHT_SCALE = 100;

const toIsoString = (value: FitWeightScale["timestamp"]): string => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return new Date(value * 1000).toISOString();
  return new Date(value).toISOString();
};

/**
 * Converts a single FIT `weight_scale` message into a KRD weight payload.
 *
 * The FIT field is uint16 scaled by 100 (raw 7580 = 75.80 kg); the
 * Decoder leaves the value un-scaled for the special `weight` field
 * type so we divide here.
 *
 * Returns `undefined` if the raw weight is non-positive (Garmin uses
 * 0xFFFE as a "calculating" sentinel and 0xFFFF as invalid).
 */
export const mapFitWeightScaleToKrd = (
  fit: FitWeightScale
): WeightMeasurement | undefined => {
  if (fit.weight <= 0) return undefined;
  return {
    kind: "weight",
    version: HEALTH_VERSION,
    measuredAt: toIsoString(fit.timestamp),
    weightKilograms: fit.weight / FIT_WEIGHT_SCALE,
  };
};

/**
 * Inverse mapper — KRD weight payload → FIT `weight_scale` shape ready
 * for the FIT encoder.
 */
export const mapKrdWeightToFit = (
  weight: WeightMeasurement
): FitWeightScale => ({
  timestamp: new Date(weight.measuredAt),
  weight: Math.round(weight.weightKilograms * FIT_WEIGHT_SCALE),
});
