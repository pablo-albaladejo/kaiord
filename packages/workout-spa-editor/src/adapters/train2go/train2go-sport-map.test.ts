import { describe, expect, it } from "vitest";

import { getT2GSportDisplay } from "./train2go-sport-map";

const KNOWN_SPORTS = [
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

describe("getT2GSportDisplay", () => {
  it("should name a known sport by its neutral id, not by words", () => {
    // Arrange

    // Act
    const result = getT2GSportDisplay("cycling");

    // Assert
    expect(result).toEqual({ id: "cycling", icon: "\u{1F6B4}" });
  });

  it("should be case insensitive", () => {
    // Arrange
    const sports = ["SWIMMING", "Running"];

    // Act
    const ids = sports.map((sport) => getT2GSportDisplay(sport).id);

    // Assert
    expect(ids).toEqual(["swimming", "running"]);
  });

  it("should return the activity fallback for an unknown sport", () => {
    // Arrange

    // Act
    const result = getT2GSportDisplay("quidditch");

    // Assert
    expect(result.id).toBe("activity");
    expect(result.icon).toBeTruthy();
  });

  it("should return the activity fallback for an empty string", () => {
    // Arrange

    // Act
    const result = getT2GSportDisplay("");

    // Assert
    expect(result.id).toBe("activity");
  });

  it("should keep the id of all 24 known sports", () => {
    // Arrange

    // Act
    const ids = KNOWN_SPORTS.map((sport) => getT2GSportDisplay(sport).id);

    // Assert
    expect(ids).toEqual(KNOWN_SPORTS);
  });
});
