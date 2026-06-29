import { describe, expect, it } from "vitest";

import { calculateHrZones } from "./calculate-hr-zones";

const LTHR_170 = 170;
const LTHR_180 = 180;
const EXPECTED_ZONE_COUNT = 5;

describe("calculateHrZones", () => {
  it("should calculate 5 zones from LTHR=170", () => {
    // Arrange

    // Act

    const zones = calculateHrZones(LTHR_170);

    // Assert

    expect(zones).toHaveLength(EXPECTED_ZONE_COUNT);
    expect(zones[0]).toEqual({
      zone: 1,
      name: "Recovery",
      minBpm: 0,
      maxBpm: 139,
    });
    expect(zones[1]).toEqual({
      zone: 2,
      name: "Aerobic",
      minBpm: 140,
      maxBpm: 151,
    });
    expect(zones[2]).toEqual({
      zone: 3,
      name: "Tempo",
      minBpm: 152,
      maxBpm: 160,
    });
    expect(zones[3]).toEqual({
      zone: 4,
      name: "Threshold",
      minBpm: 161,
      maxBpm: 170,
    });
    expect(zones[4]).toEqual({
      zone: 5,
      name: "VO2 Max",
      minBpm: 171,
      maxBpm: 180,
    });
  });

  it("should calculate zones from LTHR=180", () => {
    // Arrange

    // Act

    const zones = calculateHrZones(LTHR_180);

    // Assert

    expect(zones[0]).toMatchObject({ minBpm: 0, maxBpm: 148 });
    expect(zones[3]).toMatchObject({ minBpm: 170, maxBpm: 180 });
  });
});
