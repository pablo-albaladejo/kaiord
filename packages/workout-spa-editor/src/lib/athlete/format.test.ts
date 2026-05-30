import { describe, expect, it } from "vitest";

import { formatPace, paceUnitLabel } from "./format";

const CYCLING_THRESHOLD_PACE = 245;
const SWIM_CSS_PACE = 98;

describe("formatPace", () => {
  it("should format seconds as minutes and zero-padded seconds", () => {
    // Arrange
    const seconds = CYCLING_THRESHOLD_PACE;

    // Act
    const result = formatPace(seconds);

    // Assert
    expect(result).toBe("4:05");
  });

  it("should zero-pad a single-digit seconds remainder", () => {
    // Arrange
    const seconds = SWIM_CSS_PACE;

    // Act
    const result = formatPace(seconds);

    // Assert
    expect(result).toBe("1:38");
  });
});

describe("paceUnitLabel", () => {
  it("should label per-kilometre pace", () => {
    // Arrange

    // Act
    const label = paceUnitLabel("min_per_km");

    // Assert
    expect(label).toBe("/km");
  });

  it("should label per-100m pace", () => {
    // Arrange

    // Act
    const label = paceUnitLabel("min_per_100m");

    // Assert
    expect(label).toBe("/100m");
  });
});
