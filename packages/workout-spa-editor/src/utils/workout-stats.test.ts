/**
 * Workout Statistics Tests
 *
 * Tests for comprehensive workout statistics calculations.
 */

import { describe, expect, it } from "vitest";
import type { RepetitionBlock, Workout } from "../types/krd";
import { calculateWorkoutStats } from "./workout-stats";

describe("workout-stats", () => {
  describe("calculateWorkoutStats", () => {
    it("should return null stats for null workout", () => {
      // Arrange & Act
      const result = calculateWorkoutStats(null);

      // Assert
      expect(result.totalDuration).toBeNull();
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(false);
      expect(result.stepCount).toBe(0);
      expect(result.repetitionCount).toBe(0);
    });

    it("should return null stats for workout with no steps", () => {
      // Arrange
      const workout: Workout = {
        sport: "running",
        steps: [],
      };

      // Act
      const result = calculateWorkoutStats(workout);

      // Assert
      expect(result.totalDuration).toBeNull();
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(false);
      expect(result.stepCount).toBe(0);
      expect(result.repetitionCount).toBe(0);
    });

    it("should calculate stats for workout with time-based steps", () => {
      // Arrange
      const workout: Workout = {
        sport: "cycling",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 150 } },
          },
          {
            stepIndex: 1,
            durationType: "time",
            duration: { type: "time", seconds: 600 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 200 } },
          },
        ],
      };

      // Act
      const result = calculateWorkoutStats(workout);

      // Assert
      expect(result.totalDuration).toBe(900);
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(false);
      expect(result.stepCount).toBe(2);
      expect(result.repetitionCount).toBe(0);
    });

    it("should calculate stats for workout with distance-based steps", () => {
      // Arrange
      const workout: Workout = {
        sport: "running",
        steps: [
          {
            stepIndex: 0,
            durationType: "distance",
            duration: { type: "distance", meters: 1000 },
            targetType: "pace",
            target: { type: "pace", value: { unit: "min_per_km", value: 5 } },
          },
          {
            stepIndex: 1,
            durationType: "distance",
            duration: { type: "distance", meters: 2000 },
            targetType: "pace",
            target: { type: "pace", value: { unit: "min_per_km", value: 4 } },
          },
        ],
      };

      // Act
      const result = calculateWorkoutStats(workout);

      // Assert
      expect(result.totalDuration).toBeNull();
      expect(result.totalDistance).toBe(3000);
      expect(result.hasOpenSteps).toBe(false);
      expect(result.stepCount).toBe(2);
      expect(result.repetitionCount).toBe(0);
    });

    it("should calculate stats for workout with repetition blocks", () => {
      // Arrange
      const workout: Workout = {
        sport: "cycling",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 100 } },
          },
          {
            repeatCount: 3,
            steps: [
              {
                stepIndex: 1,
                durationType: "time",
                duration: { type: "time", seconds: 60 },
                targetType: "power",
                target: { type: "power", value: { unit: "watts", value: 250 } },
              },
              {
                stepIndex: 2,
                durationType: "time",
                duration: { type: "time", seconds: 120 },
                targetType: "power",
                target: { type: "power", value: { unit: "watts", value: 150 } },
              },
            ],
          } as RepetitionBlock,
          {
            stepIndex: 3,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 100 } },
          },
        ],
      };

      // Act
      const result = calculateWorkoutStats(workout);

      // Assert
      expect(result.totalDuration).toBe(300 + (60 + 120) * 3 + 300);
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(false);
      expect(result.stepCount).toBe(8); // 1 + (2 * 3) + 1
      expect(result.repetitionCount).toBe(1);
    });

    it("should handle workout with open steps", () => {
      // Arrange
      const workout: Workout = {
        sport: "running",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 150 } },
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
      const result = calculateWorkoutStats(workout);

      // Assert
      expect(result.totalDuration).toBeNull();
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(true);
      expect(result.stepCount).toBe(2);
      expect(result.repetitionCount).toBe(0);
    });

    it("should handle mixed duration types", () => {
      // Arrange
      const workout: Workout = {
        sport: "triathlon",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 600 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 200 } },
          },
          {
            stepIndex: 1,
            durationType: "distance",
            duration: { type: "distance", meters: 5000 },
            targetType: "pace",
            target: { type: "pace", value: { unit: "min_per_km", value: 4 } },
          },
        ],
      };

      // Act
      const result = calculateWorkoutStats(workout);

      // Assert
      expect(result.totalDuration).toBeNull();
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(false);
      expect(result.stepCount).toBe(2);
      expect(result.repetitionCount).toBe(0);
    });

    it("should count steps correctly with multiple repetition blocks", () => {
      // Arrange
      const workout: Workout = {
        sport: "running",
        steps: [
          {
            repeatCount: 2,
            steps: [
              {
                stepIndex: 0,
                durationType: "time",
                duration: { type: "time", seconds: 60 },
                targetType: "pace",
                target: {
                  type: "pace",
                  value: { unit: "min_per_km", value: 4 },
                },
              },
            ],
          } as RepetitionBlock,
          {
            repeatCount: 3,
            steps: [
              {
                stepIndex: 1,
                durationType: "time",
                duration: { type: "time", seconds: 120 },
                targetType: "pace",
                target: {
                  type: "pace",
                  value: { unit: "min_per_km", value: 5 },
                },
              },
            ],
          } as RepetitionBlock,
        ],
      };

      // Act
      const result = calculateWorkoutStats(workout);

      // Assert
      expect(result.totalDuration).toBe(60 * 2 + 120 * 3);
      expect(result.stepCount).toBe(5); // (1 * 2) + (1 * 3)
      expect(result.repetitionCount).toBe(2);
    });

    it("should handle complex workout structure", () => {
      // Arrange
      const workout: Workout = {
        name: "Complex Workout",
        sport: "cycling",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 600 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 100 } },
          },
          {
            repeatCount: 5,
            steps: [
              {
                stepIndex: 1,
                durationType: "time",
                duration: { type: "time", seconds: 30 },
                targetType: "power",
                target: { type: "power", value: { unit: "watts", value: 300 } },
              },
              {
                stepIndex: 2,
                durationType: "time",
                duration: { type: "time", seconds: 90 },
                targetType: "power",
                target: { type: "power", value: { unit: "watts", value: 150 } },
              },
            ],
          } as RepetitionBlock,
          {
            stepIndex: 3,
            durationType: "open",
            duration: { type: "open" },
            targetType: "open",
            target: { type: "open" },
          },
          {
            stepIndex: 4,
            durationType: "time",
            duration: { type: "time", seconds: 600 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 100 } },
          },
        ],
      };

      // Act
      const result = calculateWorkoutStats(workout);

      // Assert
      expect(result.totalDuration).toBeNull(); // Has open step
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(true);
      expect(result.stepCount).toBe(13); // 1 + (2 * 5) + 1 + 1
      expect(result.repetitionCount).toBe(1);
    });
  });
});
