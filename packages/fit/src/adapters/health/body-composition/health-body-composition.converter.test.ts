import { describe, expect, it } from "vitest";

import {
  mapFitBodyCompositionToKrd,
  mapKrdBodyCompositionToFit,
} from "./health-body-composition.converter";

const MEASURED_AT = "2026-05-22T07:15:00.000Z";
const BODY_FAT_PERCENT = 18.4;
const MUSCLE_MASS_KG = 58.2;
const BONE_MASS_KG = 3.1;
const VISCERAL_FAT_RATING = 12;
// basalMet has FIT profile scale 4 (kcal/day), but the @garmin/fitsdk
// Decoder/Encoder auto-applies that scale, so the mapper carries the REAL
// kcal value with NO scaling on either side (FIT raw == KRD kcal at the
// mapper boundary). The byte-level scale-4 behaviour is pinned separately
// in basal-met-sdk-scale.test.ts.
const BASAL_MET_KCAL = 1500;
const BASAL_MET_FIT_RAW = 1500;

describe("mapFitBodyCompositionToKrd", () => {
  it("should produce a KRD body composition with at least one optional field present", () => {
    // Arrange
    const fit = {
      timestamp: new Date(MEASURED_AT),
      percentFat: BODY_FAT_PERCENT,
    };

    // Act
    const krd = mapFitBodyCompositionToKrd(fit);

    // Assert
    expect(krd).toEqual({
      kind: "bodyComposition",
      version: "2.0",
      measuredAt: MEASURED_AT,
      bodyFatPercent: BODY_FAT_PERCENT,
    });
  });

  it("should map muscle mass and bone mass as real kilograms without scaling", () => {
    // Arrange
    const fit = {
      timestamp: new Date(MEASURED_AT),
      muscleMass: MUSCLE_MASS_KG,
      boneMass: BONE_MASS_KG,
    };

    // Act
    const krd = mapFitBodyCompositionToKrd(fit);

    // Assert
    expect(krd?.leanMassKilograms).toBe(MUSCLE_MASS_KG);
    expect(krd?.boneMassKilograms).toBe(BONE_MASS_KG);
  });

  it("should pass through visceralFatRating and map basalMet to basalMetabolicRateKcal without scaling", () => {
    // Arrange
    const fit = {
      timestamp: new Date(MEASURED_AT),
      visceralFatRating: VISCERAL_FAT_RATING,
      basalMet: BASAL_MET_FIT_RAW,
    };

    // Act
    const krd = mapFitBodyCompositionToKrd(fit);

    // Assert
    expect(krd?.visceralFatRating).toBe(VISCERAL_FAT_RATING);
    expect(krd?.basalMetabolicRateKcal).toBe(BASAL_MET_KCAL);
  });

  it("should return undefined when no measurement field is present", () => {
    // Arrange
    const fit = { timestamp: new Date(MEASURED_AT) };

    // Act
    const krd = mapFitBodyCompositionToKrd(fit);

    // Assert
    expect(krd).toBeUndefined();
  });
});

describe("mapKrdBodyCompositionToFit", () => {
  it("should map bodyFatPercent and lean and bone mass to FIT as real kilograms", () => {
    // Arrange
    const body = {
      kind: "bodyComposition" as const,
      version: "2.0",
      measuredAt: MEASURED_AT,
      bodyFatPercent: BODY_FAT_PERCENT,
      leanMassKilograms: MUSCLE_MASS_KG,
      boneMassKilograms: BONE_MASS_KG,
    };

    // Act
    const fit = mapKrdBodyCompositionToFit(body);

    // Assert
    expect(fit.percentFat).toBe(BODY_FAT_PERCENT);
    expect(fit.muscleMass).toBe(MUSCLE_MASS_KG);
    expect(fit.boneMass).toBe(BONE_MASS_KG);
    expect((fit.timestamp as Date).toISOString()).toBe(MEASURED_AT);
  });

  it("should map basalMetabolicRateKcal to FIT basalMet unscaled and pass through visceralFatRating", () => {
    // Arrange
    const body = {
      kind: "bodyComposition" as const,
      version: "2.0",
      measuredAt: MEASURED_AT,
      visceralFatRating: VISCERAL_FAT_RATING,
      basalMetabolicRateKcal: BASAL_MET_KCAL,
    };

    // Act
    const fit = mapKrdBodyCompositionToFit(body);

    // Assert
    // The mapper does NOT scale basalMet (the SDK applies profile scale 4);
    // the intermediate FIT value equals the real kcal.
    expect(fit.basalMet).toBe(BASAL_MET_FIT_RAW);
    expect(fit.visceralFatRating).toBe(VISCERAL_FAT_RATING);
  });
});
