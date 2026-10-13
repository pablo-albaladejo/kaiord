import { describe, expect, it } from "vitest";

import { formatThreshold, parseThreshold } from "./threshold-field-values";

const FOUR_THIRTY = 270;

describe("parseThreshold", () => {
  it("should read a pace typed as m:ss into seconds per base unit", () => {
    // Arrange
    const raw = "4:30";

    // Act
    const seconds = parseThreshold(
      "thresholdPace",
      raw,
      "min_per_km",
      "metric"
    );

    // Assert
    expect(seconds).toBe(FOUR_THIRTY);
  });

  it("should read an imperial pace per mile back into seconds per km", () => {
    // Arrange — 7:15/mi is 435 s per 1.609344 km.
    const raw = "7:15";

    // Act
    const seconds = parseThreshold(
      "thresholdPace",
      raw,
      "min_per_km",
      "imperial"
    );

    // Assert
    expect(seconds).toBe(FOUR_THIRTY);
  });

  it("should treat an empty field as cleared", () => {
    // Arrange
    // Act
    const value = parseThreshold("ftp", "  ", "min_per_km", "metric");

    // Assert
    expect(value).toBeUndefined();
  });

  it.each([
    ["thresholdPace", "4.30"],
    ["thresholdPace", "4:75"],
    ["ftp", "0"],
    ["ftp", "250.5"],
    ["lthr", "251"],
    ["maxHeartRate", "-1"],
  ] as const)("should reject %s typed as %s", (id, raw) => {
    // Arrange
    // Act
    const value = parseThreshold(id, raw, "min_per_km", "metric");

    // Assert
    expect(value).toBeNull();
  });
});

describe("formatThreshold", () => {
  it("should show a stored pace as m:ss in the active units", () => {
    // Arrange
    // Act
    const metric = formatThreshold(
      "thresholdPace",
      FOUR_THIRTY,
      "min_per_km",
      "metric"
    );
    const imperial = formatThreshold(
      "thresholdPace",
      FOUR_THIRTY,
      "min_per_km",
      "imperial"
    );

    // Assert
    expect(metric).toBe("4:30");
    expect(imperial).toBe("7:15");
  });

  it("should show an unset value as an empty field", () => {
    // Arrange
    // Act
    const text = formatThreshold("lthr", undefined, "min_per_km", "metric");

    // Assert
    expect(text).toBe("");
  });
});
