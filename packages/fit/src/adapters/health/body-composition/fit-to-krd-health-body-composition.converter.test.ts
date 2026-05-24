import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import type { FitMessages } from "../../shared/types";
import { convertFitToKrdHealthBodyComposition } from "./fit-to-krd-health-body-composition.converter";

const MEASURED_AT = "2026-05-22T07:15:00.000Z";
const BODY_FAT_PERCENT = 18.4;

describe("convertFitToKrdHealthBodyComposition", () => {
  it("should produce a body_composition KRD with bodyFatPercent populated", () => {
    // Arrange
    const messages: FitMessages = {
      fileIdMesgs: [{ timeCreated: new Date(MEASURED_AT) }],
      bodyCompositionMesgs: [
        {
          timestamp: new Date(MEASURED_AT),
          percentFat: BODY_FAT_PERCENT,
        },
      ],
    };
    const logger = createMockLogger();

    // Act
    const krd = convertFitToKrdHealthBodyComposition(messages, logger);

    // Assert
    expect(krd.type).toBe("body_composition");
    const body = (
      krd.extensions as {
        health?: { bodyComposition?: { bodyFatPercent?: number } };
      }
    )?.health?.bodyComposition;
    expect(body?.bodyFatPercent).toBe(BODY_FAT_PERCENT);
  });

  it("should produce a KRD with undefined extensions when no body_composition messages are present", () => {
    // Arrange
    const messages: FitMessages = {
      fileIdMesgs: [{ timeCreated: new Date(MEASURED_AT) }],
    };
    const logger = createMockLogger();

    // Act
    const krd = convertFitToKrdHealthBodyComposition(messages, logger);

    // Assert
    expect(krd.type).toBe("body_composition");
    expect(krd.extensions).toBeUndefined();
  });
});
