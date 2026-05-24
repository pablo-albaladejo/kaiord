import type { KRD } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";
import { convertKrdToFitHealthWeightMessages } from "./krd-health-weight-to-fit.converter";

const FIT_RAW_WEIGHT = 7580;
const KRD_WEIGHT_KG = 75.8;

const buildWeightKrd = (): KRD => ({
  version: "2.0",
  type: "weight_measurement",
  metadata: { created: "2024-12-31T23:00:00.000Z" },
  extensions: {
    health: {
      weight: {
        kind: "weight",
        version: "2.0",
        measuredAt: "2024-12-31T23:00:00.000Z",
        weightKilograms: KRD_WEIGHT_KG,
      },
    },
  },
});

describe("convertKrdToFitHealthWeightMessages", () => {
  it("should emit file_id followed by a single weight_scale message with scaled value", () => {
    // Arrange
    const krd = buildWeightKrd();
    const logger = createMockLogger();

    // Act
    const messages = convertKrdToFitHealthWeightMessages(krd, logger);

    // Assert
    expect(messages).toHaveLength(2);
    expect(messages[0].mesgNum).toBe(FIT_MESSAGE_NUMBERS.FILE_ID);
    expect(messages[1].mesgNum).toBe(FIT_MESSAGE_NUMBERS.WEIGHT_SCALE);
    expect(messages[1].weight).toBe(FIT_RAW_WEIGHT);
  });

  it("should emit no messages when extensions.health.weight is absent", () => {
    // Arrange
    const krd: KRD = {
      version: "2.0",
      type: "weight_measurement",
      metadata: { created: "2024-12-31T23:00:00.000Z" },
    };
    const logger = createMockLogger();

    // Act
    const messages = convertKrdToFitHealthWeightMessages(krd, logger);

    // Assert
    expect(messages).toEqual([]);
  });
});
