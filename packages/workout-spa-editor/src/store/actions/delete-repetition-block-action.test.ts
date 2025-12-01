/**
 * Delete Repetition Block Action Tests
 *
 * Property-based tests for the delete repetition block action.
 *
 * Feature: 09-repetition-blocks-and-ui-polish
 */

import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { KRD, RepetitionBlock, WorkoutStep } from "../../types/krd";
import { isRepetitionBlock, isWorkoutStep } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { deleteRepetitionBlockAction } from "./delete-repetition-block-action";

/**
 * Helper to create a basic workout step
 */
const createWorkoutStep = (stepIndex: number): WorkoutStep => ({
  stepIndex,
  durationType: "time",
  duration: { type: "time", seconds: 300 },
  targetType: "open",
  target: { type: "open" },
  intensity: "active",
});

/**
 * Helper to create a repetition block with steps
 */
const createRepetitionBlock = (stepCount: number): RepetitionBlock => ({
  repeatCount: 2,
  steps: Array.from({ length: stepCount }, (_, i) => createWorkoutStep(i)),
});

/**
 * Helper to create a KRD with a workout containing steps and blocks
 */
const createKRDWithWorkout = (
  steps: Array<WorkoutStep | RepetitionBlock>
): KRD => ({
  version: "1.0",
  type: "workout",
  metadata: {
    created: "2025-01-15T10:30:00Z",
    sport: "cycling",
  },
  extensions: {
    workout: {
      name: "Test Workout",
      sport: "cycling",
      steps,
    },
  },
});

/**
 * Helper to create initial workout state
 */
const createInitialState = (krd: KRD): WorkoutState => ({
  currentWorkout: krd,
  workoutHistory: [krd],
  historyIndex: 0,
  selectedStepId: null,
  selectedStepIds: [],
  isEditing: false,
  deletedSteps: [],
});

describe("deleteRepetitionBlockAction", () => {
  describe("Property 3: Block deletion removes all contained steps", () => {
    /**
     * Feature: 09-repetition-blocks-and-ui-polish, Property 3: Block deletion removes all contained steps
     * Validates: Requirements 2.1
     */
    it("should remove the entire block and all its steps from the workout", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // Number of steps before block
          fc.integer({ min: 1, max: 10 }), // Number of steps in block
          fc.integer({ min: 0, max: 5 }), // Number of steps after block
          (stepsBefore, stepsInBlock, stepsAfter) => {
            // Arrange
            const steps: Array<WorkoutStep | RepetitionBlock> = [
              ...Array.from({ length: stepsBefore }, (_, i) =>
                createWorkoutStep(i)
              ),
              createRepetitionBlock(stepsInBlock),
              ...Array.from({ length: stepsAfter }, (_, i) =>
                createWorkoutStep(stepsBefore + i)
              ),
            ];

            const krd = createKRDWithWorkout(steps);
            const state = createInitialState(krd);

            const totalStepsBefore = steps.length;

            // Act
            const result = deleteRepetitionBlockAction(krd, 0, state);

            // Assert
            const workout = result.currentWorkout?.extensions?.workout;
            expect(workout).toBeDefined();

            // Block should be removed (1 less item in steps array)
            expect(workout!.steps.length).toBe(totalStepsBefore - 1);

            // No repetition blocks should remain at index 0
            const remainingBlocks = workout!.steps.filter(isRepetitionBlock);
            expect(remainingBlocks.length).toBe(0);

            // All remaining items should be WorkoutSteps
            const remainingSteps = workout!.steps.filter(isWorkoutStep);
            expect(remainingSteps.length).toBe(stepsBefore + stepsAfter);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle deletion of multiple blocks correctly", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }), // Number of blocks
          fc.integer({ min: 1, max: 5 }), // Steps in each block
          (numBlocks, stepsPerBlock) => {
            // Arrange
            const steps: Array<RepetitionBlock> = Array.from(
              { length: numBlocks },
              () => createRepetitionBlock(stepsPerBlock)
            );

            const krd = createKRDWithWorkout(steps);
            const state = createInitialState(krd);

            // Act - Delete the first block
            const result = deleteRepetitionBlockAction(krd, 0, state);

            // Assert
            const workout = result.currentWorkout?.extensions?.workout;
            expect(workout).toBeDefined();

            // Should have one less block
            const remainingBlocks = workout!.steps.filter(isRepetitionBlock);
            expect(remainingBlocks.length).toBe(numBlocks - 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 4: Step indices remain sequential after deletion", () => {
    /**
     * Feature: 09-repetition-blocks-and-ui-polish, Property 4: Step indices remain sequential after deletion
     * Validates: Requirements 2.2
     */
    it("should recalculate stepIndex for all remaining steps to be sequential", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // Steps before block
          fc.integer({ min: 1, max: 5 }), // Steps in block
          fc.integer({ min: 1, max: 10 }), // Steps after block
          (stepsBefore, stepsInBlock, stepsAfter) => {
            // Arrange
            const steps: Array<WorkoutStep | RepetitionBlock> = [
              ...Array.from({ length: stepsBefore }, (_, i) =>
                createWorkoutStep(i)
              ),
              createRepetitionBlock(stepsInBlock),
              ...Array.from({ length: stepsAfter }, (_, i) =>
                createWorkoutStep(stepsBefore + i)
              ),
            ];

            const krd = createKRDWithWorkout(steps);
            const state = createInitialState(krd);

            // Act
            const result = deleteRepetitionBlockAction(krd, 0, state);

            // Assert
            const workout = result.currentWorkout?.extensions?.workout;
            expect(workout).toBeDefined();

            const workoutSteps = workout!.steps.filter(isWorkoutStep);

            // Verify indices are sequential starting from 0
            workoutSteps.forEach((step, index) => {
              expect(step.stepIndex).toBe(index);
            });

            // Verify no gaps in indices
            const indices = workoutSteps.map((s) => s.stepIndex);
            const expectedIndices = Array.from(
              { length: workoutSteps.length },
              (_, i) => i
            );
            expect(indices).toEqual(expectedIndices);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 5: Block deletion is undoable (round-trip)", () => {
    /**
     * Feature: 09-repetition-blocks-and-ui-polish, Property 5: Block deletion is undoable (round-trip)
     * Validates: Requirements 2.3, 2.4
     */
    it("should restore exact original state after delete then undo", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 5 }), // Steps before block
          fc.integer({ min: 1, max: 5 }), // Steps in block
          fc.integer({ min: 0, max: 5 }), // Steps after block
          (stepsBefore, stepsInBlock, stepsAfter) => {
            // Arrange
            const steps: Array<WorkoutStep | RepetitionBlock> = [
              ...Array.from({ length: stepsBefore }, (_, i) =>
                createWorkoutStep(i)
              ),
              createRepetitionBlock(stepsInBlock),
              ...Array.from({ length: stepsAfter }, (_, i) =>
                createWorkoutStep(stepsBefore + i)
              ),
            ];

            const originalKrd = createKRDWithWorkout(steps);
            const state = createInitialState(originalKrd);

            // Store original state for comparison
            const originalWorkout = originalKrd.extensions?.workout;
            const originalStepsLength = originalWorkout?.steps.length ?? 0;

            // The block is always at block index 0 (first block in the workout)
            // Note: blockIndex counts blocks only, not position in steps array
            const blockIndex = 0;
            const blockPositionInSteps = stepsBefore; // Position in steps array

            // Act - Delete the block
            const afterDelete = deleteRepetitionBlockAction(
              originalKrd,
              blockIndex,
              state
            );

            // Verify deletion happened
            const workoutAfterDelete =
              afterDelete.currentWorkout?.extensions?.workout;
            expect(workoutAfterDelete?.steps.length).toBe(
              originalStepsLength - 1
            );

            // Act - Undo the deletion
            const stateAfterDelete: WorkoutState = {
              ...state,
              ...afterDelete,
            };

            // Verify we have history to undo
            expect(stateAfterDelete.workoutHistory).toBeDefined();
            expect(stateAfterDelete.historyIndex).toBeGreaterThan(0);

            // Simulate undo by going back in history
            const previousIndex = stateAfterDelete.historyIndex! - 1;
            const afterUndo: Partial<WorkoutState> = {
              currentWorkout: stateAfterDelete.workoutHistory![previousIndex],
              historyIndex: previousIndex,
            };

            // Assert - Original state is restored
            const workoutAfterUndo =
              afterUndo.currentWorkout?.extensions?.workout;

            expect(workoutAfterUndo).toBeDefined();

            // Verify step count is restored
            expect(workoutAfterUndo!.steps.length).toBe(originalStepsLength);

            // Verify the block is back at the original position in steps array
            const restoredBlock = workoutAfterUndo!.steps[blockPositionInSteps];
            expect(restoredBlock).toBeDefined();
            expect(isRepetitionBlock(restoredBlock)).toBe(true);

            // Verify block has correct number of steps
            const restoredBlockSteps = (restoredBlock as RepetitionBlock).steps;
            expect(restoredBlockSteps.length).toBe(stepsInBlock);

            // Verify all steps before block are restored
            for (let i = 0; i < stepsBefore; i++) {
              const step = workoutAfterUndo!.steps[i];
              expect(step).toBeDefined();
              expect(isWorkoutStep(step)).toBe(true);
              if (isWorkoutStep(step)) {
                expect((step as WorkoutStep).stepIndex).toBe(i);
              }
            }

            // Verify all steps after block are restored
            for (let i = 0; i < stepsAfter; i++) {
              const step =
                workoutAfterUndo!.steps[blockPositionInSteps + 1 + i];
              expect(step).toBeDefined();
              expect(isWorkoutStep(step)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 6: Deletion clears affected selections", () => {
    /**
     * Feature: 09-repetition-blocks-and-ui-polish, Property 6: Deletion clears affected selections
     * Validates: Requirements 2.5
     */
    it("should clear selections when deleting a block", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // Steps in block
          fc.boolean(), // Whether to have selectedStepId
          fc.boolean(), // Whether to have selectedStepIds
          (stepsInBlock, hasSelectedId, hasSelectedIds) => {
            // Arrange
            const block = createRepetitionBlock(stepsInBlock);
            const krd = createKRDWithWorkout([block]);

            const state: WorkoutState = {
              currentWorkout: krd,
              workoutHistory: [krd],
              historyIndex: 0,
              selectedStepId: hasSelectedId ? "some-step-id" : null,
              selectedStepIds: hasSelectedIds ? ["step-1", "step-2"] : [],
              isEditing: false,
              deletedSteps: [],
            };

            // Act
            const result = deleteRepetitionBlockAction(krd, 0, state);

            // Assert - Selections are cleared
            expect(result.selectedStepId).toBe(null);
            expect(result.selectedStepIds).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 7: Statistics consistency after deletion", () => {
    /**
     * Feature: 09-repetition-blocks-and-ui-polish, Property 7: Statistics consistency after deletion
     * Validates: Requirements 2.7
     */
    it("should maintain consistent workout statistics after deletion", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // Steps before block
          fc.integer({ min: 1, max: 5 }), // Steps in block
          fc.integer({ min: 1, max: 10 }), // Steps after block
          fc.integer({ min: 60, max: 600 }), // Duration per step (seconds)
          (stepsBefore, stepsInBlock, stepsAfter, durationPerStep) => {
            // Arrange - Create steps with specific durations
            const createStepWithDuration = (
              stepIndex: number,
              seconds: number
            ): WorkoutStep => ({
              stepIndex,
              durationType: "time",
              duration: { type: "time", seconds },
              targetType: "open",
              target: { type: "open" },
              intensity: "active",
            });

            const steps: Array<WorkoutStep | RepetitionBlock> = [
              ...Array.from({ length: stepsBefore }, (_, i) =>
                createStepWithDuration(i, durationPerStep)
              ),
              {
                repeatCount: 2,
                steps: Array.from({ length: stepsInBlock }, (_, i) =>
                  createStepWithDuration(i, durationPerStep)
                ),
              },
              ...Array.from({ length: stepsAfter }, (_, i) =>
                createStepWithDuration(stepsBefore + i, durationPerStep)
              ),
            ];

            const krd = createKRDWithWorkout(steps);
            const state = createInitialState(krd);

            // Calculate expected statistics BEFORE deletion
            const totalDurationBefore =
              (stepsBefore + stepsAfter) * durationPerStep +
              stepsInBlock * durationPerStep * 2; // Block repeats 2 times

            // Calculate expected statistics AFTER deletion (block removed)
            const expectedTotalDurationAfter =
              (stepsBefore + stepsAfter) * durationPerStep;

            // Act
            const result = deleteRepetitionBlockAction(krd, 0, state);

            // Assert
            const workout = result.currentWorkout?.extensions?.workout;
            expect(workout).toBeDefined();

            // Calculate actual total duration from remaining steps
            let actualTotalDuration = 0;
            for (const step of workout!.steps) {
              if (isWorkoutStep(step)) {
                if (step.duration.type === "time") {
                  actualTotalDuration += step.duration.seconds;
                }
              } else if (isRepetitionBlock(step)) {
                // If there are other blocks, account for their repeated duration
                const blockDuration = step.steps.reduce((sum, s) => {
                  if (s.duration.type === "time") {
                    return sum + s.duration.seconds;
                  }
                  return sum;
                }, 0);
                actualTotalDuration += blockDuration * step.repeatCount;
              }
            }

            // Verify statistics match expected values
            expect(actualTotalDuration).toBe(expectedTotalDurationAfter);

            // Verify the duration decreased by the correct amount
            const durationReduction = totalDurationBefore - actualTotalDuration;
            const expectedReduction = stepsInBlock * durationPerStep * 2;
            expect(durationReduction).toBe(expectedReduction);

            // Verify all remaining steps are valid
            const workoutSteps = workout!.steps.filter(isWorkoutStep);
            workoutSteps.forEach((step) => {
              expect(step.stepIndex).toBeGreaterThanOrEqual(0);
              expect(step.duration).toBeDefined();
              expect(step.target).toBeDefined();
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("edge cases", () => {
    it("should return empty object if no workout exists", () => {
      // Arrange
      const krd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
      };

      const state = createInitialState(krd);

      // Act
      const result = deleteRepetitionBlockAction(krd, 0, state);

      // Assert
      expect(result).toEqual({});
    });

    it("should return empty object if block index is out of bounds", () => {
      // Arrange
      const block = createRepetitionBlock(3);
      const krd = createKRDWithWorkout([block]);
      const state = createInitialState(krd);

      // Act
      const result = deleteRepetitionBlockAction(krd, 999, state);

      // Assert
      expect(result).toEqual({});
    });

    it("should handle deletion of the only block in workout", () => {
      // Arrange
      const block = createRepetitionBlock(3);
      const krd = createKRDWithWorkout([block]);
      const state = createInitialState(krd);

      // Act
      const result = deleteRepetitionBlockAction(krd, 0, state);

      // Assert
      const workout = result.currentWorkout?.extensions?.workout;
      expect(workout).toBeDefined();
      expect(workout!.steps.length).toBe(0);
    });
  });
});
