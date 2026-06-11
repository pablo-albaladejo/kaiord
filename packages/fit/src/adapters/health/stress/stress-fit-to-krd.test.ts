import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Decoder, Stream } from "@garmin/fitsdk";
import { stressEpisodeSchema } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import type { FitMessages } from "../../shared/types";
import { convertFitToKrdHealthStress } from "./fit-to-krd-health-stress.converter";

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
  it("should produce a valid stress_episode KRD from the real-device fixture", () => {
    // Arrange
    const logger = createMockLogger();
    const messages = decodeFixture();

    // Act
    const krd = convertFitToKrdHealthStress(messages, logger);

    // Assert
    expect(krd.type).toBe("stress_episode");
    const stress = (krd.extensions as { health?: { stress?: unknown } })?.health
      ?.stress;
    expect(stress).toBeDefined();
    expect(stressEpisodeSchema.safeParse(stress).success).toBe(true);
  });

  it("should report peak ≥ average within the 0..100 range", () => {
    // Arrange
    const logger = createMockLogger();
    const messages = decodeFixture();

    // Act
    const krd = convertFitToKrdHealthStress(messages, logger);

    // Assert
    const stress = (
      krd.extensions as {
        health?: { stress?: { averageLevel: number; peakLevel: number } };
      }
    )?.health?.stress;
    expect(stress?.peakLevel).toBeGreaterThanOrEqual(stress?.averageLevel ?? 0);
    expect(stress?.peakLevel).toBeLessThanOrEqual(100);
  });
});
