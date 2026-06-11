import type { BodyComposition } from "@kaiord/core";

import { fitTimestampToIso } from "../../shared/fit-timestamp";
import type { FitBodyComposition } from "./fit-body-composition.schema";

const HEALTH_VERSION = "2.0";

const FIT_KG_SCALE = 100;

const fromScaledKg = (value: number | undefined): number | undefined =>
  value === undefined ? undefined : value / FIT_KG_SCALE;

const toScaledKg = (value: number | undefined): number | undefined =>
  value === undefined ? undefined : Math.round(value * FIT_KG_SCALE);

const collectMeasurements = (
  fit: FitBodyComposition
): Partial<BodyComposition> => {
  const out: Partial<BodyComposition> = {};
  if (fit.percentFat !== undefined) out.bodyFatPercent = fit.percentFat;
  if (fit.percentHydration !== undefined)
    out.bodyWaterPercent = fit.percentHydration;
  const leanMassKilograms = fromScaledKg(fit.muscleMass);
  if (leanMassKilograms !== undefined)
    out.leanMassKilograms = leanMassKilograms;
  const boneMassKilograms = fromScaledKg(fit.boneMass);
  if (boneMassKilograms !== undefined)
    out.boneMassKilograms = boneMassKilograms;
  if (fit.bmi !== undefined) out.bmi = fit.bmi;
  return out;
};

/**
 * Maps a single FIT `body_composition` message into the KRD payload.
 *
 * Returns `undefined` when none of the measurement fields are
 * present (the KRD schema requires at-least-one). Garmin scales bone
 * and muscle mass by 100 (uint16 raw 1234 = 12.34 kg); the SDK does
 * not auto-unscale these custom fields so the mapper divides.
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
    muscleMass: toScaledKg(body.leanMassKilograms),
  }),
  ...(body.boneMassKilograms !== undefined && {
    boneMass: toScaledKg(body.boneMassKilograms),
  }),
  ...(body.bmi !== undefined && { bmi: body.bmi }),
});
