/**
 * Workout Statistics Helper Tests
 *
 * Tests for step-level statistics calculations.
 */

import { describe, expect, it } from "vitest";

import type { RepetitionBlock, WorkoutStep } from "../types/krd";
import {
  calculateRepetitionStats,
  calculateStepStats,
} from "./workout-stats-helpers";
import {
  STATS_DISTANCE_METERS as DISTANCE,
  STATS_HEART_RATE_BPM as HR,
  STATS_PACE_MIN_PER_KM as PACE,
  STATS_POWER_WATTS as POWER,
  STATS_REPEAT_COUNTS as REPEATS,
  STATS_TIME_SECONDS as TIME,
} from "./workout-stats-helpers.test-fixtures";

describe("workout-stats-helpers", () => {
  describe("calculateStepStats", () => {
    it("should calculate stats for time-based step", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: TIME.threeHundred },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: POWER.twoHundred },
        },
      };

      // Act
      const result = calculateStepStats(step);

      // Assert
      expect(result.totalDuration).toBe(TIME.threeHundred);
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(false);
    });

    it("should calculate stats for distance-based step", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "distance",
        duration: { type: "distance", meters: DISTANCE.oneThousand },
        targetType: "pace",
        target: {
          type: "pace",
          value: { unit: "min_per_km", value: PACE.five },
        },
      };

      // Act
      const result = calculateStepStats(step);

      // Assert
      expect(result.totalDuration).toBeNull();
      expect(result.totalDistance).toBe(DISTANCE.oneThousand);
      expect(result.hasOpenSteps).toBe(false);
    });

    it("should mark open duration steps", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "open",
        duration: { type: "open" },
        targetType: "open",
        target: { type: "open" },
      };

      // Act
      const result = calculateStepStats(step);

      // Assert
      expect(result.totalDuration).toBeNull();
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(true);
    });

    it("should handle heart rate conditional duration", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "heart_rate_less_than",
        duration: { type: "heart_rate_less_than", bpm: HR.oneForty },
        targetType: "heart_rate",
        target: {
          type: "heart_rate",
          value: { unit: "bpm", value: HR.oneFifty },
        },
      };

      // Act
      const result = calculateStepStats(step);

      // Assert
      expect(result.totalDuration).toBeNull();
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(true);
    });
  });

  describe("calculateRepetitionStats", () => {
    it("should calculate stats for repetition block with time steps", () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: REPEATS.three,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: TIME.sixty },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: POWER.twoFifty },
            },
          },
          {
            stepIndex: 1,
            durationType: "time",
            duration: { type: "time", seconds: TIME.oneHundredTwenty },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: POWER.oneFifty },
            },
          },
        ],
      };

      // Act
      const result = calculateRepetitionStats(block);

      // Assert
      expect(result.totalDuration).toBe(
        (TIME.sixty + TIME.oneHundredTwenty) * REPEATS.three
      );
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(false);
    });

    it("should calculate stats for repetition block with distance steps", () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: REPEATS.five,
        steps: [
          {
            stepIndex: 0,
            durationType: "distance",
            duration: { type: "distance", meters: DISTANCE.fourHundred },
            targetType: "pace",
            target: {
              type: "pace",
              value: { unit: "min_per_km", value: PACE.four },
            },
          },
          {
            stepIndex: 1,
            durationType: "distance",
            duration: { type: "distance", meters: DISTANCE.twoHundred },
            targetType: "pace",
            target: {
              type: "pace",
              value: { unit: "min_per_km", value: PACE.six },
            },
          },
        ],
      };

      // Act
      const result = calculateRepetitionStats(block);

      // Assert
      expect(result.totalDuration).toBeNull();
      expect(result.totalDistance).toBe(
        (DISTANCE.fourHundred + DISTANCE.twoHundred) * REPEATS.five
      );
      expect(result.hasOpenSteps).toBe(false);
    });

    it("should handle mixed duration types in repetition block", () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: REPEATS.two,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: TIME.threeHundred },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: POWER.twoHundred },
            },
          },
          {
            stepIndex: 1,
            durationType: "distance",
            duration: { type: "distance", meters: DISTANCE.oneThousand },
            targetType: "pace",
            target: {
              type: "pace",
              value: { unit: "min_per_km", value: PACE.five },
            },
          },
        ],
      };

      // Act
      const result = calculateRepetitionStats(block);

      // Assert
      expect(result.totalDuration).toBeNull();
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(false);
    });

    it("should mark repetition block with open steps", () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: REPEATS.four,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: TIME.oneHundredEighty },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: POWER.twoTwenty },
            },
          },
          {
            stepIndex: 1,
            durationType: "open",
            duration: { type: "open" },
            targetType: "open",
            target: { type: "open" },
          },
        ],
      };

      // Act
      const result = calculateRepetitionStats(block);

      // Assert
      expect(result.totalDuration).toBeNull();
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(true);
    });

    it("should handle single step in repetition block", () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: REPEATS.ten,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: TIME.thirty },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: POWER.threeHundred },
            },
          },
        ],
      };

      // Act
      const result = calculateRepetitionStats(block);

      // Assert
      expect(result.totalDuration).toBe(TIME.thirty * REPEATS.ten);
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(false);
    });

    it("should handle zero repeat count", () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: REPEATS.zero,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: TIME.sixty },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: POWER.twoHundred },
            },
          },
        ],
      };

      // Act
      const result = calculateRepetitionStats(block);

      // Assert
      expect(result.totalDuration).toBe(0);
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(false);
    });
  });
});
