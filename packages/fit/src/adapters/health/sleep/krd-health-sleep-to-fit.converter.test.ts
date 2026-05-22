import type { KRD } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";
import { convertKrdToFitHealthSleepMessages } from "./krd-health-sleep-to-fit.converter";

const buildSleepKrd = (): KRD => ({
  version: "2.0",
  type: "sleep_record",
  metadata: { created: "2026-05-22T07:00:00.000Z" },
  extensions: {
    health: {
      sleep: {
        kind: "sleep",
        version: "2.0",
        startTime: "2026-05-21T23:00:00.000Z",
        endTime: "2026-05-22T07:00:00.000Z",
        totalDurationSeconds: 28800,
        stages: [
          {
            stage: "light",
            startTime: "2026-05-21T23:00:00.000Z",
            durationSeconds: 28800,
          },
        ],
      },
    },
  },
});

describe("convertKrdToFitHealthSleepMessages", () => {
  it("should emit file_id followed by sleep_level transitions", () => {
    // Arrange
    const krd = buildSleepKrd();
    const logger = createMockLogger();

    // Act
    const messages = convertKrdToFitHealthSleepMessages(krd, logger);

    // Assert
    expect(messages[0].mesgNum).toBe(FIT_MESSAGE_NUMBERS.FILE_ID);
    const transitions = messages.filter(
      (m) => m.mesgNum === FIT_MESSAGE_NUMBERS.SLEEP_LEVEL
    );
    expect(transitions.length).toBeGreaterThan(0);
  });

  it("should emit no messages when extensions.health.sleep is absent", () => {
    // Arrange
    const krd: KRD = {
      version: "2.0",
      type: "sleep_record",
      metadata: { created: "2026-05-22T07:00:00.000Z" },
    };
    const logger = createMockLogger();

    // Act
    const messages = convertKrdToFitHealthSleepMessages(krd, logger);

    // Assert
    expect(messages).toEqual([]);
  });
});
