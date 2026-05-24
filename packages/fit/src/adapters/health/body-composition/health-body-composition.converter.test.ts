import { describe, expect, it } from "vitest";

import {
  mapFitBodyCompositionToKrd,
  mapKrdBodyCompositionToFit,
} from "./health-body-composition.converter";

const MEASURED_AT = "2026-05-22T07:15:00.000Z";
const BODY_FAT_PERCENT = 18.4;
const MUSCLE_MASS_KG = 58.2;
const MUSCLE_MASS_RAW = 5820;
const BONE_MASS_KG = 3.1;

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

  it("should divide raw scaled muscle mass and bone mass by 100 to yield kilograms", () => {
    // Arrange
    const fit = {
      timestamp: new Date(MEASURED_AT),
      muscleMass: MUSCLE_MASS_RAW,
    };

    // Act
    const krd = mapFitBodyCompositionToKrd(fit);

    // Assert
    expect(krd?.leanMassKilograms).toBe(MUSCLE_MASS_KG);
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
  it("should round-trip bodyFatPercent and scale leanMass back to FIT raw", () => {
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
    expect(fit.muscleMass).toBe(MUSCLE_MASS_RAW);
    expect((fit.timestamp as Date).toISOString()).toBe(MEASURED_AT);
  });
});
