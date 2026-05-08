import { describe, expect, it } from "vitest";

import { calculatePowerZones } from "./calculate-power-zones";

const COGGAN_ZONE_COUNT = 7;

describe("calculatePowerZones", () => {
  it("should return 7 Coggan power zones", () => {
    // Arrange

    // Act

    const zones = calculatePowerZones();

    // Assert

    expect(zones).toHaveLength(COGGAN_ZONE_COUNT);
    expect(zones[0]).toEqual({
      zone: 1,
      name: "Active Recovery",
      minPercent: 0,
      maxPercent: 55,
    });
    expect(zones[3]).toEqual({
      zone: 4,
      name: "Lactate Threshold",
      minPercent: 91,
      maxPercent: 105,
    });
    expect(zones[6]).toEqual({
      zone: 7,
      name: "Neuromuscular Power",
      minPercent: 151,
      maxPercent: 200,
    });
  });

  it("should return consistent results on multiple calls", () => {
    // Arrange

    const first = calculatePowerZones();

    // Act

    const second = calculatePowerZones();

    // Assert

    expect(first).toEqual(second);
  });

  it("should return zone names matching Coggan model", () => {
    // Arrange

    const zones = calculatePowerZones();

    // Act

    const names = zones.map((z) => z.name);

    // Assert

    expect(names).toEqual([
      "Active Recovery",
      "Endurance",
      "Tempo",
      "Lactate Threshold",
      "VO2 Max",
      "Anaerobic Capacity",
      "Neuromuscular Power",
    ]);
  });
});
