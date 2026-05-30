import { createWorkoutKRD, type Workout } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { Target } from "../../types/krd";
import type { SportThresholds } from "../../types/sport-zones";
import { classifyTargetZone } from "./classify-zone";
import { estimateTss } from "./estimate-tss";
import { getStructuredWorkout } from "./get-workout";
import { buildReviewModel } from "./review-model";
import { toStepItems } from "./step-items";
import { timeInZone } from "./time-in-zone";

const THRESHOLDS: SportThresholds = {
  ftp: 250,
  lthr: 160,
  thresholdPace: 240,
  paceUnit: "min_per_km",
};

const Z1 = 1;
const Z3 = 3;
const Z4 = 4;
const Z5 = 5;
const ZONE_COUNT = 5;
const REPEAT = 4;
const TOTAL_ROWS = 3;
const PRECISION = 5;
const RECOVERY_PCT = 50;
const VO2_PCT = 115;

const ftpTarget = (value: number): Target => ({
  type: "power",
  value: { unit: "percent_ftp", value },
});

const ftpStep = (params: {
  stepIndex: number;
  percent: number;
  seconds: number;
}) => ({
  stepIndex: params.stepIndex,
  durationType: "time" as const,
  duration: { type: "time" as const, seconds: params.seconds },
  targetType: "power" as const,
  target: {
    type: "power" as const,
    value: { unit: "percent_ftp" as const, value: params.percent },
  },
  intensity: "active" as const,
});

const WORKOUT: Workout = {
  name: "VO₂ session",
  sport: "cycling",
  steps: [
    {
      ...ftpStep({ stepIndex: 0, percent: 50, seconds: 600 }),
      intensity: "warmup",
      name: "Warm up",
    },
    {
      repeatCount: REPEAT,
      steps: [
        ftpStep({ stepIndex: 1, percent: 115, seconds: 240 }),
        {
          ...ftpStep({ stepIndex: 2, percent: 45, seconds: 120 }),
          intensity: "rest",
        },
      ],
    },
    {
      ...ftpStep({ stepIndex: 3, percent: 50, seconds: 300 }),
      intensity: "cooldown",
      name: "Cool down",
    },
  ],
};

const krd = () => createWorkoutKRD(WORKOUT);

describe("workout-review", () => {
  it("should classify percent_ftp targets into ascending zones", () => {
    // Arrange
    const low = ftpTarget(RECOVERY_PCT);
    const high = ftpTarget(VO2_PCT);

    // Act
    const lowZone = classifyTargetZone(low, THRESHOLDS);
    const highZone = classifyTargetZone(high, THRESHOLDS);

    // Assert
    expect(lowZone).toBe(Z1);
    expect(highZone).toBe(Z5);
  });

  it("should classify watts, bpm and zone targets", () => {
    // Arrange
    const watts: Target = {
      type: "power",
      value: { unit: "watts", value: 250 },
    };
    const bpm: Target = {
      type: "heart_rate",
      value: { unit: "bpm", value: 160 },
    };
    const zone: Target = { type: "power", value: { unit: "zone", value: 3 } };

    // Act
    const wattsZone = classifyTargetZone(watts, THRESHOLDS);
    const bpmZone = classifyTargetZone(bpm, THRESHOLDS);
    const explicitZone = classifyTargetZone(zone, THRESHOLDS);

    // Assert
    expect(wattsZone).toBe(Z4);
    expect(bpmZone).toBe(Z5);
    expect(explicitZone).toBe(Z3);
  });

  it("should return null for unclassifiable targets", () => {
    // Arrange
    const open: Target = { type: "open" };
    const cadence: Target = {
      type: "cadence",
      value: { unit: "rpm", value: 90 },
    };

    // Act
    const openZone = classifyTargetZone(open, THRESHOLDS);
    const cadenceZone = classifyTargetZone(cadence, THRESHOLDS);

    // Assert
    expect(openZone).toBeNull();
    expect(cadenceZone).toBeNull();
  });

  it("should produce a time-in-zone distribution summing to one", () => {
    // Arrange

    // Act
    const dist = timeInZone(WORKOUT, THRESHOLDS);

    // Assert
    expect(dist).toHaveLength(ZONE_COUNT);
    const sum = dist.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, PRECISION);
  });

  it("should estimate a positive TSS", () => {
    // Arrange

    // Act
    const tss = estimateTss(WORKOUT, THRESHOLDS);

    // Assert
    expect(tss).toBeGreaterThan(0);
  });

  it("should collapse the repetition block into one row", () => {
    // Arrange

    // Act
    const items = toStepItems(WORKOUT, THRESHOLDS);

    // Assert
    expect(items).toHaveLength(TOTAL_ROWS);
    expect(items[1].detail).toContain(`${REPEAT} ×`);
  });

  it("should build a review model from the KRD", () => {
    // Arrange
    const model = buildReviewModel(krd(), THRESHOLDS, "Fallback");

    // Act
    const workout = getStructuredWorkout(krd());

    // Assert
    expect(workout).not.toBeNull();
    expect(model?.title).toBe("VO₂ session");
    expect(model?.steps).toHaveLength(TOTAL_ROWS);
    expect(model?.dist).toHaveLength(ZONE_COUNT);
    expect(model?.tss).toBeGreaterThan(0);
  });
});
