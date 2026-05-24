import type { KRD } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";
import { convertKrdToFitHealthBodyCompositionMessages } from "./krd-health-body-composition-to-fit.converter";

const MEASURED_AT = "2026-05-22T07:15:00.000Z";
const BODY_FAT_PERCENT = 18.4;

const buildBodyKrd = (): KRD => ({
  version: "2.0",
  type: "body_composition",
  metadata: { created: MEASURED_AT },
  extensions: {
    health: {
      bodyComposition: {
        kind: "bodyComposition",
        version: "2.0",
        measuredAt: MEASURED_AT,
        bodyFatPercent: BODY_FAT_PERCENT,
      },
    },
  },
});

describe("convertKrdToFitHealthBodyCompositionMessages", () => {
  it("should emit file_id followed by a single body_composition message", () => {
    // Arrange
    const krd = buildBodyKrd();
    const logger = createMockLogger();

    // Act
    const messages = convertKrdToFitHealthBodyCompositionMessages(krd, logger);

    // Assert
    expect(messages).toHaveLength(2);
    expect(messages[0].mesgNum).toBe(FIT_MESSAGE_NUMBERS.FILE_ID);
    expect(messages[1].mesgNum).toBe(FIT_MESSAGE_NUMBERS.BODY_COMPOSITION);
    expect(messages[1].percentFat).toBe(BODY_FAT_PERCENT);
  });

  it("should emit no messages when extensions.health.bodyComposition is absent", () => {
    // Arrange
    const krd: KRD = {
      version: "2.0",
      type: "body_composition",
      metadata: { created: MEASURED_AT },
    };
    const logger = createMockLogger();

    // Act
    const messages = convertKrdToFitHealthBodyCompositionMessages(krd, logger);

    // Assert
    expect(messages).toEqual([]);
  });
});
