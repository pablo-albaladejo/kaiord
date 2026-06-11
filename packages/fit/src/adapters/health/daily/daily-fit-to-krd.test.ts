import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Decoder, Stream } from "@garmin/fitsdk";
import { dailyWellnessSchema } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import type { FitMessages } from "../../shared/types";
import { convertFitToKrdHealthDaily } from "./fit-to-krd-health-daily.converter";

const FIXTURE_PATH = resolve(
  import.meta.dirname,
  "../../../../../../test-fixtures/fit/HealthMonitoringStressDay.fit"
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

describe("FIT → KRD: HealthMonitoringStressDay.fit", () => {
  it("should produce a valid daily_wellness KRD from the real-device fixture", () => {
    // Arrange
    const logger = createMockLogger();
    const messages = decodeFixture();

    // Act
    const krd = convertFitToKrdHealthDaily(messages, logger);

    // Assert
    expect(krd.type).toBe("daily_wellness");
    const daily = (krd.extensions as { health?: { daily?: unknown } })?.health
      ?.daily;
    expect(daily).toBeDefined();
    expect(dailyWellnessSchema.safeParse(daily).success).toBe(true);
  });

  it("should aggregate steps from the real-device fixture into a positive total", () => {
    // Arrange
    const logger = createMockLogger();
    const messages = decodeFixture();

    // Act
    const krd = convertFitToKrdHealthDaily(messages, logger);

    // Assert
    const daily = (
      krd.extensions as { health?: { daily?: { steps?: number } } }
    )?.health?.daily;
    expect(daily?.steps).toBeGreaterThan(0);
  });
});
