import { describe, expect, it } from "vitest";

import {
  estimateExpectedActivityKcal,
  type ExpectedActivityKcalInput,
} from "./expected-activity-kcal";

const WEIGHT_KG = 70;
const HALF_HOUR_SEC = 1800;
const ONE_HOUR_SEC = 3600;
const CYCLING_WATTS = 200;
const RUN_DISTANCE_KM = 10;

// Power tier: 200 W * 3600 s / 1000 = 720 kJ ≈ 720 kcal.
const POWER_KCAL = 720;
// Power preferred over distance: 250 * 1800 / 1000 = 450.
const POWER_OVER_DISTANCE_WATTS = 250;
const POWER_OVER_DISTANCE_KCAL = 450;
// Running-distance tier: 10 km * 70 kg ≈ 700 kcal.
const DISTANCE_KCAL = 700;
// Cycling MET tier (8.0): 1 h * 8.0 * 70 = 560.
const CYCLING_DISTANCE_KM = 40;
const CYCLING_MET_KCAL = 560;
// Training MET tier (5.0): 1 h * 5.0 * 70 = 350.
const TRAINING_MET_KCAL = 350;
// DEFAULT_MET (6.0): 1 h * 6.0 * 70 = 420.
const DEFAULT_MET_KCAL = 420;
// running MET 9.8: (1000/3600) * 9.8 * 70 = 190.55… → 191.
const SHORT_RUN_SEC = 1000;
const SHORT_RUN_KCAL = 191;
const NEGATIVE_WATTS = -5;

const CYCLING_POWER: ExpectedActivityKcalInput = {
  sport: "cycling",
  durationSec: ONE_HOUR_SEC,
  weightKg: WEIGHT_KG,
  avgPowerWatts: CYCLING_WATTS,
};

const RUNNING_DISTANCE: ExpectedActivityKcalInput = {
  sport: "running",
  durationSec: HALF_HOUR_SEC,
  weightKg: WEIGHT_KG,
  distanceKm: RUN_DISTANCE_KM,
};

const STRENGTH_MET: ExpectedActivityKcalInput = {
  sport: "training",
  durationSec: ONE_HOUR_SEC,
  weightKg: WEIGHT_KG,
};

describe("estimateExpectedActivityKcal (power tier)", () => {
  it("should use the power tier when avgPowerWatts is present", () => {
    // Arrange
    const input = CYCLING_POWER;

    // Act
    const kcal = estimateExpectedActivityKcal(input);

    // Assert
    expect(kcal).toBe(POWER_KCAL);
  });

  it("should prefer power over distance when both are present", () => {
    // Arrange
    const input: ExpectedActivityKcalInput = {
      ...RUNNING_DISTANCE,
      avgPowerWatts: POWER_OVER_DISTANCE_WATTS,
    };

    // Act
    const kcal = estimateExpectedActivityKcal(input);

    // Assert
    expect(kcal).toBe(POWER_OVER_DISTANCE_KCAL);
  });
});

describe("estimateExpectedActivityKcal (running-distance tier)", () => {
  it("should use the distance tier for a running sport with distanceKm", () => {
    // Arrange
    const input = RUNNING_DISTANCE;

    // Act
    const kcal = estimateExpectedActivityKcal(input);

    // Assert
    expect(kcal).toBe(DISTANCE_KCAL);
  });

  it("should ignore distance for a non-running sport and use the MET tier", () => {
    // Arrange
    const input: ExpectedActivityKcalInput = {
      sport: "cycling",
      durationSec: ONE_HOUR_SEC,
      weightKg: WEIGHT_KG,
      distanceKm: CYCLING_DISTANCE_KM,
    };

    // Act
    const kcal = estimateExpectedActivityKcal(input);

    // Assert
    expect(kcal).toBe(CYCLING_MET_KCAL);
  });
});

describe("estimateExpectedActivityKcal (MET tier)", () => {
  it("should use the MET tier when neither power nor distance is available", () => {
    // Arrange
    const input = STRENGTH_MET;

    // Act
    const kcal = estimateExpectedActivityKcal(input);

    // Assert
    expect(kcal).toBe(TRAINING_MET_KCAL);
  });

  it("should apply DEFAULT_MET for an unmapped sport", () => {
    // Arrange
    const input: ExpectedActivityKcalInput = {
      sport: "video_gaming",
      durationSec: ONE_HOUR_SEC,
      weightKg: WEIGHT_KG,
    };

    // Act
    const kcal = estimateExpectedActivityKcal(input);

    // Assert
    expect(kcal).toBe(DEFAULT_MET_KCAL);
  });

  it("should round the MET-tier result to an integer", () => {
    // Arrange
    const input: ExpectedActivityKcalInput = {
      sport: "running",
      durationSec: SHORT_RUN_SEC,
      weightKg: WEIGHT_KG,
    };

    // Act
    const kcal = estimateExpectedActivityKcal(input);

    // Assert
    expect(kcal).toBe(SHORT_RUN_KCAL);
  });
});

describe("estimateExpectedActivityKcal (input guards)", () => {
  it.each([
    ["zero duration", { ...STRENGTH_MET, durationSec: 0 }],
    ["negative weight", { ...STRENGTH_MET, weightKg: -1 }],
    ["non-finite duration", { ...STRENGTH_MET, durationSec: Number.NaN }],
    ["negative power", { ...CYCLING_POWER, avgPowerWatts: NEGATIVE_WATTS }],
    [
      "non-finite distance",
      { ...RUNNING_DISTANCE, distanceKm: Number.POSITIVE_INFINITY },
    ],
  ])("should throw RangeError for %s", (_label, input) => {
    // Arrange
    const act = () =>
      estimateExpectedActivityKcal(input as ExpectedActivityKcalInput);

    // Act

    // Assert
    expect(act).toThrow(RangeError);
  });
});
