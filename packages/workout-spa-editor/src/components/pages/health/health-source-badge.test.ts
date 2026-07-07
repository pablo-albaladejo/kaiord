import { describe, expect, it } from "vitest";

import { healthSourceBadge } from "./health-source-badge";

describe("healthSourceBadge", () => {
  it.each([
    { sourceBridgeId: "manual", expected: "Manual" },
    { sourceBridgeId: "fit-import", expected: "FIT" },
    { sourceBridgeId: "garmin-bridge", expected: "Garmin" },
    { sourceBridgeId: "whoop-bridge", expected: "WHOOP" },
    { sourceBridgeId: "unknown", expected: "Unknown" },
  ])(
    "should map $sourceBridgeId to the label $expected",
    ({ sourceBridgeId, expected }) => {
      // Arrange

      // Act
      const result = healthSourceBadge(sourceBridgeId);

      // Assert
      expect(result).toBe(expected);
    }
  );

  it("should fall back to 'Unknown' when sourceBridgeId is undefined", () => {
    // Arrange

    // Act
    const result = healthSourceBadge(undefined);

    // Assert
    expect(result).toBe("Unknown");
  });

  it("should upper-case an unrecognized sourceBridgeId instead of hiding it", () => {
    // Arrange

    // Act
    const result = healthSourceBadge("some-new-bridge");

    // Assert
    expect(result).toBe("SOME-NEW-BRIDGE");
  });
});
