import { describe, expect, it } from "vitest";

import {
  mapFitWeightScaleToKrd,
  mapKrdWeightToFit,
} from "./health-weight.converter";

const FIT_WEIGHT_RAW = 7580;
const KRD_WEIGHT_KG = 75.8;
const FIT_TIMESTAMP_ISO = "2024-12-31T23:00:00.000Z";

describe("mapFitWeightScaleToKrd", () => {
  it("should divide the raw FIT scaled weight by 100 to yield kilograms", () => {
    // Arrange
    const fit = {
      timestamp: new Date(FIT_TIMESTAMP_ISO),
      weight: FIT_WEIGHT_RAW,
      percentFat: 22.3,
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
  it("should multiply kilograms by 100 and round to the scaled uint16", () => {
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
    expect(fit.weight).toBe(FIT_WEIGHT_RAW);
    expect((fit.timestamp as Date).toISOString()).toBe(FIT_TIMESTAMP_ISO);
  });
});
