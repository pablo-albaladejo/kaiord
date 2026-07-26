import { Decoder, Encoder, Stream } from "@garmin/fitsdk";
import type { BodyComposition, KRD, WeightMeasurement } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { encodeBodyCompositionFit } from "../../garmin-fitsdk";

const MEASURED_AT = "2026-05-22T07:15:00.000Z";
const WEIGHT_KG = 75.8;
const BODY_FAT_PERCENT = 20.4;
const BODY_WATER_PERCENT = 55.2;
const LEAN_MASS_KG = 58.2;
const BONE_MASS_KG = 3.4;
const BMI = 23.5;
const VISCERAL_FAT_RATING = 12;
const BASAL_MET_KCAL = 1500;
const BODY_COMPOSITION_MESG_NUM = 41;

const buildWeight = (): WeightMeasurement => ({
  kind: "weight",
  version: "2.0",
  measuredAt: MEASURED_AT,
  weightKilograms: WEIGHT_KG,
});

const buildBodyComposition = (): BodyComposition => ({
  kind: "bodyComposition",
  version: "2.0",
  measuredAt: MEASURED_AT,
  bodyFatPercent: BODY_FAT_PERCENT,
  bodyWaterPercent: BODY_WATER_PERCENT,
  leanMassKilograms: LEAN_MASS_KG,
  boneMassKilograms: BONE_MASS_KG,
  bmi: BMI,
  visceralFatRating: VISCERAL_FAT_RATING,
  basalMetabolicRateKcal: BASAL_MET_KCAL,
});

const buildUploadKrd = (): KRD => ({
  version: "2.0",
  type: "body_composition",
  metadata: { created: MEASURED_AT },
  extensions: {
    health: { weight: buildWeight(), bodyComposition: buildBodyComposition() },
  },
});

const decodeBytes = (
  bytes: Uint8Array
): {
  weightScale?: Record<string, number>;
  bodyCompositionMesgs?: unknown[];
  errors: Array<string>;
} => {
  const decoder = new Decoder(Stream.fromByteArray(Array.from(bytes)));
  const { messages, errors } = decoder.read();
  const typed = messages as {
    weightScaleMesgs?: Array<Record<string, number>>;
    bodyCompositionMesgs?: unknown[];
  };
  return {
    weightScale: typed.weightScaleMesgs?.[0],
    bodyCompositionMesgs: typed.bodyCompositionMesgs,
    errors,
  };
};

describe("encodeBodyCompositionFit through the real @garmin/fitsdk byte path", () => {
  it("should encode weight and body composition into a weight_scale message whose fields survive decode with REAL values", () => {
    // Arrange
    const logger = createMockLogger();
    const krd = buildUploadKrd();

    // Act
    const bytes = encodeBodyCompositionFit(krd, logger);
    const { weightScale, errors } = decodeBytes(bytes);

    // Assert
    expect(errors).toEqual([]);
    expect(weightScale?.weight).toBe(WEIGHT_KG);
    expect(weightScale?.percentFat).toBe(BODY_FAT_PERCENT);
    expect(weightScale?.percentHydration).toBe(BODY_WATER_PERCENT);
    expect(weightScale?.muscleMass).toBe(LEAN_MASS_KG);
    expect(weightScale?.boneMass).toBe(BONE_MASS_KG);
    expect(weightScale?.bmi).toBe(BMI);
    expect(weightScale?.visceralFatRating).toBe(VISCERAL_FAT_RATING);
    expect(weightScale?.basalMet).toBe(BASAL_MET_KCAL);
  });

  it("should emit no body_composition message, since mesgNum 41 is absent from the SDK Profile and throws at the Encoder", () => {
    // Arrange
    const logger = createMockLogger();
    const krd = buildUploadKrd();
    const encodeMesgNum41 = (): void => {
      const encoder = new Encoder();
      encoder.writeMesg({
        mesgNum: BODY_COMPOSITION_MESG_NUM,
        timestamp: new Date(MEASURED_AT),
        percentFat: BODY_FAT_PERCENT,
      });
      encoder.close();
    };

    // Act
    const bytes = encodeBodyCompositionFit(krd, logger);
    const { bodyCompositionMesgs } = decodeBytes(bytes);

    // Assert
    expect(bodyCompositionMesgs).toBeUndefined();
    expect(encodeMesgNum41).toThrow();
  });
});
