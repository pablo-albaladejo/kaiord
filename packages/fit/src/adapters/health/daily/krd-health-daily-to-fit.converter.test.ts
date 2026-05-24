import type { KRD } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";
import { convertKrdToFitHealthDailyMessages } from "./krd-health-daily-to-fit.converter";

const DAILY_DATE = "2026-05-22";
const TOTAL_STEPS = 9432;
const ACTIVE_KCAL = 412;
const RESTING_KCAL = 1684;
const EXPECTED_MESG_COUNT = 3;

const buildDailyKrd = (): KRD => ({
  version: "2.0",
  type: "daily_wellness",
  metadata: { created: `${DAILY_DATE}T07:00:00.000Z` },
  extensions: {
    health: {
      daily: {
        kind: "daily",
        version: "2.0",
        date: DAILY_DATE,
        steps: TOTAL_STEPS,
        activeCalories: ACTIVE_KCAL,
        restingCalories: RESTING_KCAL,
        intensityMinutes: { moderate: 23, vigorous: 8 },
      },
    },
  },
});

describe("convertKrdToFitHealthDailyMessages", () => {
  it("should emit file_id + monitoring_info + a single summary monitoring message", () => {
    // Arrange
    const krd = buildDailyKrd();
    const logger = createMockLogger();

    // Act
    const messages = convertKrdToFitHealthDailyMessages(krd, logger);

    // Assert
    expect(messages).toHaveLength(EXPECTED_MESG_COUNT);
    expect(messages[0].mesgNum).toBe(FIT_MESSAGE_NUMBERS.FILE_ID);
    expect(messages[1].mesgNum).toBe(FIT_MESSAGE_NUMBERS.MONITORING_INFO);
    expect(messages[2].mesgNum).toBe(FIT_MESSAGE_NUMBERS.MONITORING);
    expect(messages[2].steps).toBe(TOTAL_STEPS);
    expect(messages[2].activeCalories).toBe(ACTIVE_KCAL);
  });

  it("should emit no messages when extensions.health.daily is absent", () => {
    // Arrange
    const krd: KRD = {
      version: "2.0",
      type: "daily_wellness",
      metadata: { created: `${DAILY_DATE}T07:00:00.000Z` },
    };
    const logger = createMockLogger();

    // Act
    const messages = convertKrdToFitHealthDailyMessages(krd, logger);

    // Assert
    expect(messages).toEqual([]);
  });
});
