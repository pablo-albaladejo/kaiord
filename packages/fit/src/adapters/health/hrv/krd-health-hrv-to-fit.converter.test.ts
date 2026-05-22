import type { KRD } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";
import { convertKrdToFitHealthHrvMessages } from "./krd-health-hrv-to-fit.converter";

const MEASURED_AT = "2026-05-22T07:00:00.000Z";
const OVERNIGHT_RMSSD = 48;

const buildHrvKrd = (): KRD => ({
  version: "2.0",
  type: "hrv_summary",
  metadata: { created: MEASURED_AT },
  extensions: {
    health: {
      hrv: {
        kind: "hrv",
        version: "2.0",
        measuredAt: MEASURED_AT,
        rMSSD: OVERNIGHT_RMSSD,
        measurementWindow: "overnight",
      },
    },
  },
});

describe("convertKrdToFitHealthHrvMessages", () => {
  it("should emit file_id followed by a single hrv_status_summary message", () => {
    // Arrange
    const krd = buildHrvKrd();
    const logger = createMockLogger();

    // Act
    const messages = convertKrdToFitHealthHrvMessages(krd, logger);

    // Assert
    expect(messages).toHaveLength(2);
    expect(messages[0].mesgNum).toBe(FIT_MESSAGE_NUMBERS.FILE_ID);
    expect(messages[1].mesgNum).toBe(FIT_MESSAGE_NUMBERS.HRV_STATUS_SUMMARY);
    expect(messages[1].lastNightAverage).toBe(OVERNIGHT_RMSSD);
  });

  it("should emit no messages when extensions.health.hrv is absent", () => {
    // Arrange
    const krd: KRD = {
      version: "2.0",
      type: "hrv_summary",
      metadata: { created: MEASURED_AT },
    };
    const logger = createMockLogger();

    // Act
    const messages = convertKrdToFitHealthHrvMessages(krd, logger);

    // Assert
    expect(messages).toEqual([]);
  });
});
