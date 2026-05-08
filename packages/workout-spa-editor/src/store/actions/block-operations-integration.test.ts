/**
 * Block Operations Integration Tests
 *
 * Integration tests for ID-based block operations.
 *
 * Requirements:
 * - Requirement 2.4: Use block ID for operations
 * - Requirement 2.5: Ensure correct blocks are affected
 */

import { describe, expect, it } from "vitest";

import type { KRD, RepetitionBlock, WorkoutStep } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { addStepToRepetitionBlockAction } from "./add-step-to-repetition-block-action";
import {
  EDITED_REPEAT_COUNT_TEN,
  ORIGINAL_REPEAT_COUNT_FIVE,
  ORIGINAL_REPEAT_COUNT_FOUR,
  STEP_COUNT_THREE,
} from "./block-operations-integration.test-fixtures";
import { editRepetitionBlockAction } from "./edit-repetition-block-action";
import { ungroupRepetitionBlockAction } from "./ungroup-repetition-block-action";

describe("Block Operations Integration", () => {
  const createMockState = (): WorkoutState => ({
    currentWorkout: null,
    undoHistory: [],
    historyIndex: -1,
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
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

  const createMockKRD = (steps: Array<WorkoutStep | RepetitionBlock>): KRD => ({
    version: "1.0",
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      structured_workout: {
        name: "Test Workout",
        sport: "running",
        steps,
      },
    },
  });

  describe("ID-based operations", () => {
    it("should edit correct block by ID", () => {
      // Arrange
      const step1 = createMockStep(0);
      const blockId1 = "block-1";
      const blockId2 = "block-2";
      const block1: RepetitionBlock = {
        id: blockId1,
        repeatCount: 3,
        steps: [step1],
      };
      const block2: RepetitionBlock = {
        id: blockId2,
        repeatCount: ORIGINAL_REPEAT_COUNT_FIVE,
        steps: [step1],
      };
      const krd = createMockKRD([block1, block2]);
      const state = createMockState();
      const result = editRepetitionBlockAction(
        krd,
        blockId1,
        EDITED_REPEAT_COUNT_TEN,
        state
      );
      const updatedWorkout =
        result.currentWorkout?.extensions?.structured_workout;
      expect(updatedWorkout?.steps).toHaveLength(2);
      const updatedBlock1 = updatedWorkout?.steps[0] as RepetitionBlock;

      // Act
      const updatedBlock2 = updatedWorkout?.steps[1] as RepetitionBlock;

      // Assert
      expect(updatedBlock1.repeatCount).toBe(EDITED_REPEAT_COUNT_TEN);
      expect(updatedBlock2.repeatCount).toBe(ORIGINAL_REPEAT_COUNT_FIVE);
    });

    it("should add step to correct block by ID", () => {
      // Arrange
      const step1 = createMockStep(0);
      const blockId1 = "block-1";
      const blockId2 = "block-2";
      const block1: RepetitionBlock = {
        id: blockId1,
        repeatCount: 3,
        steps: [step1],
      };
      const block2: RepetitionBlock = {
        id: blockId2,
        repeatCount: ORIGINAL_REPEAT_COUNT_FIVE,
        steps: [step1],
      };
      const krd = createMockKRD([block1, block2]);
      const state = createMockState();
      const result = addStepToRepetitionBlockAction(krd, blockId2, state);
      const updatedWorkout =
        result.currentWorkout?.extensions?.structured_workout;
      expect(updatedWorkout?.steps).toHaveLength(2);
      const updatedBlock1 = updatedWorkout?.steps[0] as RepetitionBlock;

      // Act
      const updatedBlock2 = updatedWorkout?.steps[1] as RepetitionBlock;

      // Assert
      expect(updatedBlock1.steps).toHaveLength(1);
      expect(updatedBlock2.steps).toHaveLength(2);
    });

    it("should ungroup correct block by ID", () => {
      // Arrange
      const step1 = createMockStep(0);
      const step2 = createMockStep(1);
      const blockId1 = "block-1";
      const blockId2 = "block-2";
      const block1: RepetitionBlock = {
        id: blockId1,
        repeatCount: 3,
        steps: [step1],
      };
      const block2: RepetitionBlock = {
        id: blockId2,
        repeatCount: ORIGINAL_REPEAT_COUNT_FIVE,
        steps: [step2],
      };
      const krd = createMockKRD([block1, block2]);
      const state = createMockState();
      const result = ungroupRepetitionBlockAction(krd, blockId1, state);

      // Act
      const updatedWorkout =
        result.currentWorkout?.extensions?.structured_workout;

      // Assert
      expect(updatedWorkout?.steps).toHaveLength(2);
      expect((updatedWorkout?.steps[0] as WorkoutStep).stepIndex).toBe(0);
      expect((updatedWorkout?.steps[1] as RepetitionBlock).id).toBe(blockId2);
    });

    it("should not affect other blocks when operating by ID", () => {
      // Arrange
      const step1 = createMockStep(0);
      const blockId1 = "block-1";
      const blockId2 = "block-2";
      const blockId3 = "block-3";
      const block1: RepetitionBlock = {
        id: blockId1,
        repeatCount: 2,
        steps: [step1],
      };
      const block2: RepetitionBlock = {
        id: blockId2,
        repeatCount: STEP_COUNT_THREE,
        steps: [step1],
      };
      const block3: RepetitionBlock = {
        id: blockId3,
        repeatCount: ORIGINAL_REPEAT_COUNT_FOUR,
        steps: [step1],
      };
      const krd = createMockKRD([block1, block2, block3]);
      const state = createMockState();
      const result = editRepetitionBlockAction(
        krd,
        blockId2,
        EDITED_REPEAT_COUNT_TEN,
        state
      );

      // Act
      const updatedWorkout =
        result.currentWorkout?.extensions?.structured_workout;

      // Assert
      expect(updatedWorkout?.steps).toHaveLength(STEP_COUNT_THREE);
      expect((updatedWorkout?.steps[0] as RepetitionBlock).repeatCount).toBe(2);
      expect((updatedWorkout?.steps[1] as RepetitionBlock).repeatCount).toBe(
        EDITED_REPEAT_COUNT_TEN
      );
      expect((updatedWorkout?.steps[2] as RepetitionBlock).repeatCount).toBe(
        ORIGINAL_REPEAT_COUNT_FOUR
      );
    });
  });

  describe("error handling", () => {
    it("should return empty object when block ID not found", () => {
      // Arrange
      const step1 = createMockStep(0);
      const krd = createMockKRD([step1]);
      const state = createMockState();
      const editResult = editRepetitionBlockAction(
        krd,
        "nonexistent-id",
        EDITED_REPEAT_COUNT_TEN,
        state
      );
      const addResult = addStepToRepetitionBlockAction(
        krd,
        "nonexistent-id",
        state
      );

      // Act
      const ungroupResult = ungroupRepetitionBlockAction(
        krd,
        "nonexistent-id",
        state
      );

      // Assert
      expect(editResult).toEqual({});
      expect(addResult).toEqual({});
      expect(ungroupResult).toEqual({});
    });
  });
});
