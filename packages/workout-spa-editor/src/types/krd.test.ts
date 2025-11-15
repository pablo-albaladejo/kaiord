/**
 * Type Guards Tests
 *
 * Tests for WorkoutStep and RepetitionBlock type guards.
 */

import { describe, expect, it } from "vitest";
import type { RepetitionBlock, WorkoutStep } from "./krd";
import { isRepetitionBlock, isWorkoutStep } from "./krd";

describe("Type Guards", () => {
  describe("isWorkoutStep", () => {
    it("should return true for WorkoutStep", () => {
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

      expect(isWorkoutStep(step)).toBe(true);
    });

    it("should return false for RepetitionBlock", () => {
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

      expect(isWorkoutStep(block)).toBe(false);
    });
  });

  describe("isRepetitionBlock", () => {
    it("should return true for RepetitionBlock", () => {
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

      expect(isRepetitionBlock(block)).toBe(true);
    });

    it("should return false for WorkoutStep", () => {
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

      expect(isRepetitionBlock(step)).toBe(false);
    });
  });

  describe("Type narrowing", () => {
    it("should narrow type correctly in conditional", () => {
      const items: Array<WorkoutStep | RepetitionBlock> = [
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
        {
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
        },
      ];

      const steps = items.filter(isWorkoutStep);
      const blocks = items.filter(isRepetitionBlock);

      expect(steps).toHaveLength(1);
      expect(blocks).toHaveLength(1);

      // TypeScript should infer correct types
      expect(steps[0].stepIndex).toBe(0);
      expect(blocks[0].repeatCount).toBe(3);
    });
  });
});
