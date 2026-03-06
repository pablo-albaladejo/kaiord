import { describe, it, expect } from "vitest";
import { formatZonesContext } from "./zones-formatter";
import type { Profile } from "../../../types/profile";
import type { SportZoneConfig } from "../../../types/sport-zones";

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

const cyclingConfig: SportZoneConfig = {
  thresholds: { lthr: 170, ftp: 250 },
  heartRateZones: {
    mode: "auto",
    zones: [
      { zone: 1, name: "Recovery", minBpm: 0, maxBpm: 139 },
      { zone: 2, name: "Aerobic", minBpm: 139, maxBpm: 151 },
      { zone: 3, name: "Tempo", minBpm: 151, maxBpm: 160 },
      { zone: 4, name: "Threshold", minBpm: 160, maxBpm: 170 },
      { zone: 5, name: "VO2 Max", minBpm: 170, maxBpm: 180 },
    ],
  },
  powerZones: {
    mode: "auto",
    zones: [
      { zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 },
      { zone: 2, name: "Z2", minPercent: 56, maxPercent: 75 },
    ],
  },
};

const runningConfig: SportZoneConfig = {
  thresholds: { lthr: 170, thresholdPace: 300, paceUnit: "min_per_km" },
  heartRateZones: {
    mode: "auto",
    zones: [{ zone: 1, name: "Recovery", minBpm: 0, maxBpm: 139 }],
  },
  powerZones: {
    mode: "manual",
    zones: [{ zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 }],
  },
  paceZones: {
    mode: "auto",
    zones: [
      { zone: 1, name: "Easy", minPace: 345, maxPace: 600, unit: "min_per_km" },
      {
        zone: 2,
        name: "Aerobic",
        minPace: 324,
        maxPace: 345,
        unit: "min_per_km",
      },
    ],
  },
};

const swimmingConfig: SportZoneConfig = {
  thresholds: { lthr: 160, thresholdPace: 100, paceUnit: "min_per_100m" },
  heartRateZones: {
    mode: "auto",
    zones: [{ zone: 1, name: "Recovery", minBpm: 0, maxBpm: 131 }],
  },
  paceZones: {
    mode: "auto",
    zones: [
      {
        zone: 1,
        name: "Easy",
        minPace: 115,
        maxPace: 200,
        unit: "min_per_100m",
      },
    ],
  },
};

describe("formatZonesContext", () => {
  describe("legacy (no sport)", () => {
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
    });
  });

  describe("cycling sport", () => {
    it("should format power + HR zones only", () => {
      const profile: Profile = {
        ...baseProfile,
        sportZones: { cycling: cyclingConfig },
      };

      const result = formatZonesContext(profile, "cycling");

      expect(result).toContain("LTHR: 170bpm");
      expect(result).toContain("FTP: 250W");
      expect(result).toContain("HR zones:");
      expect(result).toContain("Power zones:");
      expect(result).not.toContain("Pace zones:");
    });
  });

  describe("running sport", () => {
    it("should format pace + HR zones", () => {
      const profile: Profile = {
        ...baseProfile,
        sportZones: { running: runningConfig },
      };

      const result = formatZonesContext(profile, "running");

      expect(result).toContain("LTHR: 170bpm");
      expect(result).toContain("Threshold Pace: 5:00/km");
      expect(result).toContain("Pace zones:");
      expect(result).toContain("Easy: 5:45-10:00/km");
    });
  });

  describe("swimming sport", () => {
    it("should format pace + HR zones with /100m unit", () => {
      const profile: Profile = {
        ...baseProfile,
        sportZones: { swimming: swimmingConfig },
      };

      const result = formatZonesContext(profile, "swimming");

      expect(result).toContain("LTHR: 160bpm");
      expect(result).toContain("Pace zones:");
      expect(result).toContain("/100m");
    });
  });

  describe("pace zone formatting", () => {
    it("should format min/km pace zones as mm:ss/km", () => {
      const profile: Profile = {
        ...baseProfile,
        sportZones: { running: runningConfig },
      };

      const result = formatZonesContext(profile, "running");

      // 345s = 5:45, 600s = 10:00
      expect(result).toContain("Easy: 5:45-10:00/km");
      // 324s = 5:24, 345s = 5:45
      expect(result).toContain("Aerobic: 5:24-5:45/km");
    });

    it("should format min/100m pace zones as mm:ss/100m", () => {
      const profile: Profile = {
        ...baseProfile,
        sportZones: { swimming: swimmingConfig },
      };

      const result = formatZonesContext(profile, "swimming");

      // 115s = 1:55, 200s = 3:20
      expect(result).toContain("Easy: 1:55-3:20/100m");
    });
  });

  describe("fallback (no sport selected)", () => {
    it("should format all sports when no sport is provided", () => {
      const profile: Profile = {
        ...baseProfile,
        sportZones: {
          cycling: cyclingConfig,
          running: runningConfig,
        },
      };

      const result = formatZonesContext(profile);

      expect(result).toContain("[cycling]");
      expect(result).toContain("[running]");
    });
  });
});
