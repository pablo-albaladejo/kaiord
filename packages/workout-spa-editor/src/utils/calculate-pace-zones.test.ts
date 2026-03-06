import { describe, expect, it } from "vitest";
import { calculatePaceZones } from "./calculate-pace-zones";

describe("calculatePaceZones", () => {
  it("should calculate 5 zones from threshold pace 300s (5:00/km)", () => {
    const zones = calculatePaceZones(300, "min_per_km");

    expect(zones).toHaveLength(5);
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
    const zones = calculatePaceZones(90, "min_per_100m");

    expect(zones[0]?.unit).toBe("min_per_100m");
    expect(zones[2]).toMatchObject({
      zone: 3,
      minPace: 90,
      maxPace: 97,
    });
  });

  it("should have Z1 as slowest and Z5 as fastest", () => {
    const zones = calculatePaceZones(300, "min_per_km");

    // Z1 maxPace (slowest) > Z5 maxPace (fastest)
    const z1 = zones[0];
    const z5 = zones[4];
    expect(z1?.maxPace).toBeGreaterThan(z5?.maxPace ?? 0);
  });

  it("should return zone names in correct order", () => {
    const zones = calculatePaceZones(300, "min_per_km");
    const names = zones.map((z) => z.name);

    expect(names).toEqual(["Easy", "Aerobic", "Tempo", "Threshold", "VO2 Max"]);
  });
});
