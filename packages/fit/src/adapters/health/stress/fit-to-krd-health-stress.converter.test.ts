import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import type { FitMessages } from "../../shared/types";
import { convertFitToKrdHealthStress } from "./fit-to-krd-health-stress.converter";

const SAMPLE_LOW = 25;
const SAMPLE_HIGH = 65;

describe("convertFitToKrdHealthStress", () => {
  it("should produce a KRD stress_episode with valid extensions payload", () => {
    // Arrange
    const logger = createMockLogger();
    const messages: FitMessages = {
      fileIdMesgs: [
        {
          timeCreated: new Date("2026-05-23T07:00:00.000Z"),
          manufacturer: "garmin",
          product: 3196,
        },
      ],
      stressLevelMesgs: [
        {
          stressLevelTime: new Date("2026-05-23T08:00:00.000Z"),
          stressLevelValue: SAMPLE_LOW,
        },
        {
          stressLevelTime: new Date("2026-05-23T09:00:00.000Z"),
          stressLevelValue: SAMPLE_HIGH,
        },
      ],
    };

    // Act
    const krd = convertFitToKrdHealthStress(messages, logger);

    // Assert
    expect(krd.type).toBe("stress_episode");
    expect(krd.metadata.manufacturer).toBe("garmin");
    const stress = (
      krd.extensions as { health?: { stress?: { peakLevel: number } } }
    )?.health?.stress;
    expect(stress?.peakLevel).toBe(SAMPLE_HIGH);
  });

  it("should omit extensions when only invalid samples are present", () => {
    // Arrange
    const logger = createMockLogger();
    const messages: FitMessages = {
      stressLevelMesgs: [
        {
          stressLevelTime: new Date("2026-05-23T08:00:00.000Z"),
          stressLevelValue: -1,
        },
      ],
    };

    // Act
    const krd = convertFitToKrdHealthStress(messages, logger);

    // Assert
    expect(krd.extensions).toBeUndefined();
  });
});
