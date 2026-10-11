import { describe, expect, it } from "vitest";

import { DEFAULT_HEART_RATE_ZONES } from "../../../types/profile-defaults";
import type { SportZoneConfig } from "../../../types/sport-zones";
import { calculateHrZones } from "../../../utils/calculate-hr-zones";
import { recalculateZones } from "./sport-zone-updater";

const LTHR = 170;
const PACE = 270;

const running = (
  overrides: Partial<SportZoneConfig> = {}
): SportZoneConfig => ({
  thresholds: {},
  heartRateZones: { method: "custom", zones: DEFAULT_HEART_RATE_ZONES },
  powerZones: { method: "custom", zones: [] },
  paceZones: { method: "custom", zones: [] },
  ...overrides,
});

describe("recalculateZones", () => {
  it("should apply the default model to a heart-rate table nobody filled in", () => {
    // Arrange
    const config = running();

    // Act
    const next = recalculateZones(config, { lthr: LTHR }, "running");

    // Assert
    expect(next.heartRateZones).toEqual({
      method: "karvonen-5",
      zones: calculateHrZones(LTHR, "karvonen-5"),
    });
  });

  it("should leave an empty pace table empty, as no preset draws the page's map", () => {
    // Arrange
    const config = running();

    // Act
    const next = recalculateZones(
      config,
      { thresholdPace: PACE, paceUnit: "min_per_km" },
      "running"
    );

    // Assert
    expect(next.paceZones).toEqual({ method: "custom", zones: [] });
  });

  it("should keep zones the athlete typed when a threshold moves", () => {
    // Arrange
    const own = [{ zone: 1, name: "Mine", minBpm: 100, maxBpm: 140 }];
    const config = running({ heartRateZones: { method: "user", zones: own } });

    // Act
    const next = recalculateZones(config, { lthr: LTHR }, "running");

    // Assert
    expect(next.heartRateZones).toEqual({ method: "user", zones: own });
  });

  it("should keep a filled-in custom table as it is", () => {
    // Arrange
    const own = [{ zone: 1, name: "Mine", minBpm: 100, maxBpm: 140 }];
    const config = running({
      heartRateZones: { method: "custom", zones: own },
    });

    // Act
    const next = recalculateZones(config, { lthr: LTHR }, "running");

    // Assert
    expect(next.heartRateZones.zones).toBe(own);
  });
});
