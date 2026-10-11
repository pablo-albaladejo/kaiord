import { describe, expect, it } from "vitest";

import { toManualHealthInput } from "./log-health-metric-input";

describe("toManualHealthInput", () => {
  it("should read a sleep value as hours slept", () => {
    // Arrange
    const input = { metric: "sleep" as const, day: "2026-10-10", value: 7.5 };

    // Act
    const result = toManualHealthInput(input);

    // Assert
    expect(result).toEqual({
      metric: "sleep",
      day: "2026-10-10",
      sleep: { durationSeconds: 27000 },
    });
  });

  it("should pass other metrics through as their value", () => {
    // Arrange
    const input = { metric: "weight" as const, day: "2026-10-10", value: 72 };

    // Act
    const result = toManualHealthInput(input);

    // Assert
    expect(result).toEqual(input);
  });
});
