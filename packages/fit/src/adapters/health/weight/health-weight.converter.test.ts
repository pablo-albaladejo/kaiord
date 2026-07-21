import { describe, expect, it } from "vitest";

import {
  mapFitWeightScaleToKrd,
  mapKrdWeightToFit,
} from "./health-weight.converter";

const KRD_WEIGHT_KG = 75.8;
const BODY_FAT_PERCENT = 22.3;
const FIT_TIMESTAMP_ISO = "2024-12-31T23:00:00.000Z";

describe("mapFitWeightScaleToKrd", () => {
  it("should carry the SDK-scaled weight through as kilograms without scaling", () => {
    // Arrange
    const fit = {
      timestamp: new Date(FIT_TIMESTAMP_ISO),
      weight: KRD_WEIGHT_KG,
      percentFat: BODY_FAT_PERCENT,
    };

    // Act
    const krd = mapFitWeightScaleToKrd(fit);

    // Assert
    expect(krd).toEqual({
      kind: "weight",
      version: "2.0",
      measuredAt: FIT_TIMESTAMP_ISO,
      weightKilograms: KRD_WEIGHT_KG,
    });
  });

  it("should return undefined for non-positive raw weight (Garmin invalid sentinel)", () => {
    // Arrange
    const fit = {
      timestamp: new Date(FIT_TIMESTAMP_ISO),
      weight: 0,
    };

    // Act
    const krd = mapFitWeightScaleToKrd(fit);

    // Assert
    expect(krd).toBeUndefined();
  });
});

describe("mapKrdWeightToFit", () => {
  it("should carry kilograms through to FIT unscaled for the encoder to scale", () => {
    // Arrange
    const weight = {
      kind: "weight" as const,
      version: "2.0",
      measuredAt: FIT_TIMESTAMP_ISO,
      weightKilograms: KRD_WEIGHT_KG,
    };

    // Act
    const fit = mapKrdWeightToFit(weight);

    // Assert
    expect(fit.weight).toBe(KRD_WEIGHT_KG);
    expect((fit.timestamp as Date).toISOString()).toBe(FIT_TIMESTAMP_ISO);
  });
});
