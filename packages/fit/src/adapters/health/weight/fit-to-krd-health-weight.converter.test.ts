import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import type { FitMessages } from "../../shared/types";
import { convertFitToKrdHealthWeight } from "./fit-to-krd-health-weight.converter";

const TIME_CREATED = new Date("2024-12-31T23:00:00.000Z");
const TIMESTAMP_ISO = "2024-12-31T23:00:00.000Z";
const EXPECTED_KG = 75.8;
const SECOND_WEIGHT_KG = 58.2;

describe("convertFitToKrdHealthWeight", () => {
  it("should produce a weight_measurement KRD carrying the SDK-scaled weight kg", () => {
    // Arrange
    const messages: FitMessages = {
      fileIdMesgs: [{ timeCreated: TIME_CREATED }],
      weightScaleMesgs: [
        {
          timestamp: new Date(TIMESTAMP_ISO),
          weight: EXPECTED_KG,
        },
      ],
    };
    const logger = createMockLogger();

    // Act
    const krd = convertFitToKrdHealthWeight(messages, logger);

    // Assert
    expect(krd.type).toBe("weight_measurement");
    expect(krd.version).toBe("2.0");
    const weight = (
      krd.extensions as { health?: { weight?: { weightKilograms?: number } } }
    )?.health?.weight;
    expect(weight?.weightKilograms).toBe(EXPECTED_KG);
  });

  it("should return a KRD with undefined extensions when no weight_scale message is present", () => {
    // Arrange
    const messages: FitMessages = {
      fileIdMesgs: [{ timeCreated: TIME_CREATED }],
    };
    const logger = createMockLogger();

    // Act
    const krd = convertFitToKrdHealthWeight(messages, logger);

    // Assert
    expect(krd.type).toBe("weight_measurement");
    expect(krd.extensions).toBeUndefined();
  });

  it("should keep the first valid measurement and drop the rest for multi-user files", () => {
    // Arrange
    const messages: FitMessages = {
      fileIdMesgs: [{ timeCreated: TIME_CREATED }],
      weightScaleMesgs: [
        { timestamp: new Date(TIMESTAMP_ISO), weight: EXPECTED_KG },
        { timestamp: new Date(TIMESTAMP_ISO), weight: SECOND_WEIGHT_KG },
      ],
    };
    const logger = createMockLogger();

    // Act
    const krd = convertFitToKrdHealthWeight(messages, logger);

    // Assert
    const weight = (
      krd.extensions as { health?: { weight?: { weightKilograms?: number } } }
    )?.health?.weight;
    expect(weight?.weightKilograms).toBe(EXPECTED_KG);
  });
});
