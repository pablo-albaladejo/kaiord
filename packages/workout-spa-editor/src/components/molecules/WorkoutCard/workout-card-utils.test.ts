import { describe, expect, it } from "vitest";

import { formatDuration, getStateIndicator } from "./workout-card-utils";

describe("getStateIndicator", () => {
  it("should return orange indicator for stale", () => {
    // Arrange

    // Act

    const result = getStateIndicator("stale");

    // Assert

    expect(result.label).toBe("Stale");
    expect(result.className).toContain("orange");
  });

  it("should return check for pushed", () => {
    // Arrange

    // Act

    const result = getStateIndicator("pushed");

    // Assert

    expect(result.symbol).toBe("\u2713");
  });

  it("should return star for ready", () => {
    // Arrange

    // Act

    const result = getStateIndicator("ready");

    // Assert

    expect(result.symbol).toBe("\u2605");
  });

  it("should return warning for raw", () => {
    // Arrange

    // Act

    const result = getStateIndicator("raw");

    // Assert

    expect(result.symbol).toBe("\u26A0\uFE0F");
  });
});

describe("formatDuration", () => {
  it("should format minutes only", () => {
    // Arrange

    // Act

    // Assert
    expect(formatDuration(1800)).toBe("30m");
  });

  it("should format hours and minutes", () => {
    // Arrange

    // Act

    // Assert
    expect(formatDuration(5400)).toBe("1h 30m");
  });

  it("should format zero minutes", () => {
    // Arrange

    // Act

    // Assert
    expect(formatDuration(0)).toBe("0m");
  });
});
