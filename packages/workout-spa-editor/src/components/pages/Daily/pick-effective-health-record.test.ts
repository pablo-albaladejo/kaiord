import { describe, expect, it } from "vitest";

import { pickEffectiveHealthRecord } from "./pick-effective-health-record";

describe("pickEffectiveHealthRecord", () => {
  it("should return an empty pick when the resolver result is undefined (still loading)", () => {
    // Arrange

    // Act
    const pick = pickEffectiveHealthRecord(undefined);

    // Assert
    expect(pick).toEqual({
      record: undefined,
      sourceBridgeId: undefined,
      usedFallback: false,
    });
  });

  it("should surface the priority mode's winning record and fallback flag", () => {
    // Arrange
    const result = {
      mode: "priority" as const,
      effective: { sourceBridgeId: "garmin-bridge", record: { rMSSD: 45 } },
      usedFallback: true,
    };

    // Act
    const pick = pickEffectiveHealthRecord(result);

    // Assert
    expect(pick).toEqual({
      record: { rMSSD: 45 },
      sourceBridgeId: "garmin-bridge",
      usedFallback: true,
    });
  });

  it("should return an empty pick for priority mode with no effective record", () => {
    // Arrange
    const result = {
      mode: "priority" as const,
      effective: undefined,
      usedFallback: false as const,
    };

    // Act
    const pick = pickEffectiveHealthRecord(result);

    // Assert
    expect(pick).toEqual({
      record: undefined,
      sourceBridgeId: undefined,
      usedFallback: false,
    });
  });

  it("should take the most recent record in union mode, never marked as fallback", () => {
    // Arrange
    const result = {
      mode: "union" as const,
      records: [
        { sourceBridgeId: "manual", record: { rMSSD: 40 } },
        { sourceBridgeId: "whoop-bridge", record: { rMSSD: 45 } },
      ],
    };

    // Act
    const pick = pickEffectiveHealthRecord(result);

    // Assert
    expect(pick).toEqual({
      record: { rMSSD: 45 },
      sourceBridgeId: "whoop-bridge",
      usedFallback: false,
    });
  });
});
