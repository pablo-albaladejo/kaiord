import { describe, expect, it } from "vitest";

import type { Profile } from "../../types/profile";
import { profileToSnapshot } from "./profile-to-snapshot";

const BASELINE_BODY_WEIGHT_KG = 72;

const CYCLING_FTP_W = 270;

const CYCLING_LTHR_BPM = 168;

const RUNNING_PACE_SEC_PER_KM = 255;

const RUNNING_LTHR_BPM = 170;

const SWIMMING_PACE_SEC_PER_100M = 87;

const FIXED_NOW = new Date("2026-05-01T08:30:00.000Z");

const baseProfile: Profile = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Pablo",
  bodyWeight: BASELINE_BODY_WEIGHT_KG,
  sportZones: {
    cycling: {
      thresholds: { ftp: CYCLING_FTP_W, lthr: CYCLING_LTHR_BPM },
      heartRateZones: { method: "manual", zones: [] },
      powerZones: { method: "manual", zones: [] },
    },
    running: {
      thresholds: {
        lthr: RUNNING_LTHR_BPM,
        thresholdPace: 4.25,
        paceUnit: "min_per_km",
      },
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
    expect(snapshot.profile.bodyWeight).toBe(BASELINE_BODY_WEIGHT_KG);
    expect(snapshot.activeSport).toBe("cycling");
    expect(snapshot.thresholds.cycling?.ftp).toBe(CYCLING_FTP_W);
    expect(snapshot.heartRate?.lthr).toBe(CYCLING_LTHR_BPM);
    expect(snapshot.generatedAt).toBe(FIXED_NOW.toISOString());
  });

  it("should convert running pace from min/km to seconds/km", () => {
    // Arrange

    // Act
    const snapshot = profileToSnapshot(baseProfile, "running", FIXED_NOW);

    // Assert
    expect(snapshot.thresholds.running?.thresholdPaceSecPerKm).toBe(
      RUNNING_PACE_SEC_PER_KM
    );
    expect(snapshot.thresholds.running?.lthr).toBe(RUNNING_LTHR_BPM);
    expect(snapshot.heartRate?.lthr).toBe(RUNNING_LTHR_BPM);
  });

  it("should convert swimming pace from min/100m to seconds/100m", () => {
    // Arrange

    // Act
    const snapshot = profileToSnapshot(baseProfile, "swimming", FIXED_NOW);

    // Assert
    expect(snapshot.thresholds.swimming?.cssPaceSecPer100m).toBe(
      SWIMMING_PACE_SEC_PER_100M
    );
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

  it("should omit a sport's thresholds when no values are present", () => {
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
});
