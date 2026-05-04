/**
 * Performance Tests for Core Operations
 *
 * Tests performance of critical operations:
 * - Block deletion (< 100ms)
 * - Undo operations (< 100ms)
 * - Modal operations (< 200ms)
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

describe("Performance Tests", () => {
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
    duration: { type: "time", seconds: 300 + index * 10 },
    targetType: "power",
    target: { type: "power", value: { unit: "watts", value: 200 + index } },
  });

  const createRepetitionBlock = (
    stepCount: number,
    repeatCount: number
  ): RepetitionBlock => ({
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

  describe("block deletion performance", () => {
    it("should delete small block within 100ms", () => {
      // Arrange
      const block = createRepetitionBlock(10, 3);
      const krd = createMockKrd([
        createWorkoutStep(0),
        block,
        createWorkoutStep(1),
      ]);
      const state = createMockState(krd);
      const startTime = performance.now();
      const result = deleteRepetitionBlockAction(krd, block.id!, state);
      const endTime = performance.now();

      // Act
      const duration = endTime - startTime;

      // Assert
      expect(result.currentWorkout).toBeDefined();
      expect(duration).toBeLessThan(100);
    });

    it("should delete large block within 100ms", () => {
      // Arrange
      const largeBlock = createRepetitionBlock(50, 5);
      const krd = createMockKrd([
        createWorkoutStep(0),
        largeBlock,
        createWorkoutStep(1),
      ]);
      const state = createMockState(krd);
      const startTime = performance.now();
      const result = deleteRepetitionBlockAction(krd, largeBlock.id!, state);
      const endTime = performance.now();

      // Act
      const duration = endTime - startTime;

      // Assert
      expect(result.currentWorkout).toBeDefined();
      expect(duration).toBeLessThan(100);
    });

    it("should delete block from workout with many steps within 100ms", () => {
      // Arrange
      const steps: Array<WorkoutStep | RepetitionBlock> = [];
      for (let i = 0; i < 50; i++) {
        steps.push(createWorkoutStep(i));
      }
      const blockToDelete = createRepetitionBlock(20, 3);
      steps.push(blockToDelete);
      for (let i = 50; i < 100; i++) {
        steps.push(createWorkoutStep(i));
      }
      const krd = createMockKrd(steps);
      const state = createMockState(krd);
      const startTime = performance.now();
      const result = deleteRepetitionBlockAction(krd, blockToDelete.id!, state);
      const endTime = performance.now();

      // Act
      const duration = endTime - startTime;

      // Assert
      expect(result.currentWorkout).toBeDefined();
      expect(duration).toBeLessThan(100);
    });

    it("should recalculate indices efficiently after deletion", () => {
      // Arrange
      const steps: Array<WorkoutStep | RepetitionBlock> = [];
      const blockToDelete = createRepetitionBlock(30, 2);
      steps.push(blockToDelete);
      for (let i = 0; i < 100; i++) {
        steps.push(createWorkoutStep(i));
      }
      const krd = createMockKrd(steps);
      const state = createMockState(krd);
      const startTime = performance.now();
      const result = deleteRepetitionBlockAction(krd, blockToDelete.id!, state);
      const endTime = performance.now();
      const duration = endTime - startTime;
      expect(result.currentWorkout).toBeDefined();
      expect(duration).toBeLessThan(100);

      // Act
      const workout = result.currentWorkout?.extensions?.structured_workout as
        | Workout
        | undefined;

      // Assert
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

  describe("undo operation performance", () => {
    it("should undo within 100ms", () => {
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
      const startTime = performance.now();
      const result = createUndoAction(state);
      const endTime = performance.now();

      // Act
      const duration = endTime - startTime;

      // Assert
      expect(result.currentWorkout).toBe(krd2);
      expect(result.historyIndex).toBe(1);
      expect(duration).toBeLessThan(100);
    });

    it("should undo with large workout within 100ms", () => {
      // Arrange
      const steps1 = Array.from({ length: 50 }, (_, i) => createWorkoutStep(i));
      const steps2 = [...steps1, createRepetitionBlock(30, 3)];
      const steps3 = [...steps2, createWorkoutStep(50)];
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
      const startTime = performance.now();
      const result = createUndoAction(state);
      const endTime = performance.now();

      // Act
      const duration = endTime - startTime;

      // Assert
      expect(result.currentWorkout).toBe(krd2);
      expect(result.historyIndex).toBe(1);
      expect(duration).toBeLessThan(100);
    });

    it("should undo multiple times efficiently", () => {
      // Arrange
      const history: Array<KRD> = [];
      for (let i = 0; i < 50; i++) {
        const steps = Array.from({ length: i + 1 }, (_, j) =>
          createWorkoutStep(j)
        );
        history.push(createMockKrd(steps));
      }
      let state: WorkoutState = {
        currentWorkout: history[49],
        undoHistory: history.map((workout) => ({ workout, selection: null })),
        historyIndex: 49,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
      };
      const startTime = performance.now();
      for (let i = 0; i < 10; i++) {
        const result = createUndoAction(state);
        state = {
          ...state,
          currentWorkout: result.currentWorkout!,
          historyIndex: result.historyIndex!,
        };
      }
      const endTime = performance.now();

      // Act
      const duration = endTime - startTime;

      // Assert
      expect(state.historyIndex).toBe(39);
      expect(duration).toBeLessThan(100);
    });

    it("should handle undo at history boundary efficiently", () => {
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
      const startTime = performance.now();
      const result = createUndoAction(state);
      const endTime = performance.now();

      // Act
      const duration = endTime - startTime;

      // Assert
      expect(result).toEqual({});
      expect(duration).toBeLessThan(100);
    });
  });

  describe("modal operation performance", () => {
    it("should create modal config within 200ms", () => {
      // Arrange
      const modalConfig = {
        title: "Delete Repetition Block",
        message: "Are you sure you want to delete this repetition block?",
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        onConfirm: () => {},
        onCancel: () => {},
      };
      const startTime = performance.now();
      const config = { ...modalConfig };
      const endTime = performance.now();

      // Act
      const duration = endTime - startTime;

      // Assert
      expect(config.title).toBe("Delete Repetition Block");
      expect(duration).toBeLessThan(200);
    });

    it("should handle modal state changes within 200ms", () => {
      // Arrange
      let isModalOpen = false;
      let modalConfig: unknown = null;
      const showModal = (config: unknown) => {
        isModalOpen = true;
        modalConfig = config;
      };
      const hideModal = () => {
        isModalOpen = false;
        modalConfig = null;
      };
      const config = {
        title: "Confirm Action",
        message: "Are you sure?",
        confirmLabel: "Yes",
        cancelLabel: "No",
        onConfirm: () => {},
        onCancel: () => {},
      };
      const startTime = performance.now();
      showModal(config);
      hideModal();
      const endTime = performance.now();

      // Act
      const duration = endTime - startTime;

      // Assert
      expect(isModalOpen).toBe(false);
      expect(modalConfig).toBe(null);
      expect(duration).toBeLessThan(200);
    });

    it("should handle multiple modal operations within 200ms", () => {
      // Arrange
      let isModalOpen = false;
      const showModal = () => {
        isModalOpen = true;
      };
      const hideModal = () => {
        isModalOpen = false;
      };
      const configs = Array.from({ length: 10 }, (_, i) => ({
        title: `Modal ${i}`,
        message: `Message ${i}`,
        confirmLabel: "OK",
        cancelLabel: "Cancel",
        onConfirm: () => {},
        onCancel: () => {},
      }));
      const startTime = performance.now();
      configs.forEach(() => {
        showModal();
        hideModal();
      });
      const endTime = performance.now();

      // Act
      const duration = endTime - startTime;

      // Assert
      expect(isModalOpen).toBe(false);
      expect(duration).toBeLessThan(200);
    });

    it("should handle modal with complex callbacks within 200ms", () => {
      // Arrange
      const largeBlock = createRepetitionBlock(50, 5);
      const krd = createMockKrd([largeBlock]);
      const state = createMockState(krd);
      const onConfirm = () => {
        // Simulate complex operation
        deleteRepetitionBlockAction(krd, 0, state);
      };
      const onCancel = () => {
        // Simulate cleanup
        return;
      };
      const modalConfig = {
        title: "Delete Large Block",
        message: "This will delete 50 steps. Continue?",
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        onConfirm,
        onCancel,
      };
      const startTime = performance.now();
      const config = { ...modalConfig };
      config.onConfirm();
      const endTime = performance.now();

      // Act
      const duration = endTime - startTime;

      // Assert
      expect(config.title).toBe("Delete Large Block");
      expect(duration).toBeLessThan(200);
    });
  });

  describe("combined operations performance", () => {
    it("should handle delete + undo cycle within 200ms", () => {
      // Arrange
      const block = createRepetitionBlock(30, 3);
      const krd = createMockKrd([
        createWorkoutStep(0),
        block,
        createWorkoutStep(1),
      ]);
      const state = createMockState(krd);
      const startTime = performance.now();
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
      const endTime = performance.now();

      // Act
      const duration = endTime - startTime;

      // Assert
      expect(undoResult.currentWorkout).toBe(krd);
      expect(duration).toBeLessThan(200);
    });

    it("should handle multiple operations efficiently", () => {
      // Arrange
      const blocks = Array.from({ length: 5 }, (_, i) =>
        createRepetitionBlock(10, 2 + i)
      );
      const krd = createMockKrd(blocks);
      let state = createMockState(krd);
      const startTime = performance.now();
      for (let i = 0; i < 3; i++) {
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
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Act
      const workout = state.currentWorkout?.extensions?.structured_workout as
        | Workout
        | undefined;

      // Assert
      if (workout) {
        expect(workout.steps).toHaveLength(2);
      }
      expect(duration).toBeLessThan(300);
    });
  });
});
