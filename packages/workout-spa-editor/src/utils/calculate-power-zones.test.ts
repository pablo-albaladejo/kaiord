import { describe, expect, it } from "vitest";
import { calculatePowerZones } from "./calculate-power-zones";

describe("calculatePowerZones", () => {
  it("should return 7 Coggan power zones", () => {
    const zones = calculatePowerZones();

    expect(zones).toHaveLength(7);
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
    const first = calculatePowerZones();
    const second = calculatePowerZones();

    expect(first).toEqual(second);
  });

  it("should return zone names matching Coggan model", () => {
    const zones = calculatePowerZones();
    const names = zones.map((z) => z.name);

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
