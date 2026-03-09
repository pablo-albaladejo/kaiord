import { describe, it, expect } from "vitest";
import { formatZonesContext } from "./zones-formatter";
import type { Profile } from "../../../types/profile";
import type { SportZoneConfig } from "../../../types/sport-zones";

const emptyHrZones = {
  method: "custom",
  zones: [
    { zone: 1, name: "Recovery", minBpm: 0, maxBpm: 0 },
    { zone: 2, name: "Aerobic", minBpm: 0, maxBpm: 0 },
    { zone: 3, name: "Tempo", minBpm: 0, maxBpm: 0 },
    { zone: 4, name: "Threshold", minBpm: 0, maxBpm: 0 },
    { zone: 5, name: "VO2 Max", minBpm: 0, maxBpm: 0 },
  ],
};

const baseProfile: Profile = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Test Athlete",
  sportZones: {
    cycling: {
      thresholds: {},
      heartRateZones: emptyHrZones,
      powerZones: { method: "custom", zones: [] },
    },
    generic: { thresholds: {}, heartRateZones: emptyHrZones },
  },
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

const cyclingConfig: SportZoneConfig = {
  thresholds: { lthr: 170, ftp: 250 },
  heartRateZones: {
    method: "karvonen-5",
    zones: [
      { zone: 1, name: "Recovery", minBpm: 0, maxBpm: 139 },
      { zone: 2, name: "Aerobic", minBpm: 139, maxBpm: 151 },
      { zone: 3, name: "Tempo", minBpm: 151, maxBpm: 160 },
      { zone: 4, name: "Threshold", minBpm: 160, maxBpm: 170 },
      { zone: 5, name: "VO2 Max", minBpm: 170, maxBpm: 180 },
    ],
  },
  powerZones: {
    method: "coggan-7",
    zones: [
      { zone: 1, name: "Active Recovery", minPercent: 0, maxPercent: 55 },
      { zone: 2, name: "Endurance", minPercent: 56, maxPercent: 75 },
    ],
  },
};

const runningConfig: SportZoneConfig = {
  thresholds: { lthr: 170, thresholdPace: 300, paceUnit: "min_per_km" },
  heartRateZones: {
    method: "karvonen-5",
    zones: [{ zone: 1, name: "Recovery", minBpm: 0, maxBpm: 139 }],
  },
  powerZones: {
    method: "custom",
    zones: [{ zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 }],
  },
  paceZones: {
    method: "daniels-5",
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
    method: "karvonen-5",
    zones: [{ zone: 1, name: "Recovery", minBpm: 0, maxBpm: 131 }],
  },
  paceZones: {
    method: "daniels-5",
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
  describe("empty profile", () => {
    it("should return empty string when profile has no threshold data", () => {
      const result = formatZonesContext(baseProfile);

      expect(result).toBe("");
    });
  });

  describe("cycling sport", () => {
    it("should format power + HR zones with method names", () => {
      const profile: Profile = {
        ...baseProfile,
        sportZones: { cycling: cyclingConfig },
      };

      const result = formatZonesContext(profile, "cycling");

      expect(result).toContain("LTHR: 170bpm");
      expect(result).toContain("FTP: 250W");
      expect(result).toContain("HR zones (Karvonen 5-zone):");
      expect(result).toContain("Power zones (Coggan 7-zone, FTP: 250W):");
      expect(result).toContain("Z1 Active Recovery: 0-138W");
      expect(result).not.toContain("Pace zones");
    });
  });

  describe("running sport", () => {
    it("should format pace + HR zones with method names", () => {
      const profile: Profile = {
        ...baseProfile,
        sportZones: { running: runningConfig },
      };

      const result = formatZonesContext(profile, "running");

      expect(result).toContain("LTHR: 170bpm");
      expect(result).toContain("Threshold Pace: 5:00/km");
      expect(result).toContain("Pace zones (Daniels 5-zone):");
      expect(result).toContain("Z1 Easy: 5:45-10:00/km");
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
      expect(result).toContain("Pace zones (Daniels 5-zone):");
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

      expect(result).toContain("Z1 Easy: 5:45-10:00/km");
      expect(result).toContain("Z2 Aerobic: 5:24-5:45/km");
    });

    it("should format min/100m pace zones as mm:ss/100m", () => {
      const profile: Profile = {
        ...baseProfile,
        sportZones: { swimming: swimmingConfig },
      };

      const result = formatZonesContext(profile, "swimming");

      expect(result).toContain("Z1 Easy: 1:55-3:20/100m");
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

  describe("custom zone names in formatter", () => {
    it("should output custom zone names", () => {
      const config: SportZoneConfig = {
        ...cyclingConfig,
        powerZones: {
          method: "custom",
          zones: [
            { zone: 1, name: "My Easy Zone", minPercent: 0, maxPercent: 60 },
          ],
        },
      };
      const profile: Profile = {
        ...baseProfile,
        sportZones: { cycling: config },
      };

      const result = formatZonesContext(profile, "cycling");

      expect(result).toContain("Z1 My Easy Zone: 0-150W");
    });
  });
});
