import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Decoder, Stream } from "@garmin/fitsdk";
import { weightMeasurementSchema } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";
import type { FitMessages } from "../../shared/types";
import { convertFitToKrdHealthWeight } from "./fit-to-krd-health-weight.converter";
import { convertKrdToFitHealthWeightMessages } from "./krd-health-weight-to-fit.converter";

const ROUND_TRIP_TOLERANCE_KG = 0.01;

const FIXTURE_PATH = resolve(
  import.meta.dirname,
  "../../../../../../test-fixtures/fit/WeightScaleSingleUser.fit"
);

const decodeFixture = (): FitMessages => {
  const buf = readFileSync(FIXTURE_PATH);
  const stream = Stream.fromByteArray(buf);
  const decoder = new Decoder(stream);
  expect(decoder.isFIT()).toBe(true);
  expect(decoder.checkIntegrity()).toBe(true);
  const { messages } = decoder.read();
  return messages as FitMessages;
};

describe("FIT → KRD: WeightScaleSingleUser.fit", () => {
  it("should produce a valid KRD weight_measurement from the SDK fixture", () => {
    // Arrange
    const logger = createMockLogger();
    const messages = decodeFixture();

    // Act
    const krd = convertFitToKrdHealthWeight(messages, logger);

    // Assert
    expect(krd.type).toBe("weight_measurement");
    expect(krd.version).toBe("2.0");
    const weight = (krd.extensions as { health?: { weight?: unknown } })?.health
      ?.weight;
    expect(weight).toBeDefined();
    expect(weightMeasurementSchema.safeParse(weight).success).toBe(true);
  });
});

describe("KRD → FIT → KRD weight round-trip", () => {
  it("should preserve weightKilograms within ±0.01 kg", () => {
    // Arrange
    const logger = createMockLogger();
    const original = convertFitToKrdHealthWeight(decodeFixture(), logger);
    const weightBefore = (
      original.extensions as {
        health: { weight: { weightKilograms: number } };
      }
    ).health.weight.weightKilograms;

    // Act
    const fitMessages = convertKrdToFitHealthWeightMessages(original, logger);
    const replayed: FitMessages = {
      fileIdMesgs: [fitMessages[0]] as never,
      weightScaleMesgs: [fitMessages[1]] as never,
    };
    const roundTripped = convertFitToKrdHealthWeight(replayed, logger);
    const weightAfter = (
      roundTripped.extensions as {
        health: { weight: { weightKilograms: number } };
      }
    ).health.weight.weightKilograms;

    // Assert
    expect(Math.abs(weightAfter - weightBefore)).toBeLessThanOrEqual(
      ROUND_TRIP_TOLERANCE_KG
    );
    expect(fitMessages[1].mesgNum).toBe(FIT_MESSAGE_NUMBERS.WEIGHT_SCALE);
  });
});
