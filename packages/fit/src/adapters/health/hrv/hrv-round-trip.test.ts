import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Decoder, Stream } from "@garmin/fitsdk";
import { hrvSummarySchema } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";
import type { FitMessages } from "../../shared/types";
import { convertFitToKrdHealthHrv } from "./fit-to-krd-health-hrv.converter";
import { convertKrdToFitHealthHrvMessages } from "./krd-health-hrv-to-fit.converter";

const ROUND_TRIP_TOLERANCE_MS = 1;

const FIXTURE_PATH = resolve(
  import.meta.dirname,
  "../../../../../../test-fixtures/fit/HealthHrvOvernight.fit"
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

describe("FIT → KRD: HealthHrvOvernight.fit (synthetic)", () => {
  it("should produce a valid KRD hrv_summary from the synthetic fixture", () => {
    // Arrange
    const logger = createMockLogger();
    const messages = decodeFixture();

    // Act
    const krd = convertFitToKrdHealthHrv(messages, logger);

    // Assert
    expect(krd.type).toBe("hrv_summary");
    const hrv = (krd.extensions as { health?: { hrv?: unknown } })?.health?.hrv;
    expect(hrv).toBeDefined();
    expect(hrvSummarySchema.safeParse(hrv).success).toBe(true);
  });
});

describe("KRD → FIT → KRD HRV round-trip", () => {
  it("should preserve rMSSD within ±1 ms across the round-trip", () => {
    // Arrange
    const logger = createMockLogger();
    const original = convertFitToKrdHealthHrv(decodeFixture(), logger);
    const rmssdBefore = (
      original.extensions as { health: { hrv: { rMSSD: number } } }
    ).health.hrv.rMSSD;

    // Act
    const fitMessages = convertKrdToFitHealthHrvMessages(original, logger);
    const replayed: FitMessages = {
      fileIdMesgs: [fitMessages[0]] as never,
      hrvStatusSummaryMesgs: [fitMessages[1]] as never,
    };
    const roundTripped = convertFitToKrdHealthHrv(replayed, logger);
    const rmssdAfter = (
      roundTripped.extensions as { health: { hrv: { rMSSD: number } } }
    ).health.hrv.rMSSD;

    // Assert
    expect(Math.abs(rmssdAfter - rmssdBefore)).toBeLessThanOrEqual(
      ROUND_TRIP_TOLERANCE_MS
    );
    expect(fitMessages[1].mesgNum).toBe(FIT_MESSAGE_NUMBERS.HRV_STATUS_SUMMARY);
  });
});
