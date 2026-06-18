import { describe, expect, it } from "vitest";

import { deriveZoneMap } from "./derive-zone-map";
import { profileWith } from "./test-profile";

const FTP = 265;
const LTHR = 168;
const THRESHOLD_PACE_KM = 245;

describe("deriveZoneMap", () => {
  it("should derive the 5-zone power view for cycling from FTP", () => {
    // Arrange
    const profile = profileWith("cycling", { ftp: FTP });

    // Act
    const map = deriveZoneMap(profile, "cycling");

    // Assert
    expect(map).not.toBeNull();
    expect(map).toHaveLength(POWER_ZONE_COUNT);
    expect(map?.[ZONE_1]).toMatchObject({
      n: 1,
      name: "Recovery",
      range: "< 146 W",
      pct: "< 55%",
    });
    expect(map?.[ZONE_2].range).toBe("146–199 W");
    expect(map?.[ZONE_5]).toMatchObject({
      n: 5,
      range: "> 278 W",
      pct: "> 105%",
    });
  });

  it("should fall back to the HR view when cycling has no FTP", () => {
    // Arrange
    const profile = profileWith("cycling", { lthr: LTHR });

    // Act
    const map = deriveZoneMap(profile, "cycling");

    // Assert
    expect(map?.[ZONE_1].range).toBe("< 138 bpm");
    expect(map?.[ZONE_5].range).toBe("> 168 bpm");
  });

  it("should derive the pace view for running, slowest zone first", () => {
    // Arrange
    const profile = profileWith("running", {
      thresholdPace: THRESHOLD_PACE_KM,
      paceUnit: "min_per_km",
    });

    // Act
    const map = deriveZoneMap(profile, "running");

    // Assert
    expect(map?.[ZONE_1].range).toBe("> 4:52 /km");
    expect(map?.[ZONE_5].range).toBe("< 4:00 /km");
  });

  it("should label the running pace view in min/mi for imperial units", () => {
    // Arrange
    const profile = profileWith("running", {
      thresholdPace: THRESHOLD_PACE_KM,
      paceUnit: "min_per_km",
    });

    // Act
    const map = deriveZoneMap(profile, "running", "imperial");

    // Assert
    expect(map?.[ZONE_1].range.endsWith("/mi")).toBe(true);
    expect(map?.[ZONE_5].range.endsWith("/mi")).toBe(true);
  });

  it("should return null when the sport has no usable threshold", () => {
    // Arrange
    const profile = profileWith("cycling", {});

    // Act
    const map = deriveZoneMap(profile, "cycling");

    // Assert
    expect(map).toBeNull();
  });
});

const POWER_ZONE_COUNT = 5;
const ZONE_1 = 0;
const ZONE_2 = 1;
const ZONE_5 = 4;
