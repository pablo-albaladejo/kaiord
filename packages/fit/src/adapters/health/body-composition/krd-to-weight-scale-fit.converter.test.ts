import type { BodyComposition, KRD, WeightMeasurement } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";
import { convertKrdToWeightScaleUploadMessages } from "./krd-to-weight-scale-fit.converter";

const MEASURED_AT = "2026-05-22T07:15:00.000Z";
const WEIGHT_KG = 75.8;
const BODY_FAT_PERCENT = 20.4;
const LEAN_MASS_KG = 58.2;
const BONE_MASS_KG = 3.4;
const BASAL_MET_KCAL = 1500;
const EXPECTED_MESSAGE_COUNT = 2;

const weight: WeightMeasurement = {
  kind: "weight",
  version: "2.0",
  measuredAt: MEASURED_AT,
  weightKilograms: WEIGHT_KG,
};

const bodyComposition: BodyComposition = {
  kind: "bodyComposition",
  version: "2.0",
  measuredAt: MEASURED_AT,
  bodyFatPercent: BODY_FAT_PERCENT,
  leanMassKilograms: LEAN_MASS_KG,
  boneMassKilograms: BONE_MASS_KG,
  basalMetabolicRateKcal: BASAL_MET_KCAL,
};

const krdWith = (health: Record<string, unknown>): KRD => ({
  version: "2.0",
  type: "body_composition",
  metadata: { created: MEASURED_AT },
  extensions: { health },
});

describe("convertKrdToWeightScaleUploadMessages", () => {
  it("should emit a file_id and a weight_scale message merging weight and composition fields", () => {
    // Arrange
    const logger = createMockLogger();
    const krd = krdWith({ weight, bodyComposition });

    // Act
    const messages = convertKrdToWeightScaleUploadMessages(krd, logger);

    // Assert
    expect(messages).toHaveLength(EXPECTED_MESSAGE_COUNT);
    expect(messages[0].mesgNum).toBe(FIT_MESSAGE_NUMBERS.FILE_ID);
    expect(messages[0].type).toBe("weight");
    expect(messages[1]).toMatchObject({
      mesgNum: FIT_MESSAGE_NUMBERS.WEIGHT_SCALE,
      weight: WEIGHT_KG,
      percentFat: BODY_FAT_PERCENT,
      muscleMass: LEAN_MASS_KG,
      boneMass: BONE_MASS_KG,
      basalMet: BASAL_MET_KCAL,
    });
  });

  it("should emit a weight_scale carrying only weight when there is no body composition", () => {
    // Arrange
    const logger = createMockLogger();
    const krd = krdWith({ weight });

    // Act
    const messages = convertKrdToWeightScaleUploadMessages(krd, logger);

    // Assert
    expect(messages[1].weight).toBe(WEIGHT_KG);
    expect(messages[1].percentFat).toBeUndefined();
  });

  it("should emit a weight_scale carrying composition fields when there is no weight", () => {
    // Arrange
    const logger = createMockLogger();
    const krd = krdWith({ bodyComposition });

    // Act
    const messages = convertKrdToWeightScaleUploadMessages(krd, logger);

    // Assert
    expect(messages[1].weight).toBeUndefined();
    expect(messages[1].percentFat).toBe(BODY_FAT_PERCENT);
  });

  it("should return no messages when neither weight nor body composition is present", () => {
    // Arrange
    const logger = createMockLogger();
    const krd = krdWith({});

    // Act
    const messages = convertKrdToWeightScaleUploadMessages(krd, logger);

    // Assert
    expect(messages).toEqual([]);
  });
});
