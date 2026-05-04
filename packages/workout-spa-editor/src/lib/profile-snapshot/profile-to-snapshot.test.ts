import { describe, expect, it } from "vitest";

import type { Profile } from "../../types/profile";
import { profileToSnapshot } from "./profile-to-snapshot";

const FIXED_NOW = new Date("2026-05-01T08:30:00.000Z");

const baseProfile: Profile = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Pablo",
  bodyWeight: 72,
  sportZones: {
    cycling: {
      thresholds: { ftp: 270, lthr: 168 },
      heartRateZones: { method: "manual", zones: [] },
      powerZones: { method: "manual", zones: [] },
    },
    running: {
      thresholds: { lthr: 170, thresholdPace: 4.25, paceUnit: "min_per_km" },
      heartRateZones: { method: "manual", zones: [] },
      paceZones: { method: "manual", zones: [] },
    },
    swimming: {
      thresholds: { thresholdPace: 1.45, paceUnit: "min_per_100m" },
      heartRateZones: { method: "manual", zones: [] },
      paceZones: { method: "manual", zones: [] },
    },
  },
  linkedAccounts: [],
  createdAt: FIXED_NOW.toISOString(),
  updatedAt: FIXED_NOW.toISOString(),
};

describe("profileToSnapshot", () => {
  it("should derive a baseline cycling snapshot", () => {
    // Arrange

    // Act
    const snapshot = profileToSnapshot(baseProfile, "cycling", FIXED_NOW);

    // Assert
    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.profile.name).toBe("Pablo");
    expect(snapshot.profile.bodyWeight).toBe(72);
    expect(snapshot.activeSport).toBe("cycling");
    expect(snapshot.thresholds.cycling?.ftp).toBe(270);
    expect(snapshot.heartRate?.lthr).toBe(168);
    expect(snapshot.generatedAt).toBe(FIXED_NOW.toISOString());
  });

  it("should convert running pace from min/km to seconds/km", () => {
    // Arrange

    // Act
    const snapshot = profileToSnapshot(baseProfile, "running", FIXED_NOW);

    // Assert
    expect(snapshot.thresholds.running?.thresholdPaceSecPerKm).toBe(255);
    expect(snapshot.thresholds.running?.lthr).toBe(170);
    expect(snapshot.heartRate?.lthr).toBe(170);
  });

  it("should convert swimming pace from min/100m to seconds/100m", () => {
    // Arrange

    // Act
    const snapshot = profileToSnapshot(baseProfile, "swimming", FIXED_NOW);

    // Assert
    expect(snapshot.thresholds.swimming?.cssPaceSecPer100m).toBe(87);
    expect(snapshot.activeSport).toBe("swimming");
  });

  it("should omit bodyWeight when undefined on the profile", () => {
    // Arrange
    const profile: Profile = { ...baseProfile, bodyWeight: undefined };

    // Act
    const snapshot = profileToSnapshot(profile, "cycling", FIXED_NOW);

    // Assert
    expect(snapshot.profile.bodyWeight).toBeUndefined();
  });

  it("should omit activeSport when caller passes undefined", () => {
    // Arrange

    // Act
    const snapshot = profileToSnapshot(baseProfile, undefined, FIXED_NOW);

    // Assert
    expect(snapshot.activeSport).toBeUndefined();
  });

  it("omits a sport's thresholds when no values are present", () => {
    // Arrange
    const profile: Profile = {
      ...baseProfile,
      sportZones: {
        cycling: undefined,
        running: undefined,
        swimming: undefined,
      },
    };

    // Act
    const snapshot = profileToSnapshot(profile, undefined, FIXED_NOW);

    // Assert
    expect(snapshot.thresholds.cycling).toBeUndefined();
    expect(snapshot.thresholds.running).toBeUndefined();
    expect(snapshot.thresholds.swimming).toBeUndefined();
  });

  it("should emit ISO datetime for generatedAt", () => {
    // Arrange

    // Act
    const snapshot = profileToSnapshot(baseProfile, "cycling", FIXED_NOW);

    // Assert
    expect(snapshot.generatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });
});
