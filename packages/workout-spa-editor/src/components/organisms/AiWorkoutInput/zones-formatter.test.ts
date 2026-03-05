import { describe, it, expect } from "vitest";
import { formatZonesContext } from "./zones-formatter";
import type { Profile } from "../../../types/profile";

const baseProfile: Profile = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Test Athlete",
  ftp: undefined,
  maxHeartRate: undefined,
  powerZones: [
    { zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 },
    { zone: 2, name: "Z2", minPercent: 56, maxPercent: 75 },
    { zone: 3, name: "Z3", minPercent: 76, maxPercent: 90 },
    { zone: 4, name: "Z4", minPercent: 91, maxPercent: 105 },
    { zone: 5, name: "Z5", minPercent: 106, maxPercent: 120 },
    { zone: 6, name: "Z6", minPercent: 121, maxPercent: 150 },
    { zone: 7, name: "Z7", minPercent: 151, maxPercent: 200 },
  ],
  heartRateZones: [
    { zone: 1, name: "Recovery", minBpm: 0, maxBpm: 0 },
    { zone: 2, name: "Aerobic", minBpm: 0, maxBpm: 0 },
    { zone: 3, name: "Tempo", minBpm: 0, maxBpm: 0 },
    { zone: 4, name: "Threshold", minBpm: 0, maxBpm: 0 },
    { zone: 5, name: "VO2 Max", minBpm: 0, maxBpm: 0 },
  ],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

describe("formatZonesContext", () => {
  it("should return empty string when profile has no FTP or HR data", () => {
    const result = formatZonesContext(baseProfile);

    expect(result).toBe("");
  });

  it("should include FTP value when set", () => {
    const profile: Profile = { ...baseProfile, ftp: 250 };

    const result = formatZonesContext(profile);

    expect(result).toContain("FTP: 250W");
  });

  it("should include max heart rate when set", () => {
    const profile: Profile = { ...baseProfile, maxHeartRate: 185 };

    const result = formatZonesContext(profile);

    expect(result).toContain("Max HR: 185bpm");
  });

  it("should include power zones with calculated watt values when FTP is set", () => {
    const profile: Profile = { ...baseProfile, ftp: 200 };

    const result = formatZonesContext(profile);

    expect(result).toContain("FTP: 200W");
    expect(result).toContain("Power zones:");
    expect(result).toContain("Z1: 0-110W");
    expect(result).toContain("Z2: 112-150W");
  });

  it("should not include power zones when FTP is not set even if zones exist", () => {
    const result = formatZonesContext(baseProfile);

    expect(result).not.toContain("Power zones:");
  });

  it("should include heart rate zones when they have non-zero maxBpm", () => {
    const profile: Profile = {
      ...baseProfile,
      maxHeartRate: 190,
      heartRateZones: [
        { zone: 1, name: "Recovery", minBpm: 95, maxBpm: 114 },
        { zone: 2, name: "Aerobic", minBpm: 114, maxBpm: 133 },
        { zone: 3, name: "Tempo", minBpm: 133, maxBpm: 152 },
        { zone: 4, name: "Threshold", minBpm: 152, maxBpm: 171 },
        { zone: 5, name: "VO2 Max", minBpm: 171, maxBpm: 190 },
      ],
    };

    const result = formatZonesContext(profile);

    expect(result).toContain("HR zones:");
    expect(result).toContain("Recovery: 95-114bpm");
    expect(result).toContain("VO2 Max: 171-190bpm");
  });

  it("should filter out heart rate zones with maxBpm of 0", () => {
    const profile: Profile = {
      ...baseProfile,
      maxHeartRate: 190,
      heartRateZones: [
        { zone: 1, name: "Recovery", minBpm: 0, maxBpm: 0 },
        { zone: 2, name: "Aerobic", minBpm: 114, maxBpm: 133 },
        { zone: 3, name: "Tempo", minBpm: 0, maxBpm: 0 },
        { zone: 4, name: "Threshold", minBpm: 0, maxBpm: 0 },
        { zone: 5, name: "VO2 Max", minBpm: 0, maxBpm: 0 },
      ],
    };

    const result = formatZonesContext(profile);

    expect(result).toContain("HR zones: Aerobic: 114-133bpm");
    expect(result).not.toContain("Recovery");
  });

  it("should not include HR zones line when all zones have maxBpm of 0", () => {
    const profile: Profile = {
      ...baseProfile,
      maxHeartRate: 190,
    };

    const result = formatZonesContext(profile);

    expect(result).not.toContain("HR zones:");
  });

  it("should combine FTP, power zones, and HR zones with newlines", () => {
    const profile: Profile = {
      ...baseProfile,
      ftp: 250,
      maxHeartRate: 185,
      heartRateZones: [
        { zone: 1, name: "Z1", minBpm: 90, maxBpm: 111 },
        { zone: 2, name: "Z2", minBpm: 111, maxBpm: 130 },
        { zone: 3, name: "Z3", minBpm: 130, maxBpm: 148 },
        { zone: 4, name: "Z4", minBpm: 148, maxBpm: 167 },
        { zone: 5, name: "Z5", minBpm: 167, maxBpm: 185 },
      ],
    };

    const result = formatZonesContext(profile);

    const lines = result.split("\n");
    expect(lines[0]).toBe("FTP: 250W");
    expect(lines[1]).toBe("Max HR: 185bpm");
    expect(lines[2]).toContain("Power zones:");
    expect(lines[3]).toContain("HR zones:");
  });
});
