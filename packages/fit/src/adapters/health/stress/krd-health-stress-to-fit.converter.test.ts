import type { KRD } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { convertKrdToFitHealthStressMessages } from "./krd-health-stress-to-fit.converter";

const buildKrd = (): KRD => ({
  version: "2.0",
  type: "stress_episode",
  metadata: {
    created: "2026-05-23T07:00:00.000Z",
    manufacturer: "garmin",
    product: "3196",
  },
  extensions: {
    health: {
      stress: {
        kind: "stress",
        version: "2.0",
        startTime: "2026-05-23T08:00:00.000Z",
        endTime: "2026-05-23T10:00:00.000Z",
        averageLevel: 30,
        peakLevel: 70,
      },
    },
  },
});

describe("convertKrdToFitHealthStressMessages", () => {
  it("should emit a file_id followed by two stress_level samples", () => {
    // Arrange
    const krd = buildKrd();
    const logger = createMockLogger();
    const EXPECTED_MESG_COUNT = 3;

    // Act
    const messages = convertKrdToFitHealthStressMessages(krd, logger);

    // Assert
    expect(messages).toHaveLength(EXPECTED_MESG_COUNT);
    expect(messages[0]).toMatchObject({ mesgNum: 0, type: "monitoringB" });
    expect(messages[1]).toMatchObject({
      mesgNum: 227,
      stressLevelValue: 30,
    });
    expect(messages[2]).toMatchObject({
      mesgNum: 227,
      stressLevelValue: 70,
    });
  });

  it("should return an empty list when the KRD has no stress payload", () => {
    // Arrange
    const krd: KRD = {
      version: "2.0",
      type: "stress_episode",
      metadata: { created: "2026-05-23T07:00:00.000Z" },
    };
    const logger = createMockLogger();

    // Act
    const messages = convertKrdToFitHealthStressMessages(krd, logger);

    // Assert
    expect(messages).toEqual([]);
  });
});
