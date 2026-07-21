import type { WeightMeasurement } from "@kaiord/core";

import { fitTimestampToIso } from "../../shared/fit-timestamp";
import type { FitWeightScale } from "./fit-weight-scale.schema";

const HEALTH_VERSION = "2.0";

/**
 * Converts a single FIT `weight_scale` message into a KRD weight payload.
 *
 * The FIT field is uint16 with profile scale 100, but the @garmin/fitsdk
 * Decoder auto-applies that scale, so it already yields REAL kilograms
 * (a real fixture decodes `weight: 75.8`). The mapper therefore carries
 * the value through unscaled — a manual ÷100 would corrupt it to 0.758.
 *
 * Returns `undefined` if the weight is non-positive (Garmin uses
 * 0xFFFE as a "calculating" sentinel and 0xFFFF as invalid).
 */
export const mapFitWeightScaleToKrd = (
  fit: FitWeightScale
): WeightMeasurement | undefined => {
  if (fit.weight <= 0) return undefined;
  return {
    kind: "weight",
    version: HEALTH_VERSION,
    measuredAt: fitTimestampToIso(fit.timestamp),
    weightKilograms: fit.weight,
  };
};

/**
 * Inverse mapper — KRD weight payload → FIT `weight_scale` shape ready
 * for the FIT encoder. The value stays in REAL kilograms; the encoder
 * applies the profile scale 100 itself (a manual ×100 double-scales and
 * overflows the uint16 raw).
 */
export const mapKrdWeightToFit = (
  weight: WeightMeasurement
): FitWeightScale => ({
  timestamp: new Date(weight.measuredAt),
  weight: weight.weightKilograms,
});
