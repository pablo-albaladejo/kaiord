import { describe, expect, it } from "vitest";

import type { KRD } from "../types/krd";
import type { Profile } from "../types/profile";
import { garminPaceZonesFor } from "../utils/garmin-pace-zones";
import { athleteZoneTables } from "./athlete-zone-tables";

const PROFILE = {
  id: "athlete",
  sportZones: {
    running: {
      thresholds: { thresholdPace: 300, paceUnit: "min_per_km" },
      heartRateZones: { method: "custom", zones: [] },
    },
    cycling: {
      thresholds: { ftp: 250 },
      heartRateZones: { method: "custom", zones: [] },
      powerZones: {
        method: "coggan-7",
        zones: [
          { zone: 1, name: "Recovery", minPercent: 0, maxPercent: 55 },
          { zone: 2, name: "Endurance", minPercent: 56, maxPercent: 75 },
          { zone: 3, name: "Unset", minPercent: 0, maxPercent: 0 },
        ],
      },
    },
  },
} as unknown as Profile;

const runningKrdWithZone = (zone: number): KRD =>
  ({
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2026-10-17T00:00:00Z", sport: "running" },
    extensions: {
      structured_workout: {
        sport: "running",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 600 },
            targetType: "pace",
            target: { type: "pace", value: { unit: "zone", value: zone } },
          },
        ],
      },
    },
  }) as unknown as KRD;

describe("athleteZoneTables", () => {
  it("should use the same pace table the Garmin export resolves zones with", () => {
    // Arrange
    const krd = runningKrdWithZone(1);

    // Act
    const tables = athleteZoneTables(PROFILE, "running");

    // Assert
    expect(tables.pace).toEqual(garminPaceZonesFor(krd, PROFILE));
  });

  it("should turn power zones into watts from the FTP, skipping unset zones", () => {
    // Arrange

    // Act
    const tables = athleteZoneTables(PROFILE, "cycling");

    // Assert
    expect(tables.power).toEqual([
      { zone: 1, minWatts: 0, maxWatts: 138 },
      { zone: 2, minWatts: 140, maxWatts: 188 },
    ]);
  });

  it("should take pace from running and power from cycling when no sport is set", () => {
    // Arrange

    // Act
    const tables = athleteZoneTables(PROFILE, undefined);

    // Assert
    expect(tables.pace?.length).toBeGreaterThan(0);
    expect(tables.power?.length).toBeGreaterThan(0);
  });

  it("should return no tables without a profile", () => {
    // Arrange

    // Act
    const tables = athleteZoneTables(null, "running");

    // Assert
    expect(tables).toEqual({});
  });
});
