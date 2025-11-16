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

describe("workout-stats-helpers", () => {
  describe("calculateStepStats", () => {
    it("should calculate stats for time-based step", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: { type: "power", value: { unit: "watts", value: 200 } },
      };

      // Act
      const result = calculateStepStats(step);

      // Assert
      expect(result.totalDuration).toBe(300);
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(false);
    });

    it("should calculate stats for distance-based step", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "distance",
        duration: { type: "distance", meters: 1000 },
        targetType: "pace",
        target: { type: "pace", value: { unit: "min_per_km", value: 5 } },
      };

      // Act
      const result = calculateStepStats(step);

      // Assert
      expect(result.totalDuration).toBeNull();
      expect(result.totalDistance).toBe(1000);
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
        duration: { type: "heart_rate_less_than", bpm: 140 },
        targetType: "heart_rate",
        target: { type: "heart_rate", value: { unit: "bpm", value: 150 } },
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
        repeatCount: 3,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 60 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 250 } },
          },
          {
            stepIndex: 1,
            durationType: "time",
            duration: { type: "time", seconds: 120 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 150 } },
          },
        ],
      };

      // Act
      const result = calculateRepetitionStats(block);

      // Assert
      expect(result.totalDuration).toBe((60 + 120) * 3);
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(false);
    });

    it("should calculate stats for repetition block with distance steps", () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: 5,
        steps: [
          {
            stepIndex: 0,
            durationType: "distance",
            duration: { type: "distance", meters: 400 },
            targetType: "pace",
            target: { type: "pace", value: { unit: "min_per_km", value: 4 } },
          },
          {
            stepIndex: 1,
            durationType: "distance",
            duration: { type: "distance", meters: 200 },
            targetType: "pace",
            target: { type: "pace", value: { unit: "min_per_km", value: 6 } },
          },
        ],
      };

      // Act
      const result = calculateRepetitionStats(block);

      // Assert
      expect(result.totalDuration).toBeNull();
      expect(result.totalDistance).toBe((400 + 200) * 5);
      expect(result.hasOpenSteps).toBe(false);
    });

    it("should handle mixed duration types in repetition block", () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: 2,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 200 } },
          },
          {
            stepIndex: 1,
            durationType: "distance",
            duration: { type: "distance", meters: 1000 },
            targetType: "pace",
            target: { type: "pace", value: { unit: "min_per_km", value: 5 } },
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
        repeatCount: 4,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 180 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 220 } },
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
        repeatCount: 10,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 30 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 300 } },
          },
        ],
      };

      // Act
      const result = calculateRepetitionStats(block);

      // Assert
      expect(result.totalDuration).toBe(30 * 10);
      expect(result.totalDistance).toBeNull();
      expect(result.hasOpenSteps).toBe(false);
    });

    it("should handle zero repeat count", () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: 0,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 60 },
            targetType: "power",
            target: { type: "power", value: { unit: "watts", value: 200 } },
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
