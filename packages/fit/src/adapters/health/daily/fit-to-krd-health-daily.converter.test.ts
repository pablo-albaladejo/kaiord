import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import type { FitMessages } from "../../shared/types";
import { convertFitToKrdHealthDaily } from "./fit-to-krd-health-daily.converter";

const DAY_TIMESTAMP = "2024-12-31T23:11:00.000Z";
const EXPECTED_DATE = "2024-12-31";
const STEPS_A = 1500;
const STEPS_B = 500;
const TOTAL_STEPS = STEPS_A + STEPS_B;
const KCAL_A = 80;
const KCAL_B = 20;
const RESTING_KCAL = 2000;

describe("convertFitToKrdHealthDaily", () => {
  it("should produce a daily_wellness KRD from monitoring + monitoring_info messages", () => {
    // Arrange
    const messages: FitMessages = {
      fileIdMesgs: [{ timeCreated: new Date(DAY_TIMESTAMP) }],
      monitoringInfoMesgs: [
        {
          timestamp: new Date(DAY_TIMESTAMP),
          restingMetabolicRate: RESTING_KCAL,
        },
      ],
      monitoringMesgs: [
        {
          timestamp: new Date(DAY_TIMESTAMP),
          steps: STEPS_A,
          activeCalories: KCAL_A,
        },
        {
          timestamp: new Date(DAY_TIMESTAMP),
          steps: STEPS_B,
          activeCalories: KCAL_B,
        },
      ],
    };
    const logger = createMockLogger();

    // Act
    const krd = convertFitToKrdHealthDaily(messages, logger);

    // Assert
    expect(krd.type).toBe("daily_wellness");
    const daily = (
      krd.extensions as { health?: { daily?: { steps?: number } } }
    )?.health?.daily;
    expect(daily?.steps).toBe(TOTAL_STEPS);
    expect((daily as { date?: string } | undefined)?.date).toBe(EXPECTED_DATE);
  });

  it("should produce a KRD with undefined extensions when no monitoring messages are present", () => {
    // Arrange
    const messages: FitMessages = {
      fileIdMesgs: [{ timeCreated: new Date(DAY_TIMESTAMP) }],
    };
    const logger = createMockLogger();

    // Act
    const krd = convertFitToKrdHealthDaily(messages, logger);

    // Assert
    expect(krd.type).toBe("daily_wellness");
    expect(krd.extensions).toBeUndefined();
  });
});
