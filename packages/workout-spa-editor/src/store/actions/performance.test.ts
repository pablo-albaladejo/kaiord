/**
 * Functional Tests for Core Operations
 *
 * Exercises critical store operations against larger workouts:
 * - Block deletion (result shape + step-index recalculation)
 * - Undo operations (history navigation + boundary no-op)
 * - Combined delete + undo flows
 *
 * Requirements: Task 15.1
 */

import { describe, expect, it } from "vitest";

import type {
  KRD,
  RepetitionBlock,
  Workout,
  WorkoutStep,
} from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { deleteRepetitionBlockAction } from "./delete-repetition-block-action";
import { createUndoAction } from "./history-actions";

// Workout-step factory base values
const DEFAULT_DURATION_BASE_SEC = 300;
const DURATION_INCREMENT_SEC = 10;
const DEFAULT_POWER_BASE_W = 200;

// Random-id radix scaffolding (Math.random().toString(36).substr(2, 9))
const RANDOM_ID_RADIX = 36;
const RANDOM_ID_OFFSET = 2;
const RANDOM_ID_LEN = 9;

// Block-scaffold sizes
const BLOCK_SCAFFOLD_NESTED_STEPS = 10;
const BLOCK_SCAFFOLD_NESTED_REPS = 3;
const BLOCK_SCAFFOLD_LARGE_STEPS = 50;
const BLOCK_SCAFFOLD_LARGE_REPS = 5;
const BLOCK_SCAFFOLD_MEDIUM_STEPS = 20;
const BLOCK_SCAFFOLD_MEDIUM_REPS = 3;
const BLOCK_SCAFFOLD_DELETE_INDEX_STEPS = 30;
const BLOCK_SCAFFOLD_DELETE_INDEX_REPS = 2;
const BLOCK_SCAFFOLD_UNDO_LARGE_STEPS = 30;
const BLOCK_SCAFFOLD_UNDO_LARGE_REPS = 3;

// Workout-scaffold list sizes
const MANY_STEPS_COUNT = 50;
const INDICES_TEST_INSERT_INDEX = 50;
const PRE_DELETE_LIST_LENGTH = 100;
const HISTORY_DEPTH = 50;
const HISTORY_LAST_INDEX = 49;
const UNDO_BATCH_COUNT = 10;
const NESTED_BLOCKS_COUNT = 5;
const NESTED_DELETE_LOOP_COUNT = 3;

describe("Core Operations", () => {
  const createMockKrd = (steps: Array<WorkoutStep | RepetitionBlock>): KRD => ({
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

  const createWorkoutStep = (index: number): WorkoutStep => ({
    stepIndex: index,
    durationType: "time",
    duration: {
      type: "time",
      seconds: DEFAULT_DURATION_BASE_SEC + index * DURATION_INCREMENT_SEC,
    },
    targetType: "power",
    target: {
      type: "power",
      value: { unit: "watts", value: DEFAULT_POWER_BASE_W + index },
    },
  });

  const createRepetitionBlock = (
    stepCount: number,
    repeatCount: number
  ): RepetitionBlock => ({
    id: `block-${Date.now()}-${Math.random()
      .toString(RANDOM_ID_RADIX)
      .substr(RANDOM_ID_OFFSET, RANDOM_ID_LEN)}`,
    repeatCount,
    steps: Array.from({ length: stepCount }, (_, i) => createWorkoutStep(i)),
  });

  const createMockState = (krd: KRD): WorkoutState => ({
    currentWorkout: krd,
    undoHistory: [{ workout: krd, selection: null }],
    historyIndex: 0,
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
  });

  describe("block deletion", () => {
    it("should delete a small block", () => {
      // Arrange
      const block = createRepetitionBlock(
        BLOCK_SCAFFOLD_NESTED_STEPS,
        BLOCK_SCAFFOLD_NESTED_REPS
      );
      const krd = createMockKrd([
        createWorkoutStep(0),
        block,
        createWorkoutStep(1),
      ]);
      const state = createMockState(krd);

      // Act
      const result = deleteRepetitionBlockAction(krd, block.id!, state);

      // Assert
      expect(result.currentWorkout).toBeDefined();
    });

    it("should delete a large block", () => {
      // Arrange
      const largeBlock = createRepetitionBlock(
        BLOCK_SCAFFOLD_LARGE_STEPS,
        BLOCK_SCAFFOLD_LARGE_REPS
      );
      const krd = createMockKrd([
        createWorkoutStep(0),
        largeBlock,
        createWorkoutStep(1),
      ]);
      const state = createMockState(krd);

      // Act
      const result = deleteRepetitionBlockAction(krd, largeBlock.id!, state);

      // Assert
      expect(result.currentWorkout).toBeDefined();
    });

    it("should delete a block from a workout with many steps", () => {
      // Arrange
      const steps: Array<WorkoutStep | RepetitionBlock> = [];
      for (let i = 0; i < MANY_STEPS_COUNT; i++) {
        steps.push(createWorkoutStep(i));
      }
      const blockToDelete = createRepetitionBlock(
        BLOCK_SCAFFOLD_MEDIUM_STEPS,
        BLOCK_SCAFFOLD_MEDIUM_REPS
      );
      steps.push(blockToDelete);
      for (let i = INDICES_TEST_INSERT_INDEX; i < PRE_DELETE_LIST_LENGTH; i++) {
        steps.push(createWorkoutStep(i));
      }
      const krd = createMockKrd(steps);
      const state = createMockState(krd);

      // Act
      const result = deleteRepetitionBlockAction(krd, blockToDelete.id!, state);

      // Assert
      expect(result.currentWorkout).toBeDefined();
    });

    it("should recalculate indices after deletion", () => {
      // Arrange
      const steps: Array<WorkoutStep | RepetitionBlock> = [];
      const blockToDelete = createRepetitionBlock(
        BLOCK_SCAFFOLD_DELETE_INDEX_STEPS,
        BLOCK_SCAFFOLD_DELETE_INDEX_REPS
      );
      steps.push(blockToDelete);
      for (let i = 0; i < PRE_DELETE_LIST_LENGTH; i++) {
        steps.push(createWorkoutStep(i));
      }
      const krd = createMockKrd(steps);
      const state = createMockState(krd);

      // Act
      const result = deleteRepetitionBlockAction(krd, blockToDelete.id!, state);

      // Assert
      expect(result.currentWorkout).toBeDefined();
      const workout = result.currentWorkout?.extensions?.structured_workout as
        | Workout
        | undefined;
      if (workout) {
        const updatedSteps = workout.steps;
        let expectedIndex = 0;
        updatedSteps.forEach((step: WorkoutStep | RepetitionBlock) => {
          if ("stepIndex" in step) {
            expect(step.stepIndex).toBe(expectedIndex);
            expectedIndex++;
          }
        });
      }
    });
  });

  describe("undo operation", () => {
    it("should undo to the previous workout", () => {
      // Arrange
      const krd1 = createMockKrd([createWorkoutStep(0)]);
      const krd2 = createMockKrd([createWorkoutStep(0), createWorkoutStep(1)]);
      const krd3 = createMockKrd([
        createWorkoutStep(0),
        createWorkoutStep(1),
        createWorkoutStep(2),
      ]);
      const state: WorkoutState = {
        currentWorkout: krd3,
        undoHistory: [
          { workout: krd1, selection: null },
          { workout: krd2, selection: null },
          { workout: krd3, selection: null },
        ],
        historyIndex: 2,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
      };

      // Act
      const result = createUndoAction(state);

      // Assert
      expect(result.currentWorkout).toBe(krd2);
      expect(result.historyIndex).toBe(1);
    });

    it("should undo with a large workout", () => {
      // Arrange
      const steps1 = Array.from({ length: MANY_STEPS_COUNT }, (_, i) =>
        createWorkoutStep(i)
      );
      const steps2 = [
        ...steps1,
        createRepetitionBlock(
          BLOCK_SCAFFOLD_UNDO_LARGE_STEPS,
          BLOCK_SCAFFOLD_UNDO_LARGE_REPS
        ),
      ];
      const steps3 = [...steps2, createWorkoutStep(MANY_STEPS_COUNT)];
      const krd1 = createMockKrd(steps1);
      const krd2 = createMockKrd(steps2);
      const krd3 = createMockKrd(steps3);
      const state: WorkoutState = {
        currentWorkout: krd3,
        undoHistory: [
          { workout: krd1, selection: null },
          { workout: krd2, selection: null },
          { workout: krd3, selection: null },
        ],
        historyIndex: 2,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
      };

      // Act
      const result = createUndoAction(state);

      // Assert
      expect(result.currentWorkout).toBe(krd2);
      expect(result.historyIndex).toBe(1);
    });

    it("should undo multiple times", () => {
      // Arrange
      const history: Array<KRD> = [];
      for (let i = 0; i < HISTORY_DEPTH; i++) {
        const steps = Array.from({ length: i + 1 }, (_, j) =>
          createWorkoutStep(j)
        );
        history.push(createMockKrd(steps));
      }
      let state: WorkoutState = {
        currentWorkout: history[HISTORY_LAST_INDEX],
        undoHistory: history.map((workout) => ({ workout, selection: null })),
        historyIndex: HISTORY_LAST_INDEX,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
      };

      // Act
      for (let i = 0; i < UNDO_BATCH_COUNT; i++) {
        const result = createUndoAction(state);
        state = {
          ...state,
          currentWorkout: result.currentWorkout!,
          historyIndex: result.historyIndex!,
        };
      }

      // Assert
      // eslint-disable-next-line no-magic-numbers -- post-undo invariant: HISTORY_LAST_INDEX (49) - UNDO_BATCH_COUNT (10) = 39, mechanical derivation
      expect(state.historyIndex).toBe(39);
    });

    it("should return empty object when undoing at the history boundary", () => {
      // Arrange
      const krd = createMockKrd([createWorkoutStep(0)]);
      const state: WorkoutState = {
        currentWorkout: krd,
        undoHistory: [{ workout: krd, selection: null }],
        historyIndex: 0,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
      };

      // Act
      const result = createUndoAction(state);

      // Assert
      expect(result).toEqual({});
    });
  });

  describe("combined operations", () => {
    it("should handle a delete then undo cycle", () => {
      // Arrange
      const block = createRepetitionBlock(
        BLOCK_SCAFFOLD_UNDO_LARGE_STEPS,
        BLOCK_SCAFFOLD_UNDO_LARGE_REPS
      );
      const krd = createMockKrd([
        createWorkoutStep(0),
        block,
        createWorkoutStep(1),
      ]);
      const state = createMockState(krd);

      // Act
      const deleteResult = deleteRepetitionBlockAction(krd, 0, state);
      const updatedState: WorkoutState = {
        ...state,
        currentWorkout: deleteResult.currentWorkout!,
        undoHistory: [
          { workout: krd, selection: null },
          { workout: deleteResult.currentWorkout!, selection: null },
        ],
        historyIndex: 1,
      };
      const undoResult = createUndoAction(updatedState);

      // Assert
      expect(undoResult.currentWorkout).toBe(krd);
    });

    it("should handle multiple delete operations", () => {
      // Arrange
      const blocks = Array.from({ length: NESTED_BLOCKS_COUNT }, (_, i) =>
        createRepetitionBlock(BLOCK_SCAFFOLD_NESTED_STEPS, 2 + i)
      );
      const krd = createMockKrd(blocks);
      let state = createMockState(krd);

      // Act
      for (let i = 0; i < NESTED_DELETE_LOOP_COUNT; i++) {
        // Get the first block's ID from the current workout
        const workout = state.currentWorkout?.extensions
          ?.structured_workout as Workout;
        const firstBlock = workout.steps.find(
          (step): step is RepetitionBlock => "repeatCount" in step
        );
        if (!firstBlock?.id) break;

        const deleteResult = deleteRepetitionBlockAction(
          state.currentWorkout!,
          firstBlock.id,
          state
        );
        state = {
          ...state,
          currentWorkout: deleteResult.currentWorkout!,
          undoHistory: [
            ...state.undoHistory,
            { workout: deleteResult.currentWorkout!, selection: null },
          ],
          historyIndex: state.historyIndex + 1,
        };
      }

      // Assert
      const workout = state.currentWorkout?.extensions?.structured_workout as
        | Workout
        | undefined;
      if (workout) {
        expect(workout.steps).toHaveLength(2);
      }
    });
  });
});
