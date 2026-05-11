import { beforeEach, describe, expect, it, vi } from "vitest";

import type { HeartRateZone, PowerZone, Profile } from "../../../types/profile";

vi.mock("./helpers", () => ({
  getPowerZoneName: vi.fn(),
  calculatePowerFromZone: vi.fn(),
  getHeartRateZoneName: vi.fn(),
  calculateHeartRateFromZone: vi.fn(),
}));

import {
  calculateHeartRateFromZone,
  calculatePowerFromZone,
  getHeartRateZoneName,
  getPowerZoneName,
} from "./helpers";
import { getZoneInfo } from "./zone-info-helpers";

const getPowerZoneNameMock = vi.mocked(getPowerZoneName);
const calculatePowerFromZoneMock = vi.mocked(calculatePowerFromZone);
const getHeartRateZoneNameMock = vi.mocked(getHeartRateZoneName);
const calculateHeartRateFromZoneMock = vi.mocked(calculateHeartRateFromZone);

const POWER_ZONES: Array<PowerZone> = [
  { zone: 2, name: "Endurance", minPercent: 56, maxPercent: 75 },
];

const HEART_RATE_ZONES: Array<HeartRateZone> = [
  { zone: 3, name: "Aerobic", minBpm: 140, maxBpm: 160 },
];

type ProfileOverrides = {
  withCycling?: boolean;
  ftp?: number;
  powerZones?: Array<PowerZone>;
  heartRateZones?: Array<HeartRateZone>;
};

const makeProfile = ({
  withCycling = true,
  ftp = 250,
  powerZones = POWER_ZONES,
  heartRateZones = HEART_RATE_ZONES,
}: ProfileOverrides = {}): Profile => {
  const cyclingZones = {
    thresholds: { ftp },
    powerZones: { mode: "ftp" as const, zones: powerZones },
    heartRateZones: { mode: "max_hr" as const, zones: heartRateZones },
  };
  const profile = {
    id: "00000000-0000-0000-0000-000000000000",
    name: "Test",
    sportZones: withCycling ? { cycling: cyclingZones } : {},
    linkedAccounts: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
  return profile as unknown as Profile;
};

describe("getZoneInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when unit is not zone", () => {
    // Arrange
    const profile = makeProfile();

    // Act
    const actual = getZoneInfo("power", "watts", "2", profile);

    // Assert
    expect(actual).toBeNull();
  });

  it("should return null when value is empty string", () => {
    // Arrange
    const profile = makeProfile();

    // Act
    const actual = getZoneInfo("power", "zone", "", profile);

    // Assert
    expect(actual).toBeNull();
  });

  it("should return null when activeProfile is null", () => {
    // Arrange
    const profile = null;

    // Act
    const actual = getZoneInfo("power", "zone", "2", profile);

    // Assert
    expect(actual).toBeNull();
  });

  it("should return null when activeProfile is undefined", () => {
    // Arrange

    // Act
    const actual = getZoneInfo("power", "zone", "2");

    // Assert
    expect(actual).toBeNull();
  });

  it("should return null when sportZones.cycling is missing", () => {
    // Arrange
    const profile = makeProfile({ withCycling: false });

    // Act
    const actual = getZoneInfo("power", "zone", "2", profile);

    // Assert
    expect(actual).toBeNull();
  });

  it("should return formatted power zone string when name and range are present", () => {
    // Arrange
    const profile = makeProfile();
    getPowerZoneNameMock.mockReturnValue("Endurance");
    calculatePowerFromZoneMock.mockReturnValue({ min: 175, max: 210 });

    // Act
    const actual = getZoneInfo("power", "zone", "2", profile);

    // Assert
    expect(actual).toBe("Endurance (175-210W)");
  });

  it("should return power zone name only when range is null", () => {
    // Arrange
    const profile = makeProfile();
    getPowerZoneNameMock.mockReturnValue("Endurance");
    calculatePowerFromZoneMock.mockReturnValue(null);

    // Act
    const actual = getZoneInfo("power", "zone", "2", profile);

    // Assert
    expect(actual).toBe("Endurance");
  });

  it("should return null when power zone name is null and range is null", () => {
    // Arrange
    const profile = makeProfile();
    getPowerZoneNameMock.mockReturnValue(null);
    calculatePowerFromZoneMock.mockReturnValue(null);

    // Act
    const actual = getZoneInfo("power", "zone", "99", profile);

    // Assert
    expect(actual).toBeNull();
  });

  it("should default to empty zones when powerZones is undefined", () => {
    // Arrange
    const profile = makeProfile();
    // Strip powerZones to exercise the `?? []` fallback branch
    const stripped = profile as unknown as {
      sportZones: { cycling: { powerZones?: unknown } };
    };
    stripped.sportZones.cycling.powerZones = undefined;
    getPowerZoneNameMock.mockReturnValue(null);
    calculatePowerFromZoneMock.mockReturnValue(null);

    // Act
    const actual = getZoneInfo("power", "zone", "2", profile);

    // Assert
    expect(actual).toBeNull();
  });

  it("should return formatted heart rate zone string when name and range are present", () => {
    // Arrange
    const profile = makeProfile();
    getHeartRateZoneNameMock.mockReturnValue("Aerobic");
    calculateHeartRateFromZoneMock.mockReturnValue({ min: 140, max: 160 });

    // Act
    const actual = getZoneInfo("heart_rate", "zone", "3", profile);

    // Assert
    expect(actual).toBe("Aerobic (140-160 BPM)");
  });

  it("should return heart rate zone name only when range is null", () => {
    // Arrange
    const profile = makeProfile();
    getHeartRateZoneNameMock.mockReturnValue("Aerobic");
    calculateHeartRateFromZoneMock.mockReturnValue(null);

    // Act
    const actual = getZoneInfo("heart_rate", "zone", "3", profile);

    // Assert
    expect(actual).toBe("Aerobic");
  });

  it("should return null heart rate zone name when not found", () => {
    // Arrange
    const profile = makeProfile();
    getHeartRateZoneNameMock.mockReturnValue(null);
    calculateHeartRateFromZoneMock.mockReturnValue(null);

    // Act
    const actual = getZoneInfo("heart_rate", "zone", "99", profile);

    // Assert
    expect(actual).toBeNull();
  });

  it.each<["pace" | "cadence" | "open"]>([["pace"], ["cadence"], ["open"]])(
    "should return null for non-power non-heart_rate targetType=%s",
    (targetType) => {
      // Arrange
      const profile = makeProfile();

      // Act
      const actual = getZoneInfo(targetType, "zone", "2", profile);

      // Assert
      expect(actual).toBeNull();
    }
  );
});
