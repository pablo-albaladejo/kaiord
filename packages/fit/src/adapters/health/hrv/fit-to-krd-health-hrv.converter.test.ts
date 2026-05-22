import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import type { FitMessages } from "../../shared/types";
import { convertFitToKrdHealthHrv } from "./fit-to-krd-health-hrv.converter";

const MEASURED_AT = "2026-05-22T07:00:00.000Z";
const OVERNIGHT_RMSSD = 48;

describe("convertFitToKrdHealthHrv", () => {
  it("should produce a hrv_summary KRD when only a status_summary is present", () => {
    // Arrange
    const messages: FitMessages = {
      fileIdMesgs: [{ timeCreated: new Date(MEASURED_AT) }],
      hrvStatusSummaryMesgs: [
        {
          timestamp: new Date(MEASURED_AT),
          lastNightAverage: OVERNIGHT_RMSSD,
          status: "balanced",
        },
      ],
    };
    const logger = createMockLogger();

    // Act
    const krd = convertFitToKrdHealthHrv(messages, logger);

    // Assert
    expect(krd.type).toBe("hrv_summary");
    const hrv = (krd.extensions as { health?: { hrv?: { rMSSD?: number } } })
      ?.health?.hrv;
    expect(hrv?.rMSSD).toBe(OVERNIGHT_RMSSD);
  });

  it("should produce a KRD with undefined extensions when no HRV messages are present", () => {
    // Arrange
    const messages: FitMessages = {
      fileIdMesgs: [{ timeCreated: new Date(MEASURED_AT) }],
    };
    const logger = createMockLogger();

    // Act
    const krd = convertFitToKrdHealthHrv(messages, logger);

    // Assert
    expect(krd.type).toBe("hrv_summary");
    expect(krd.extensions).toBeUndefined();
  });
});
