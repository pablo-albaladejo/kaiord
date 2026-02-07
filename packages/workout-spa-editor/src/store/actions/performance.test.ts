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
    workoutHistory: [krd],
    historyIndex: 0,
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
  });

  describe("block deletion performance", () => {
    it("should delete small block within 100ms", () => {
      // Arrange - Create workout with small block (10 steps)
      const block = createRepetitionBlock(10, 3);
      const krd = createMockKrd([
        createWorkoutStep(0),
        block,
        createWorkoutStep(1),
      ]);
      const state = createMockState(krd);

      // Act - Measure deletion time
      const startTime = performance.now();
      const result = deleteRepetitionBlockAction(krd, block.id!, state);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(result.currentWorkout).toBeDefined();
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });

    it("should delete large block within 100ms", () => {
      // Arrange - Create workout with large block (50 steps)
      const largeBlock = createRepetitionBlock(50, 5);
      const krd = createMockKrd([
        createWorkoutStep(0),
        largeBlock,
        createWorkoutStep(1),
      ]);
      const state = createMockState(krd);

      // Act - Measure deletion time
      const startTime = performance.now();
      const result = deleteRepetitionBlockAction(krd, largeBlock.id!, state);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(result.currentWorkout).toBeDefined();
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });

    it("should delete block from workout with many steps within 100ms", () => {
      // Arrange - Create workout with 100 steps and blocks
      const steps: Array<WorkoutStep | RepetitionBlock> = [];
      for (let i = 0; i < 50; i++) {
        steps.push(createWorkoutStep(i));
      }
      const blockToDelete = createRepetitionBlock(20, 3); // Block to delete
      steps.push(blockToDelete);
      for (let i = 50; i < 100; i++) {
        steps.push(createWorkoutStep(i));
      }

      const krd = createMockKrd(steps);
      const state = createMockState(krd);

      // Act - Measure deletion time
      const startTime = performance.now();
      const result = deleteRepetitionBlockAction(krd, blockToDelete.id!, state);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(result.currentWorkout).toBeDefined();
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });

    it("should recalculate indices efficiently after deletion", () => {
      // Arrange - Create workout with many steps
      const steps: Array<WorkoutStep | RepetitionBlock> = [];
      const blockToDelete = createRepetitionBlock(30, 2); // Block to delete
      steps.push(blockToDelete);
      for (let i = 0; i < 100; i++) {
        steps.push(createWorkoutStep(i));
      }

      const krd = createMockKrd(steps);
      const state = createMockState(krd);

      // Act - Measure deletion time (worst case: recalculate all indices)
      const startTime = performance.now();
      const result = deleteRepetitionBlockAction(krd, blockToDelete.id!, state);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(result.currentWorkout).toBeDefined();
      expect(duration).toBeLessThan(100); // Should complete in < 100ms

      // Verify indices are correct
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

  describe("undo operation performance", () => {
    it("should undo within 100ms", () => {
      // Arrange - Create state with history
      const krd1 = createMockKrd([createWorkoutStep(0)]);
      const krd2 = createMockKrd([createWorkoutStep(0), createWorkoutStep(1)]);
      const krd3 = createMockKrd([
        createWorkoutStep(0),
        createWorkoutStep(1),
        createWorkoutStep(2),
      ]);

      const state: WorkoutState = {
        currentWorkout: krd3,
        workoutHistory: [krd1, krd2, krd3],
        historyIndex: 2,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
      };

      // Act - Measure undo time
      const startTime = performance.now();
      const result = createUndoAction(state);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(result.currentWorkout).toBe(krd2);
      expect(result.historyIndex).toBe(1);
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });

    it("should undo with large workout within 100ms", () => {
      // Arrange - Create state with large workouts in history
      const steps1 = Array.from({ length: 50 }, (_, i) => createWorkoutStep(i));
      const steps2 = [...steps1, createRepetitionBlock(30, 3)];
      const steps3 = [...steps2, createWorkoutStep(50)];

      const krd1 = createMockKrd(steps1);
      const krd2 = createMockKrd(steps2);
      const krd3 = createMockKrd(steps3);

      const state: WorkoutState = {
        currentWorkout: krd3,
        workoutHistory: [krd1, krd2, krd3],
        historyIndex: 2,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
      };

      // Act - Measure undo time
      const startTime = performance.now();
      const result = createUndoAction(state);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(result.currentWorkout).toBe(krd2);
      expect(result.historyIndex).toBe(1);
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });

    it("should undo multiple times efficiently", () => {
      // Arrange - Create state with long history
      const history: Array<KRD> = [];
      for (let i = 0; i < 50; i++) {
        const steps = Array.from({ length: i + 1 }, (_, j) =>
          createWorkoutStep(j)
        );
        history.push(createMockKrd(steps));
      }

      let state: WorkoutState = {
        currentWorkout: history[49],
        workoutHistory: history,
        historyIndex: 49,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
      };

      // Act - Measure time for 10 consecutive undos
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
      const duration = endTime - startTime;

      // Assert
      expect(state.historyIndex).toBe(39);
      expect(duration).toBeLessThan(100); // All 10 undos in < 100ms
    });

    it("should handle undo at history boundary efficiently", () => {
      // Arrange - Create state at beginning of history
      const krd = createMockKrd([createWorkoutStep(0)]);
      const state: WorkoutState = {
        currentWorkout: krd,
        workoutHistory: [krd],
        historyIndex: 0,
        selectedStepId: null,
        selectedStepIds: [],
        isEditing: false,
      };

      // Act - Measure undo time (should be no-op)
      const startTime = performance.now();
      const result = createUndoAction(state);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(result).toEqual({});
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });
  });

  describe("modal operation performance", () => {
    it("should create modal config within 200ms", () => {
      // Arrange - Prepare modal configuration
      const modalConfig = {
        title: "Delete Repetition Block",
        message: "Are you sure you want to delete this repetition block?",
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        onConfirm: () => {},
        onCancel: () => {},
      };

      // Act - Measure modal config creation time
      const startTime = performance.now();
      const config = { ...modalConfig };
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(config.title).toBe("Delete Repetition Block");
      expect(duration).toBeLessThan(200); // Should complete in < 200ms
    });

    it("should handle modal state changes within 200ms", () => {
      // Arrange - Simulate modal state
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

      // Act - Measure show/hide cycle
      const startTime = performance.now();
      showModal(config);
      hideModal();
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(isModalOpen).toBe(false);
      expect(modalConfig).toBe(null);
      expect(duration).toBeLessThan(200); // Should complete in < 200ms
    });

    it("should handle multiple modal operations within 200ms", () => {
      // Arrange - Simulate modal state
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

      // Act - Measure time for 10 show/hide cycles
      const startTime = performance.now();
      configs.forEach(() => {
        showModal();
        hideModal();
      });
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(isModalOpen).toBe(false);
      expect(duration).toBeLessThan(200); // All operations in < 200ms
    });

    it("should handle modal with complex callbacks within 200ms", () => {
      // Arrange - Create modal with complex callbacks
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

      // Act - Measure modal config creation and callback setup
      const startTime = performance.now();
      const config = { ...modalConfig };
      config.onConfirm();
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(config.title).toBe("Delete Large Block");
      expect(duration).toBeLessThan(200); // Should complete in < 200ms
    });
  });

  describe("combined operations performance", () => {
    it("should handle delete + undo cycle within 200ms", () => {
      // Arrange - Create workout with block
      const block = createRepetitionBlock(30, 3);
      const krd = createMockKrd([
        createWorkoutStep(0),
        block,
        createWorkoutStep(1),
      ]);
      const state = createMockState(krd);

      // Act - Measure delete + undo cycle
      const startTime = performance.now();
      const deleteResult = deleteRepetitionBlockAction(krd, 0, state);
      const updatedState: WorkoutState = {
        ...state,
        currentWorkout: deleteResult.currentWorkout!,
        workoutHistory: [krd, deleteResult.currentWorkout!],
        historyIndex: 1,
      };
      const undoResult = createUndoAction(updatedState);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(undoResult.currentWorkout).toBe(krd);
      expect(duration).toBeLessThan(200); // Combined operations in < 200ms
    });

    it("should handle multiple operations efficiently", () => {
      // Arrange - Create workout with multiple blocks
      const blocks = Array.from({ length: 5 }, (_, i) =>
        createRepetitionBlock(10, 2 + i)
      );
      const krd = createMockKrd(blocks);
      let state = createMockState(krd);

      // Act - Measure time for multiple delete operations
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
          workoutHistory: [
            ...state.workoutHistory,
            deleteResult.currentWorkout!,
          ],
          historyIndex: state.historyIndex + 1,
        };
      }
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      const workout = state.currentWorkout?.extensions?.structured_workout as
        | Workout
        | undefined;
      if (workout) {
        expect(workout.steps).toHaveLength(2);
      }
      expect(duration).toBeLessThan(300); // 3 deletions in < 300ms (100ms each)
    });
  });
});
