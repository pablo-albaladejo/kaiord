import { describe, expect, it } from "vitest";

import { dominantZone, hardestZone } from "./zone-emphasis";

/* Fixtures use whole weights from the lint-ignored numeric set: both helpers
   only compare fractions against each other and against zero, so the scale is
   irrelevant and normalising them would add magic numbers for nothing. */
const ZONE_2 = 2;
const ZONE_4 = 4;
const ZONE_5 = 5;
const MOST = 100;
const SOME = 2;
const LITTLE = 1;

describe("dominantZone", () => {
  it("should return the zone holding the largest fraction", () => {
    // Arrange
    const dist = [LITTLE, SOME, 0, MOST, LITTLE];

    // Act
    const zone = dominantZone(dist);

    // Assert
    expect(zone).toBe(ZONE_4);
  });

  it("should resolve a tie to the lower zone", () => {
    // Arrange
    const dist = [0, MOST, 0, MOST, 0];

    // Act
    const zone = dominantZone(dist);

    // Assert
    expect(zone).toBe(ZONE_2);
  });

  it("should return null for an all-zero distribution", () => {
    // Arrange
    const dist = [0, 0, 0, 0, 0];

    // Act
    const zone = dominantZone(dist);

    // Assert
    expect(zone).toBeNull();
  });
});

describe("hardestZone", () => {
  it("should return the highest zone with any classified time", () => {
    // Arrange
    const dist = [SOME, MOST, 0, LITTLE, 0];

    // Act
    const zone = hardestZone(dist);

    // Assert
    expect(zone).toBe(ZONE_4);
  });

  it("should differ from the dominant zone when a small block is harder", () => {
    // Arrange
    const dist = [0, MOST, 0, 0, LITTLE];

    // Act
    const hardest = hardestZone(dist);
    const dominant = dominantZone(dist);

    // Assert
    expect(hardest).toBe(ZONE_5);
    expect(dominant).toBe(ZONE_2);
  });

  it("should return null for an all-zero distribution", () => {
    // Arrange
    const dist = [0, 0, 0, 0, 0];

    // Act
    const zone = hardestZone(dist);

    // Assert
    expect(zone).toBeNull();
  });
});
