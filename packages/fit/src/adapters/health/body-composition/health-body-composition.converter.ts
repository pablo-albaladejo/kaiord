import type { BodyComposition } from "@kaiord/core";

import { fitTimestampToIso } from "../../shared/fit-timestamp";
import type { FitBodyComposition } from "./fit-body-composition.schema";

const HEALTH_VERSION = "2.0";

const collectMeasurements = (
  fit: FitBodyComposition
): Partial<BodyComposition> => {
  const out: Partial<BodyComposition> = {};
  if (fit.percentFat !== undefined) out.bodyFatPercent = fit.percentFat;
  if (fit.percentHydration !== undefined)
    out.bodyWaterPercent = fit.percentHydration;
  // boneMass/muscleMass (profile scale 100, kg), visceralFatRating (scale 1)
  // and basalMet (scale 4, kcal/day) are pass-throughs: the @garmin/fitsdk
  // Decoder/Encoder auto-applies their profile scale, so the mapper carries
  // REAL values (like percentFat/bmi) and must NOT scale them itself. A manual
  // x100 double-scales bone/muscle and overflows the uint16 raw — a real
  // encode→decode probe decodes 58.2 kg back as 577.12. Verified by an
  // encode→decode probe against the SDK (weight_scale carries the same field
  // definitions). See basal-met-sdk-scale.test.ts.
  if (fit.muscleMass !== undefined) out.leanMassKilograms = fit.muscleMass;
  if (fit.boneMass !== undefined) out.boneMassKilograms = fit.boneMass;
  if (fit.bmi !== undefined) out.bmi = fit.bmi;
  if (fit.visceralFatRating !== undefined)
    out.visceralFatRating = fit.visceralFatRating;
  if (fit.basalMet !== undefined) out.basalMetabolicRateKcal = fit.basalMet;
  return out;
};

/**
 * Maps a single FIT `body_composition` message into the KRD payload.
 *
 * Returns `undefined` when none of the measurement fields are present
 * (the KRD schema requires at-least-one). Bone and muscle mass are
 * carried as REAL kilograms: the @garmin/fitsdk auto-applies the FIT
 * profile scale (100) on both encode and decode, so the mapper never
 * scales them itself.
 */
export const mapFitBodyCompositionToKrd = (
  fit: FitBodyComposition
): BodyComposition | undefined => {
  const measurements = collectMeasurements(fit);
  if (Object.keys(measurements).length === 0) return undefined;
  return {
    kind: "bodyComposition",
    version: HEALTH_VERSION,
    measuredAt: fitTimestampToIso(fit.timestamp),
    ...measurements,
  };
};

/**
 * Inverse mapper — KRD body composition → FIT `body_composition`
 * message shape.
 */
export const mapKrdBodyCompositionToFit = (
  body: BodyComposition
): FitBodyComposition => ({
  timestamp: new Date(body.measuredAt),
  ...(body.bodyFatPercent !== undefined && { percentFat: body.bodyFatPercent }),
  ...(body.bodyWaterPercent !== undefined && {
    percentHydration: body.bodyWaterPercent,
  }),
  ...(body.leanMassKilograms !== undefined && {
    muscleMass: body.leanMassKilograms,
  }),
  ...(body.boneMassKilograms !== undefined && {
    boneMass: body.boneMassKilograms,
  }),
  ...(body.bmi !== undefined && { bmi: body.bmi }),
  ...(body.visceralFatRating !== undefined && {
    visceralFatRating: body.visceralFatRating,
  }),
  ...(body.basalMetabolicRateKcal !== undefined && {
    basalMet: body.basalMetabolicRateKcal,
  }),
});
