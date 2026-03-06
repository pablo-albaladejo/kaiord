import { describe, expect, it } from "vitest";
import { calculateHrZones } from "./calculate-hr-zones";

describe("calculateHrZones", () => {
  it("should calculate 5 zones from LTHR=170", () => {
    const zones = calculateHrZones(170);

    expect(zones).toHaveLength(5);
    expect(zones[0]).toEqual({
      zone: 1,
      name: "Recovery",
      minBpm: 0,
      maxBpm: 139,
    });
    expect(zones[1]).toEqual({
      zone: 2,
      name: "Aerobic",
      minBpm: 139,
      maxBpm: 151,
    });
    expect(zones[2]).toEqual({
      zone: 3,
      name: "Tempo",
      minBpm: 151,
      maxBpm: 160,
    });
    expect(zones[3]).toEqual({
      zone: 4,
      name: "Threshold",
      minBpm: 160,
      maxBpm: 170,
    });
    expect(zones[4]).toEqual({
      zone: 5,
      name: "VO2 Max",
      minBpm: 170,
      maxBpm: 180,
    });
  });

  it("should calculate zones from LTHR=180", () => {
    const zones = calculateHrZones(180);

    expect(zones[0]).toMatchObject({ minBpm: 0, maxBpm: 148 });
    expect(zones[3]).toMatchObject({ minBpm: 169, maxBpm: 180 });
  });

  it("should return zone names in correct order", () => {
    const zones = calculateHrZones(170);
    const names = zones.map((z) => z.name);

    expect(names).toEqual([
      "Recovery",
      "Aerobic",
      "Tempo",
      "Threshold",
      "VO2 Max",
    ]);
  });
});
