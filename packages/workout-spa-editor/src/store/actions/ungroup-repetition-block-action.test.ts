/**
 * Ungroup Repetition Block Action Tests
 *
 * Tests for ungrouping repetition blocks back into individual steps.
 *
 * Requirements:
 * - Requirement 7.4: Ungroup repetition blocks
 */

import { describe, expect, it } from "vitest";
import type { KRD, RepetitionBlock, WorkoutStep } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { ungroupRepetitionBlockAction } from "./ungroup-repetition-block-action";

describe("ungroupRepetitionBlockAction", () => {
  const createMockState = (): WorkoutState => ({
    currentWorkout: null,
    workoutHistory: [],
    historyIndex: -1,
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
  });

  const createMockKRD = (steps: Array<WorkoutStep | RepetitionBlock>): KRD => ({
    version: "1.0",
    type: "workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      workout: {
        name: "Test Workout",
        sport: "running",
        steps,
      },
    },
  });

  const createMockStep = (stepIndex: number): WorkoutStep => ({
    stepIndex,
    durationType: "time",
    duration: { type: "time", seconds: 300 },
    targetType: "power",
    target: {
      type: "power",
      value: { unit: "watts", value: 200 },
    },
  });

  describe("basic ungroup functionality", () => {
    it("should extract steps from a repetition block", () => {
      // Arrange
      const step1 = createMockStep(0);
      const step2 = createMockStep(1);
      const repetitionBlock: RepetitionBlock = {
        repeatCount: 3,
        steps: [step1, step2],
      };
      const step3 = createMockStep(2);

      const krd = createMockKRD([repetitionBlock, step3]);
      const state = createMockState();

      // Act
      const result = ungroupRepetitionBlockAction(krd, 0, state);

      // Assert
      expect(result.currentWorkout).toBeDefined();
      const updatedWorkout = result.currentWorkout?.extensions?.workout;
      expect(updatedWorkout?.steps).toHaveLength(3);
      expect(updatedWorkout?.steps[0]).toEqual({ ...step1, stepIndex: 0 });
      expect(updatedWorkout?.steps[1]).toEqual({ ...step2, stepIndex: 1 });
      expect(updatedWorkout?.steps[2]).toEqual({ ...step3, stepIndex: 2 });
    });

    it("should recalculate step indices after ungrouping", () => {
      // Arrange
      const step1 = createMockStep(0);
      const step2 = createMockStep(1);
      const repetitionBlock: RepetitionBlock = {
        repeatCount: 2,
        steps: [step1, step2],
      };
      const step3 = createMockStep(2);
      const step4 = createMockStep(3);

      const krd = createMockKRD([step3, repetitionBlock, step4]);
      const state = createMockState();

      // Act
      const result = ungroupRepetitionBlockAction(krd, 1, state);

      // Assert
      const updatedWorkout = result.currentWorkout?.extensions?.workout;
      expect(updatedWorkout?.steps).toHaveLength(4);
      expect(updatedWorkout?.steps[0]).toMatchObject({ stepIndex: 0 });
      expect(updatedWorkout?.steps[1]).toMatchObject({ stepIndex: 1 });
      expect(updatedWorkout?.steps[2]).toMatchObject({ stepIndex: 2 });
      expect(updatedWorkout?.steps[3]).toMatchObject({ stepIndex: 3 });
    });

    it("should preserve step data when ungrouping", () => {
      // Arrange
      const step1: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 600 },
        targetType: "heart_rate",
        target: {
          type: "heart_rate",
          value: { unit: "bpm", value: 150 },
        },
        intensity: "active",
        notes: "Test note",
      };
      const step2: WorkoutStep = {
        stepIndex: 1,
        durationType: "distance",
        duration: { type: "distance", meters: 1000 },
        targetType: "pace",
        target: {
          type: "pace",
          value: { unit: "min_per_km", value: 5 },
        },
      };

      const repetitionBlock: RepetitionBlock = {
        repeatCount: 4,
        steps: [step1, step2],
      };

      const krd = createMockKRD([repetitionBlock]);
      const state = createMockState();

      // Act
      const result = ungroupRepetitionBlockAction(krd, 0, state);

      // Assert
      const updatedWorkout = result.currentWorkout?.extensions?.workout;
      expect(updatedWorkout?.steps).toHaveLength(2);

      const extractedStep1 = updatedWorkout?.steps[0] as WorkoutStep;
      expect(extractedStep1.duration).toEqual({ type: "time", seconds: 600 });
      expect(extractedStep1.target).toEqual({
        type: "heart_rate",
        value: { unit: "bpm", value: 150 },
      });
      expect(extractedStep1.intensity).toBe("active");
      expect(extractedStep1.notes).toBe("Test note");

      const extractedStep2 = updatedWorkout?.steps[1] as WorkoutStep;
      expect(extractedStep2.duration).toEqual({
        type: "distance",
        meters: 1000,
      });
      expect(extractedStep2.target).toEqual({
        type: "pace",
        value: { unit: "min_per_km", value: 5 },
      });
    });
  });

  describe("edge cases", () => {
    it("should return empty object when KRD has no workout extension", () => {
      // Arrange
      const krd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
      };
      const state = createMockState();

      // Act
      const result = ungroupRepetitionBlockAction(krd, 0, state);

      // Assert
      expect(result).toEqual({});
    });

    it("should return empty object when block index is out of bounds", () => {
      // Arrange
      const step1 = createMockStep(0);
      const krd = createMockKRD([step1]);
      const state = createMockState();

      // Act
      const result = ungroupRepetitionBlockAction(krd, 5, state);

      // Assert
      expect(result).toEqual({});
    });

    it("should return empty object when target is not a repetition block", () => {
      // Arrange
      const step1 = createMockStep(0);
      const step2 = createMockStep(1);
      const krd = createMockKRD([step1, step2]);
      const state = createMockState();

      // Act
      const result = ungroupRepetitionBlockAction(krd, 0, state);

      // Assert
      expect(result).toEqual({});
    });

    it("should handle ungrouping a block with single step", () => {
      // Arrange
      const step1 = createMockStep(0);
      const repetitionBlock: RepetitionBlock = {
        repeatCount: 5,
        steps: [step1],
      };

      const krd = createMockKRD([repetitionBlock]);
      const state = createMockState();

      // Act
      const result = ungroupRepetitionBlockAction(krd, 0, state);

      // Assert
      const updatedWorkout = result.currentWorkout?.extensions?.workout;
      expect(updatedWorkout?.steps).toHaveLength(1);
      expect(updatedWorkout?.steps[0]).toEqual({ ...step1, stepIndex: 0 });
    });

    it("should handle ungrouping when block is at the end", () => {
      // Arrange
      const step1 = createMockStep(0);
      const step2 = createMockStep(1);
      const step3 = createMockStep(2);
      const repetitionBlock: RepetitionBlock = {
        repeatCount: 2,
        steps: [step2, step3],
      };

      const krd = createMockKRD([step1, repetitionBlock]);
      const state = createMockState();

      // Act
      const result = ungroupRepetitionBlockAction(krd, 1, state);

      // Assert
      const updatedWorkout = result.currentWorkout?.extensions?.workout;
      expect(updatedWorkout?.steps).toHaveLength(3);
      expect(updatedWorkout?.steps[0]).toMatchObject({ stepIndex: 0 });
      expect(updatedWorkout?.steps[1]).toMatchObject({ stepIndex: 1 });
      expect(updatedWorkout?.steps[2]).toMatchObject({ stepIndex: 2 });
    });
  });

  describe("history management", () => {
    it("should add ungrouped workout to history", () => {
      // Arrange
      const step1 = createMockStep(0);
      const step2 = createMockStep(1);
      const repetitionBlock: RepetitionBlock = {
        repeatCount: 3,
        steps: [step1, step2],
      };

      const krd = createMockKRD([repetitionBlock]);
      const state: WorkoutState = {
        ...createMockState(),
        currentWorkout: krd,
        workoutHistory: [krd],
        historyIndex: 0,
      };

      // Act
      const result = ungroupRepetitionBlockAction(krd, 0, state);

      // Assert
      expect(result.workoutHistory).toBeDefined();
      expect(result.workoutHistory?.length).toBe(2);
      expect(result.historyIndex).toBe(1);
    });
  });
});
