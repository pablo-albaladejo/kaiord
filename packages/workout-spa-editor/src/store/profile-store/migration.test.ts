import { describe, expect, it } from "vitest";
import { migrateProfile } from "./migration";
import { DEFAULT_HEART_RATE_ZONES } from "../../types/profile-defaults";

const legacyProfile = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Test",
  ftp: 250,
  maxHeartRate: 170,
  powerZones: [
    { zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 },
    { zone: 2, name: "Z2", minPercent: 56, maxPercent: 75 },
  ],
  heartRateZones: [
    { zone: 1, name: "Z1", minBpm: 0, maxBpm: 102 },
    { zone: 2, name: "Z2", minBpm: 102, maxBpm: 119 },
  ],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("migrateProfile", () => {
  it("should migrate legacy profile to sport-specific zones", () => {
    const migrated = migrateProfile(legacyProfile);

    expect(migrated.sportZones).toBeDefined();
    expect(migrated.sportZones?.cycling).toBeDefined();
    expect(migrated.sportZones?.generic).toBeDefined();
    expect(migrated.sportZones?.running).toBeDefined();
    expect(migrated.sportZones?.swimming).toBeDefined();
  });

  it("should map FTP to cycling thresholds", () => {
    const migrated = migrateProfile(legacyProfile);
    const cycling = migrated.sportZones?.cycling;

    expect(cycling?.thresholds.ftp).toBe(250);
    expect(cycling?.thresholds.lthr).toBe(170);
  });

  it("should map power zones to cycling", () => {
    const migrated = migrateProfile(legacyProfile);
    const cycling = migrated.sportZones?.cycling;

    expect(cycling?.powerZones?.mode).toBe("manual");
    expect(cycling?.powerZones?.zones).toEqual(legacyProfile.powerZones);
  });

  it("should auto-calculate HR zones from maxHeartRate", () => {
    const migrated = migrateProfile(legacyProfile);
    const cycling = migrated.sportZones?.cycling;

    expect(cycling?.heartRateZones.mode).toBe("auto");
    // LTHR=170 -> Z1: 0-139bpm
    expect(cycling?.heartRateZones.zones[0]?.maxBpm).toBe(139);
  });

  it("should copy LTHR to all sports", () => {
    const migrated = migrateProfile(legacyProfile);

    expect(migrated.sportZones?.generic?.thresholds.lthr).toBe(170);
    expect(migrated.sportZones?.running?.thresholds.lthr).toBe(170);
    expect(migrated.sportZones?.swimming?.thresholds.lthr).toBe(170);
  });

  it("should not re-migrate already-migrated profiles", () => {
    const migrated = migrateProfile(legacyProfile);
    const reMigrated = migrateProfile(migrated);

    expect(reMigrated).toBe(migrated);
  });

  it("should use manual mode with existing HR zones when no maxHeartRate", () => {
    const noHr = { ...legacyProfile, maxHeartRate: undefined };
    const migrated = migrateProfile(noHr);
    const cycling = migrated.sportZones?.cycling;

    expect(cycling?.heartRateZones.mode).toBe("manual");
    expect(cycling?.heartRateZones.zones).toEqual(legacyProfile.heartRateZones);
  });

  it("should fall back to manual defaults when no HR data exists", () => {
    const noHrData = {
      ...legacyProfile,
      maxHeartRate: undefined,
      heartRateZones: undefined,
    };
    const migrated = migrateProfile(noHrData);
    const cycling = migrated.sportZones?.cycling;

    expect(cycling?.heartRateZones.mode).toBe("manual");
    expect(cycling?.heartRateZones.zones).toEqual(DEFAULT_HEART_RATE_ZONES);
  });

  it("should create empty running and swimming configs", () => {
    const migrated = migrateProfile(legacyProfile);

    expect(migrated.sportZones?.running?.powerZones).toBeUndefined();
    expect(migrated.sportZones?.swimming?.powerZones).toBeUndefined();
    expect(migrated.sportZones?.running?.paceZones).toBeUndefined();
    expect(migrated.sportZones?.swimming?.paceZones).toBeUndefined();
  });
});
