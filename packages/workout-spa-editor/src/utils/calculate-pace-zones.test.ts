import { describe, expect, it } from "vitest";

import { calculatePaceZones } from "./calculate-pace-zones";

const THRESHOLD_PACE_SEC_300 = 300;
const SWIM_THRESHOLD_PACE_SEC_90 = 90;
const ZONE_COUNT_5 = 5;

describe("calculatePaceZones", () => {
  it("should calculate 5 zones from threshold pace 300s (5:00/km)", () => {
    // Arrange

    // Act

    const zones = calculatePaceZones(THRESHOLD_PACE_SEC_300, "min_per_km");

    // Assert

    expect(zones).toHaveLength(ZONE_COUNT_5);
    // Z1 (easy) = slowest: 115-200% of threshold
    expect(zones[0]).toEqual({
      zone: 1,
      name: "Easy",
      minPace: 345,
      maxPace: 600,
      unit: "min_per_km",
    });
    // Z3 (tempo) = around threshold: 100-108%
    expect(zones[2]).toEqual({
      zone: 3,
      name: "Tempo",
      minPace: 300,
      maxPace: 324,
      unit: "min_per_km",
    });
    // Z5 (VO2max) = fastest: 0-93%
    expect(zones[4]).toEqual({
      zone: 5,
      name: "VO2 Max",
      minPace: 0,
      maxPace: 279,
      unit: "min_per_km",
    });
  });

  it("should calculate zones for swimming (min/100m)", () => {
    // Arrange

    // Act

    const zones = calculatePaceZones(
      SWIM_THRESHOLD_PACE_SEC_90,
      "min_per_100m"
    );

    // Assert

    expect(zones[0]?.unit).toBe("min_per_100m");
    expect(zones[2]).toMatchObject({
      zone: 3,
      minPace: 90,
      maxPace: 97,
    });
  });

  it("should return zone names in correct order", () => {
    // Arrange

    const zones = calculatePaceZones(THRESHOLD_PACE_SEC_300, "min_per_km");

    // Act

    const names = zones.map((z) => z.name);

    // Assert

    expect(names).toEqual(["Easy", "Aerobic", "Tempo", "Threshold", "VO2 Max"]);
  });
});
