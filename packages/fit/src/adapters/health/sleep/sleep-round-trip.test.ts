import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Decoder, Stream } from "@garmin/fitsdk";
import { sleepRecordSchema } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import type { FitMessages } from "../../shared/types";
import { convertFitToKrdHealthSleep } from "./fit-to-krd-health-sleep.converter";
import { convertKrdToFitHealthSleepMessages } from "./krd-health-sleep-to-fit.converter";

const FIXTURE_PATH = resolve(
  import.meta.dirname,
  "../../../../../../test-fixtures/fit/HealthSleepOvernight.fit"
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

describe("FIT → KRD: HealthSleepOvernight.fit", () => {
  it("should produce a valid KRD sleep_record from the real-device sleep fixture", () => {
    // Arrange
    const logger = createMockLogger();
    const messages = decodeFixture();

    // Act
    const krd = convertFitToKrdHealthSleep(messages, logger);

    // Assert
    expect(krd.type).toBe("sleep_record");
    expect(krd.version).toBe("2.0");
    expect(krd.metadata.created).toBeTruthy();
    expect(krd.metadata.sport).toBeUndefined();
    const sleep = (krd.extensions as { health?: { sleep?: unknown } })?.health
      ?.sleep;
    expect(sleep).toBeDefined();
    expect(sleepRecordSchema.safeParse(sleep).success).toBe(true);
  });
});

describe("KRD → FIT messages: HealthSleepOvernight round-trip", () => {
  it("should preserve every stage's timestamp + level through KRD → FIT → KRD", () => {
    // Arrange
    const logger = createMockLogger();
    const original = convertFitToKrdHealthSleep(decodeFixture(), logger);
    const sleepBefore = (
      original.extensions as { health: { sleep: { stages: unknown[] } } }
    ).health.sleep;

    // Act
    // simulate a second decode by replaying the FIT messages list
    const fitMessages = convertKrdToFitHealthSleepMessages(original, logger);
    const replayed: FitMessages = {
      fileIdMesgs: [fitMessages[0]] as never,
      sleepLevelMesgs: fitMessages.slice(1) as never,
    };
    const roundTripped = convertFitToKrdHealthSleep(replayed, logger);
    const sleepAfter = (
      roundTripped.extensions as { health: { sleep: { stages: unknown[] } } }
    ).health.sleep;

    // Assert
    expect(sleepAfter.stages).toEqual(sleepBefore.stages);
  });
});
