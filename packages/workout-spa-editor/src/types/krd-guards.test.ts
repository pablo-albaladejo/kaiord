/**
 * KRD Type Guards Tests
 *
 * Tests for type guard functions that discriminate between KRD union types.
 *
 * Requirements:
 * - Requirement 4: Type guards for RepetitionBlock and WorkoutStep
 */

import { describe, expect, it } from "vitest";
import type { RepetitionBlock, WorkoutStep } from "./krd";
import { isRepetitionBlock, isWorkoutStep } from "./krd-guards";

describe("krd-guards", () => {
  describe("isRepetitionBlock", () => {
    it("should return true for valid RepetitionBlock", () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: 3,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 200 },
            },
          },
        ],
      };

      // Act
      const result = isRepetitionBlock(block);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for WorkoutStep", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: 200 },
        },
      };

      // Act
      const result = isRepetitionBlock(step);

      // Assert
      expect(result).toBe(false);
    });

    it("should return true for RepetitionBlock with multiple steps", () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: 5,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 60 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 250 },
            },
          },
          {
            stepIndex: 1,
            durationType: "time",
            duration: { type: "time", seconds: 120 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 150 },
            },
          },
        ],
      };

      // Act
      const result = isRepetitionBlock(block);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for RepetitionBlock with empty steps array", () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: 2,
        steps: [],
      };

      // Act
      const result = isRepetitionBlock(block);

      // Assert
      expect(result).toBe(true);
    });

    it("should correctly narrow type in conditional", () => {
      // Arrange
      const item: WorkoutStep | RepetitionBlock = {
        repeatCount: 3,
        steps: [
          {
            stepIndex: 0,
            durationType: "open",
            duration: { type: "open" },
            targetType: "open",
            target: { type: "open" },
          },
        ],
      };

      // Act & Assert
      if (isRepetitionBlock(item)) {
        // TypeScript should know item is RepetitionBlock here
        expect(item.repeatCount).toBe(3);
        expect(item.steps).toHaveLength(1);
      } else {
        // Should not reach here
        expect.fail("Should have been identified as RepetitionBlock");
      }
    });
  });

  describe("isWorkoutStep", () => {
    it("should return true for valid WorkoutStep", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "watts", value: 200 },
        },
      };

      // Act
      const result = isWorkoutStep(step);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for RepetitionBlock", () => {
      // Arrange
      const block: RepetitionBlock = {
        repeatCount: 3,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 200 },
            },
          },
        ],
      };

      // Act
      const result = isWorkoutStep(block);

      // Assert
      expect(result).toBe(false);
    });

    it("should return true for WorkoutStep with all optional fields", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 5,
        durationType: "distance",
        duration: { type: "distance", meters: 5000 },
        targetType: "pace",
        target: {
          type: "pace",
          value: { unit: "min_per_km", value: 4 },
        },
        intensity: "active",
        notes: "Steady pace",
      };

      // Act
      const result = isWorkoutStep(step);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for WorkoutStep with open duration", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "open",
        duration: { type: "open" },
        targetType: "open",
        target: { type: "open" },
      };

      // Act
      const result = isWorkoutStep(step);

      // Assert
      expect(result).toBe(true);
    });

    it("should correctly narrow type in conditional", () => {
      // Arrange
      const item: WorkoutStep | RepetitionBlock = {
        stepIndex: 2,
        durationType: "time",
        duration: { type: "time", seconds: 600 },
        targetType: "heart_rate",
        target: {
          type: "heart_rate",
          value: { unit: "bpm", value: 150 },
        },
      };

      // Act & Assert
      if (isWorkoutStep(item)) {
        // TypeScript should know item is WorkoutStep here
        expect(item.stepIndex).toBe(2);
        expect(item.duration).toEqual({ type: "time", seconds: 600 });
      } else {
        // Should not reach here
        expect.fail("Should have been identified as WorkoutStep");
      }
    });
  });

  describe("type guard mutual exclusivity", () => {
    it("should never return true for both guards on same object", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "open",
        target: { type: "open" },
      };

      const block: RepetitionBlock = {
        repeatCount: 2,
        steps: [step],
      };

      // Act & Assert
      expect(isWorkoutStep(step)).toBe(true);
      expect(isRepetitionBlock(step)).toBe(false);

      expect(isRepetitionBlock(block)).toBe(true);
      expect(isWorkoutStep(block)).toBe(false);
    });

    it("should handle union type correctly in array", () => {
      // Arrange
      const items: Array<WorkoutStep | RepetitionBlock> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          repeatCount: 3,
          steps: [
            {
              stepIndex: 1,
              durationType: "time",
              duration: { type: "time", seconds: 60 },
              targetType: "open",
              target: { type: "open" },
            },
          ],
        },
        {
          stepIndex: 2,
          durationType: "distance",
          duration: { type: "distance", meters: 1000 },
          targetType: "open",
          target: { type: "open" },
        },
      ];

      // Act
      const steps = items.filter(isWorkoutStep);
      const blocks = items.filter(isRepetitionBlock);

      // Assert
      expect(steps).toHaveLength(2);
      expect(blocks).toHaveLength(1);
      expect(steps[0].stepIndex).toBe(0);
      expect(steps[1].stepIndex).toBe(2);
      expect(blocks[0].repeatCount).toBe(3);
    });
  });
});
