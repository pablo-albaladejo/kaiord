import { describe, expect, it } from "vitest";

import { getT2GSportDisplay } from "./train2go-sport-map";

describe("getT2GSportDisplay", () => {
  it("should map known sport", () => {
    // Arrange

    // Act
    const result = getT2GSportDisplay("cycling");

    // Assert
    expect(result.label).toBe("Cycling");
    expect(result.icon).toBeTruthy();
  });

  it("should be case insensitive", () => {
    // Arrange

    // Act

    // Assert
    expect(getT2GSportDisplay("SWIMMING").label).toBe("Swimming");
    expect(getT2GSportDisplay("Running").label).toBe("Running");
  });

  it("should return fallback for unknown sport", () => {
    // Arrange

    // Act
    const result = getT2GSportDisplay("quidditch");

    // Assert
    expect(result.label).toBe("Activity");
    expect(result.icon).toBeTruthy();
  });

  it("should return fallback for empty string", () => {
    // Arrange

    // Act
    const result = getT2GSportDisplay("");

    // Assert
    expect(result.label).toBe("Activity");
  });

  it("should map all 24 known sports without throwing", () => {
    // Arrange

    // Act
    const sports = [
      "cycling",
      "running",
      "swimming",
      "gym",
      "stretching",
      "yoga",
      "pilates",
      "rest",
      "walk",
      "mountainwalk",
      "trail",
      "mountainbike",
      "stationarybike",
      "rowing",
      "indoorrowing",
      "climbing",
      "ski",
      "mountainski",
      "sprint",
      "tennis",
      "cardio",
      "canicross",
      "canibike",
      "dog",
    ];

    // Assert
    for (const sport of sports) {
      const result = getT2GSportDisplay(sport);
      expect(result.label).not.toBe("Activity");
    }
  });
});
