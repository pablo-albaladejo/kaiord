import { describe, expect, it } from "vitest";

import { getStepColor } from "./step-colors";

const ZONE_1 = "var(--zone-1)";
const ZONE_2 = "var(--zone-2)";
const ZONE_3 = "var(--zone-3)";
const ZONE_4 = "var(--zone-4)";
const REPEAT = 4;

describe("getStepColor", () => {
  it("should return the mid zone for a non-object input", () => {
    // Arrange
    const step = null;

    // Act
    const color = getStepColor(step);

    // Assert
    expect(color).toBe(ZONE_3);
  });

  it("should return the mid zone for a repetition block", () => {
    // Arrange
    const step = { repeatCount: REPEAT };

    // Act
    const color = getStepColor(step);

    // Assert
    expect(color).toBe(ZONE_3);
  });

  it("should return zone 2 for a warmup step", () => {
    // Arrange
    const step = { intensity: "warmup" };

    // Act
    const color = getStepColor(step);

    // Assert
    expect(color).toBe(ZONE_2);
  });

  it("should return zone 1 for cooldown, rest and recovery steps", () => {
    // Arrange
    const steps = [
      { intensity: "cooldown" },
      { intensity: "rest" },
      { intensity: "recovery" },
    ];

    // Act
    const colors = steps.map(getStepColor);

    // Assert
    expect(colors).toEqual([ZONE_1, ZONE_1, ZONE_1]);
  });

  it("should return zone 4 for an interval step", () => {
    // Arrange
    const step = { intensity: "interval", targetType: "heart_rate" };

    // Act
    const color = getStepColor(step);

    // Assert
    expect(color).toBe(ZONE_4);
  });

  it("should ignore the target type when picking the zone", () => {
    // Arrange
    const power = { intensity: "active", targetType: "power" };
    const heartRate = { intensity: "active", targetType: "heart_rate" };

    // Act
    const powerColor = getStepColor(power);
    const heartRateColor = getStepColor(heartRate);

    // Assert
    expect(powerColor).toBe(heartRateColor);
  });

  it("should return the mid zone for an unknown intensity", () => {
    // Arrange
    const step = { intensity: "something-else" };

    // Act
    const color = getStepColor(step);

    // Assert
    expect(color).toBe(ZONE_3);
  });
});
