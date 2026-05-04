/**
 * Zone Value Calculator Tests
 */

import { describe, expect, it } from "vitest";

import { findMethod, HR_METHODS, POWER_METHODS } from "../lib/zone-methods";
import { calculateHrZones } from "./calculate-hr-zones";
import { calculatePaceZones } from "./calculate-pace-zones";
import { calculatePowerZoneValues } from "./calculate-power-zones";
import { calculateZoneValues } from "./calculate-zone-values";

describe("calculateZoneValues", () => {
  it("should calculate Coggan zones with FTP=250", () => {
    // Arrange

    const method = findMethod(POWER_METHODS, "coggan-7")!;

    // Act

    const zones = calculateZoneValues(method, 250);

    // Assert

    expect(zones).toHaveLength(7);
    expect(zones[0]).toEqual({
      zone: 1,
      name: "Active Recovery",
      min: 0,
      max: 138,
    });
    expect(zones[1]).toEqual({
      zone: 2,
      name: "Endurance",
      min: 139,
      max: 188,
    });
    expect(zones[2]).toEqual({ zone: 3, name: "Tempo", min: 189, max: 225 });
  });

  it("should calculate Karvonen HR zones with LTHR=170", () => {
    // Arrange

    const method = findMethod(HR_METHODS, "karvonen-5")!;

    // Act

    const zones = calculateZoneValues(method, 170);

    // Assert

    expect(zones).toHaveLength(5);
    expect(zones[0]).toEqual({ zone: 1, name: "Recovery", min: 0, max: 139 });
    expect(zones[1].min).toBe(140);
  });
});

describe("calculatePowerZoneValues", () => {
  it("should return watt values for Coggan with FTP=250", () => {
    // Arrange

    // Act

    const zones = calculatePowerZoneValues(250, "coggan-7");

    // Assert

    expect(zones).toHaveLength(7);
    expect(zones[0].minWatts).toBe(0);
    expect(zones[0].maxWatts).toBe(138);
    expect(zones[1].minWatts).toBe(139);
    expect(zones[2].name).toBe("Tempo");
    expect(zones[2].minWatts).toBe(189);
    expect(zones[2].maxWatts).toBe(225);
  });

  it("should return watt values for British Cycling 6-zone", () => {
    // Arrange

    // Act

    const zones = calculatePowerZoneValues(300, "british-cycling-6");

    // Assert

    expect(zones).toHaveLength(6);
    expect(zones[0].name).toBe("Active Recovery");
    expect(zones[0].maxWatts).toBe(180);
  });

  it("should return watt values for Friel 7-zone", () => {
    // Arrange

    // Act

    const zones = calculatePowerZoneValues(250, "friel-7");

    // Assert

    expect(zones).toHaveLength(7);
    expect(zones[0].name).toBe("Active Recovery");
  });
});

describe("calculateHrZones", () => {
  it("should calculate Karvonen zones with LTHR=170", () => {
    // Arrange

    // Act

    const zones = calculateHrZones(170, "karvonen-5");

    // Assert

    expect(zones).toHaveLength(5);
    expect(zones[0].maxBpm).toBe(139);
    expect(zones[1].minBpm).toBe(140);
  });

  it("should calculate Friel HR zones", () => {
    // Arrange

    // Act

    const zones = calculateHrZones(170, "friel-hr-5");

    // Assert

    expect(zones).toHaveLength(5);
    expect(zones[0].name).toBe("Recovery");
    expect(zones[0].maxBpm).toBe(138);
  });

  it("should default to karvonen-5 with no method specified", () => {
    // Arrange

    // Act

    const zones = calculateHrZones(170);

    // Assert

    expect(zones).toHaveLength(5);
    expect(zones[0].name).toBe("Recovery");
  });
});

describe("calculatePaceZones", () => {
  it("should calculate Daniels zones with threshold 300s", () => {
    // Arrange

    // Act

    const zones = calculatePaceZones(300, "min_per_km", "daniels-5");

    // Assert

    expect(zones).toHaveLength(5);
    expect(zones[0].name).toBe("Easy");
    expect(zones[0].unit).toBe("min_per_km");
  });

  it("should default to daniels-5", () => {
    // Arrange

    // Act

    const zones = calculatePaceZones(300, "min_per_km");

    // Assert

    expect(zones).toHaveLength(5);
  });
});
