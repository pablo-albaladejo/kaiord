import type { Logger } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import type {
  ParsedExecutableStep,
  ParsedRepeatGroup,
} from "../schemas/garmin-workout-parse.schema";
import type { ParsedSegment } from "./flatten-segments.converter";
import { flattenSegmentsToSteps } from "./flatten-segments.converter";

const createLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const buildExecutableStep = (
  overrides?: Partial<ParsedExecutableStep>
): ParsedExecutableStep => ({
  type: "ExecutableStepDTO",
  stepType: { stepTypeKey: "interval" },
  endCondition: { conditionTypeKey: "time" },
  endConditionValue: 300,
  targetType: { workoutTargetTypeKey: "no.target" },
  ...overrides,
});

const buildRepeatGroup = (
  steps: Array<ParsedExecutableStep | ParsedRepeatGroup>,
  iterations = 3
): ParsedRepeatGroup => ({
  type: "RepeatGroupDTO",
  numberOfIterations: iterations,
  workoutSteps: steps,
});

describe("flattenSegmentsToSteps", () => {
  describe("empty segments", () => {
    it("should return empty array for empty segments", () => {
      // Arrange
      const logger = createLogger();

      // Act
      const result = flattenSegmentsToSteps([], logger);

      // Assert
      expect(result).toStrictEqual([]);
    });

    it("should return empty array for segment with no workoutSteps", () => {
      // Arrange
      const logger = createLogger();
      const segments: ParsedSegment[] = [{}];

      // Act
      const result = flattenSegmentsToSteps(segments, logger);

      // Assert
      expect(result).toStrictEqual([]);
    });
  });

  describe("executable steps", () => {
    it("should map a single executable step", () => {
      // Arrange
      const logger = createLogger();
      const segments: ParsedSegment[] = [
        {
          workoutSteps: [
            buildExecutableStep({
              endCondition: { conditionTypeKey: "time" },
              endConditionValue: 300,
            }),
          ],
        },
      ];

      // Act
      const result = flattenSegmentsToSteps(segments, logger);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
      });
    });

    it("should assign sequential stepIndex across multiple steps", () => {
      // Arrange
      const logger = createLogger();
      const segments: ParsedSegment[] = [
        {
          workoutSteps: [
            buildExecutableStep({ endConditionValue: 300 }),
            buildExecutableStep({ endConditionValue: 600 }),
          ],
        },
      ];

      // Act
      const result = flattenSegmentsToSteps(segments, logger);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ stepIndex: 0 });
      expect(result[1]).toMatchObject({ stepIndex: 1 });
    });

    it("should handle multiple segments", () => {
      // Arrange
      const logger = createLogger();
      const segments: ParsedSegment[] = [
        {
          workoutSteps: [buildExecutableStep({ endConditionValue: 300 })],
        },
        {
          workoutSteps: [buildExecutableStep({ endConditionValue: 600 })],
        },
      ];

      // Act
      const result = flattenSegmentsToSteps(segments, logger);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ stepIndex: 0 });
      expect(result[1]).toMatchObject({ stepIndex: 1 });
    });
  });

  describe("repeat groups", () => {
    it("should map a repeat group with executable steps", () => {
      // Arrange
      const logger = createLogger();
      const segments: ParsedSegment[] = [
        {
          workoutSteps: [
            buildRepeatGroup(
              [
                buildExecutableStep({ endConditionValue: 60 }),
                buildExecutableStep({ endConditionValue: 120 }),
              ],
              5
            ),
          ],
        },
      ];
      const result = flattenSegmentsToSteps(segments, logger);
      expect(result).toHaveLength(1);

      // Act
      const block = result[0];

      // Assert
      expect("repeatCount" in block).toBe(true);
      if ("repeatCount" in block) {
        expect(block.repeatCount).toBe(5);
        expect(block.steps).toHaveLength(2);
      }
    });

    it("should correctly track stepIndex after repeat group", () => {
      // Arrange
      const logger = createLogger();
      const segments: ParsedSegment[] = [
        {
          workoutSteps: [
            buildRepeatGroup(
              [
                buildExecutableStep({ endConditionValue: 60 }),
                buildExecutableStep({ endConditionValue: 120 }),
              ],
              3
            ),
            buildExecutableStep({ endConditionValue: 300 }),
          ],
        },
      ];
      const result = flattenSegmentsToSteps(segments, logger);
      expect(result).toHaveLength(2);

      // Act
      const lastStep = result[1];

      // Assert
      expect("stepIndex" in lastStep).toBe(true);
      if ("stepIndex" in lastStep) {
        expect(lastStep.stepIndex).toBe(2);
      }
    });
  });

  describe("nested repeat groups", () => {
    it("should flatten nested repeat groups and log a warning", () => {
      // Arrange
      const logger = createLogger();
      const nestedGroup = buildRepeatGroup(
        [buildExecutableStep({ endConditionValue: 30 })],
        2
      );
      const outerGroup = buildRepeatGroup([nestedGroup], 3);
      const segments: ParsedSegment[] = [
        {
          workoutSteps: [outerGroup],
        },
      ];
      const result = flattenSegmentsToSteps(segments, logger);
      expect(result).toHaveLength(1);
      expect(logger.warn).toHaveBeenCalledWith(
        "Nested repeat groups are flattened",
        { iterations: 2 }
      );

      // Act
      const block = result[0];

      // Assert
      if ("repeatCount" in block) {
        expect(block.repeatCount).toBe(3);
        // Nested group steps should be flattened into outer
        expect(block.steps).toHaveLength(1);
      }
    });
  });

  describe("mixed steps", () => {
    it("should handle mix of executable steps and repeat groups", () => {
      // Arrange
      const logger = createLogger();
      const segments: ParsedSegment[] = [
        {
          workoutSteps: [
            buildExecutableStep({
              stepType: { stepTypeKey: "warmup" },
              endConditionValue: 300,
            }),
            buildRepeatGroup(
              [
                buildExecutableStep({ endConditionValue: 60 }),
                buildExecutableStep({ endConditionValue: 120 }),
              ],
              4
            ),
            buildExecutableStep({
              stepType: { stepTypeKey: "cooldown" },
              endConditionValue: 300,
            }),
          ],
        },
      ];

      // Act
      const result = flattenSegmentsToSteps(segments, logger);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ stepIndex: 0, intensity: "warmup" });
      expect("repeatCount" in result[1]).toBe(true);
      expect(result[2]).toMatchObject({ stepIndex: 3, intensity: "cooldown" });
    });
  });
});
