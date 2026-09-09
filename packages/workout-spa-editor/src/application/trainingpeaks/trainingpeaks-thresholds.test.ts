import { describe, expect, it } from "vitest";

import {
  paceToMetresPerSecond,
  toTrainingPeaksThresholds,
} from "./trainingpeaks-thresholds";

const METRES_PER_KM = 1000;
const METRES_PER_SWIM_UNIT = 100;
const SECONDS_PER_MINUTE = 60;
const FOUR_MINUTES = 4;
const NINETY_SECONDS_IN_MINUTES = 1.5;
const FOUR_MIN_PER_KM_MPS = METRES_PER_KM / (FOUR_MINUTES * SECONDS_PER_MINUTE);
const NINETY_SEC_PER_100M_MPS =
  METRES_PER_SWIM_UNIT / (NINETY_SECONDS_IN_MINUTES * SECONDS_PER_MINUTE);
const MAX_HR = 190;
const FTP = 250;
const LTHR = 170;
/** Decimals compared on a derived speed. */
const MPS_PRECISION = 10;

describe("paceToMetresPerSecond", () => {
  it.each([
    {
      unit: "min_per_km" as const,
      pace: FOUR_MINUTES,
      expected: FOUR_MIN_PER_KM_MPS,
    },
    {
      unit: "min_per_100m" as const,
      pace: NINETY_SECONDS_IN_MINUTES,
      expected: NINETY_SEC_PER_100M_MPS,
    },
  ])(
    "should convert $unit to metres per second",
    ({ unit, pace, expected }) => {
      // Arrange

      // Act
      const mps = paceToMetresPerSecond(pace, unit);

      // Assert
      expect(mps).toBeCloseTo(expected, MPS_PRECISION);
    }
  );

  it("should return undefined for a non-positive pace rather than infinity", () => {
    // Arrange
    const pace = 0;

    // Act
    const mps = paceToMetresPerSecond(pace, "min_per_km");

    // Assert
    expect(mps).toBeUndefined();
  });
});

describe("toTrainingPeaksThresholds", () => {
  it("should read FTP from the sport matching the workout", () => {
    // Arrange
    const zones = {
      cycling: {
        thresholds: { ftp: FTP },
        heartRateZones: { method: "manual", zones: [] },
      },
    };

    // Act
    const result = toTrainingPeaksThresholds(zones, "cycling", MAX_HR);

    // Assert
    expect(result.ftpWatts).toBe(FTP);
    expect(result.maxHeartRateBpm).toBe(MAX_HR);
  });

  it("should map a sport without its own zones onto generic", () => {
    // Arrange
    const zones = {
      generic: {
        thresholds: { ftp: FTP },
        heartRateZones: { method: "manual", zones: [] },
      },
    };

    // Act
    const result = toTrainingPeaksThresholds(zones, "rowing", undefined);

    // Assert
    expect(result.ftpWatts).toBe(FTP);
  });

  it("should convert threshold pace out of its profile unit", () => {
    // Arrange
    const zones = {
      running: {
        thresholds: {
          thresholdPace: FOUR_MINUTES,
          paceUnit: "min_per_km" as const,
        },
        heartRateZones: { method: "manual", zones: [] },
      },
    };

    // Act
    const result = toTrainingPeaksThresholds(zones, "running", undefined);

    // Assert
    expect(result.thresholdPaceMps).toBeCloseTo(
      FOUR_MIN_PER_KM_MPS,
      MPS_PRECISION
    );
  });

  it("should leave threshold pace undefined when the profile omits its unit", () => {
    // Arrange
    const zones = {
      running: {
        thresholds: { thresholdPace: FOUR_MINUTES },
        heartRateZones: { method: "manual", zones: [] },
      },
    };

    // Act
    const result = toTrainingPeaksThresholds(zones, "running", undefined);

    // Assert
    expect(result.thresholdPaceMps).toBeUndefined();
  });

  it("should not borrow lactate threshold HR as the maximum", () => {
    // Arrange
    const zones = {
      running: {
        thresholds: { lthr: LTHR },
        heartRateZones: { method: "manual", zones: [] },
      },
    };

    // Act
    const result = toTrainingPeaksThresholds(zones, "running", undefined);

    // Assert
    expect(result.maxHeartRateBpm).toBeUndefined();
  });
});
