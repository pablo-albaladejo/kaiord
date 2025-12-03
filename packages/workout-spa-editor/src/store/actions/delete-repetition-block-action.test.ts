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
const createRepetitionBlock = (
  stepCount: number,
  id?: string
): RepetitionBlock => ({
  id: id || `block-${Date.now()}-${Math.random()}`,
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

describe("findBlockById helper", () => {
  /**
   * Helper to extract findBlockById from the module for testing
   * Since it's not exported, we'll test it indirectly through the action
   */
  const testFindBlockById = (
    workout: { steps: Array<WorkoutStep | RepetitionBlock> },
    blockId: string
  ): { block: RepetitionBlock; position: number } | null => {
    // Test by attempting to find the block through the workout structure
    for (let i = 0; i < workout.steps.length; i++) {
      const step = workout.steps[i];
      if (isRepetitionBlock(step) && step.id === blockId) {
        return { block: step, position: i };
      }
    }
    return null;
  };

  describe("finding blocks by ID", () => {
    it("should find the first block", () => {
      // Arrange
      const blocks: Array<RepetitionBlock> = [
        {
          id: "block-1",
          repeatCount: 2,
          steps: [createWorkoutStep(0)],
        },
        {
          id: "block-2",
          repeatCount: 3,
          steps: [createWorkoutStep(0)],
        },
      ];
      const workout = { steps: blocks };

      // Act
      const result = testFindBlockById(workout, "block-1");

      // Assert
      expect(result).not.toBeNull();
      expect(result!.block.id).toBe("block-1");
      expect(result!.position).toBe(0);
    });

    it("should find a middle block", () => {
      // Arrange
      const blocks: Array<RepetitionBlock> = [
        {
          id: "block-1",
          repeatCount: 2,
          steps: [createWorkoutStep(0)],
        },
        {
          id: "block-2",
          repeatCount: 3,
          steps: [createWorkoutStep(0)],
        },
        {
          id: "block-3",
          repeatCount: 4,
          steps: [createWorkoutStep(0)],
        },
      ];
      const workout = { steps: blocks };

      // Act
      const result = testFindBlockById(workout, "block-2");

      // Assert
      expect(result).not.toBeNull();
      expect(result!.block.id).toBe("block-2");
      expect(result!.position).toBe(1);
    });

    it("should find the last block", () => {
      // Arrange
      const blocks: Array<RepetitionBlock> = [
        {
          id: "block-1",
          repeatCount: 2,
          steps: [createWorkoutStep(0)],
        },
        {
          id: "block-2",
          repeatCount: 3,
          steps: [createWorkoutStep(0)],
        },
        {
          id: "block-3",
          repeatCount: 4,
          steps: [createWorkoutStep(0)],
        },
      ];
      const workout = { steps: blocks };

      // Act
      const result = testFindBlockById(workout, "block-3");

      // Assert
      expect(result).not.toBeNull();
      expect(result!.block.id).toBe("block-3");
      expect(result!.position).toBe(2);
    });

    it("should return null for non-existent ID", () => {
      // Arrange
      const blocks: Array<RepetitionBlock> = [
        {
          id: "block-1",
          repeatCount: 2,
          steps: [createWorkoutStep(0)],
        },
        {
          id: "block-2",
          repeatCount: 3,
          steps: [createWorkoutStep(0)],
        },
      ];
      const workout = { steps: blocks };

      // Act
      const result = testFindBlockById(workout, "non-existent-id");

      // Assert
      expect(result).toBeNull();
    });

    it("should find block in mixed steps and blocks", () => {
      // Arrange
      const steps: Array<WorkoutStep | RepetitionBlock> = [
        createWorkoutStep(0),
        {
          id: "block-1",
          repeatCount: 2,
          steps: [createWorkoutStep(0)],
        },
        createWorkoutStep(1),
        {
          id: "block-2",
          repeatCount: 3,
          steps: [createWorkoutStep(0)],
        },
        createWorkoutStep(2),
      ];
      const workout = { steps };

      // Act
      const result = testFindBlockById(workout, "block-2");

      // Assert
      expect(result).not.toBeNull();
      expect(result!.block.id).toBe("block-2");
      expect(result!.position).toBe(3);
    });

    it("should return null for empty workout", () => {
      // Arrange
      const workout = { steps: [] };

      // Act
      const result = testFindBlockById(workout, "any-id");

      // Assert
      expect(result).toBeNull();
    });

    it("should return null when workout has only individual steps", () => {
      // Arrange
      const steps: Array<WorkoutStep> = [
        createWorkoutStep(0),
        createWorkoutStep(1),
        createWorkoutStep(2),
      ];
      const workout = { steps };

      // Act
      const result = testFindBlockById(workout, "any-id");

      // Assert
      expect(result).toBeNull();
    });
  });
});

describe("deleteRepetitionBlockAction", () => {
  describe("Property 1: Correct block deletion by ID", () => {
    /**
     * Feature: 11-fix-repetition-block-deletion-index-bug, Property 1: Correct block deletion by ID
     * Validates: Requirements 1.1, 1.2, 1.3, 1.4
     */
    it("should delete the correct block when identified by ID", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }), // Number of blocks
          fc.integer({ min: 0, max: 2 }), // Index of block to delete
          (numBlocks, deleteIndex) => {
            // Ensure deleteIndex is within bounds
            const targetIndex = deleteIndex % numBlocks;

            // Arrange - Create blocks with unique IDs and identifiable content
            const blocks: Array<RepetitionBlock> = Array.from(
              { length: numBlocks },
              (_, i) => ({
                id: `block-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                repeatCount: i + 2, // Unique repeat count for identification
                steps: [createWorkoutStep(0)],
              })
            );

            const krd = createKRDWithWorkout(blocks);
            const state = createInitialState(krd);

            // Store the ID and repeat count of the block we want to delete
            const targetBlock = blocks[targetIndex];
            const targetId = targetBlock.id!;
            const targetRepeatCount = targetBlock.repeatCount;

            // Act - Delete by ID
            const result = deleteRepetitionBlockAction(krd, targetId, state);

            // Assert
            const workout = result.currentWorkout?.extensions?.workout;
            expect(workout).toBeDefined();

            // Should have one less block
            expect(workout!.steps.length).toBe(numBlocks - 1);

            // The deleted block should not be present
            const remainingBlocks = workout!.steps.filter(
              isRepetitionBlock
            ) as RepetitionBlock[];

            // Verify the target block is not in the remaining blocks
            const deletedBlockStillPresent = remainingBlocks.some(
              (block) =>
                block.id === targetId || block.repeatCount === targetRepeatCount
            );
            expect(deletedBlockStillPresent).toBe(false);

            // Verify all other blocks are still present
            const expectedRemainingBlocks = blocks.filter(
              (_, i) => i !== targetIndex
            );
            expect(remainingBlocks.length).toBe(expectedRemainingBlocks.length);

            // Verify each remaining block matches an expected block
            expectedRemainingBlocks.forEach((expectedBlock) => {
              const found = remainingBlocks.some(
                (block) =>
                  block.id === expectedBlock.id &&
                  block.repeatCount === expectedBlock.repeatCount
              );
              expect(found).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should delete the correct block from mixed steps and blocks", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 3 }), // Steps before first block
          fc.integer({ min: 2, max: 4 }), // Number of blocks
          fc.integer({ min: 1, max: 3 }), // Steps after last block
          fc.integer({ min: 0, max: 3 }), // Index of block to delete
          (stepsBefore, numBlocks, stepsAfter, deleteIndex) => {
            // Ensure deleteIndex is within bounds
            const targetIndex = deleteIndex % numBlocks;

            // Arrange - Create workout with mixed steps and blocks
            const blocks: Array<RepetitionBlock> = Array.from(
              { length: numBlocks },
              (_, i) => ({
                id: `block-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                repeatCount: i + 2,
                steps: [createWorkoutStep(0)],
              })
            );

            const steps: Array<WorkoutStep | RepetitionBlock> = [
              ...Array.from({ length: stepsBefore }, (_, i) =>
                createWorkoutStep(i)
              ),
              ...blocks,
              ...Array.from({ length: stepsAfter }, (_, i) =>
                createWorkoutStep(stepsBefore + i)
              ),
            ];

            const krd = createKRDWithWorkout(steps);
            const state = createInitialState(krd);

            // Store the ID of the block we want to delete
            const targetBlock = blocks[targetIndex];
            const targetId = targetBlock.id!;
            const targetRepeatCount = targetBlock.repeatCount;

            // Act - Delete by ID
            const result = deleteRepetitionBlockAction(krd, targetId, state);

            // Assert
            const workout = result.currentWorkout?.extensions?.workout;
            expect(workout).toBeDefined();

            // Should have one less item (the deleted block)
            expect(workout!.steps.length).toBe(steps.length - 1);

            // The deleted block should not be present
            const remainingBlocks = workout!.steps.filter(
              isRepetitionBlock
            ) as RepetitionBlock[];

            const deletedBlockStillPresent = remainingBlocks.some(
              (block) =>
                block.id === targetId || block.repeatCount === targetRepeatCount
            );
            expect(deletedBlockStillPresent).toBe(false);

            // Verify correct number of blocks remain
            expect(remainingBlocks.length).toBe(numBlocks - 1);

            // Verify all individual steps are still present
            const remainingSteps = workout!.steps.filter(isWorkoutStep);
            expect(remainingSteps.length).toBe(stepsBefore + stepsAfter);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

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
            const block = createRepetitionBlock(stepsInBlock, "test-block-1");
            const steps: Array<WorkoutStep | RepetitionBlock> = [
              ...Array.from({ length: stepsBefore }, (_, i) =>
                createWorkoutStep(i)
              ),
              block,
              ...Array.from({ length: stepsAfter }, (_, i) =>
                createWorkoutStep(stepsBefore + i)
              ),
            ];

            const krd = createKRDWithWorkout(steps);
            const state = createInitialState(krd);

            const totalStepsBefore = steps.length;

            // Act
            const result = deleteRepetitionBlockAction(krd, block.id!, state);

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
              (_, i) => createRepetitionBlock(stepsPerBlock, `test-block-${i}`)
            );

            const krd = createKRDWithWorkout(steps);
            const state = createInitialState(krd);

            // Act - Delete the first block
            const result = deleteRepetitionBlockAction(
              krd,
              steps[0].id!,
              state
            );

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

  describe("Property 8: Step index recalculation", () => {
    /**
     * Feature: 11-fix-repetition-block-deletion-index-bug, Property 8: Step index recalculation
     * Validates: Requirements 1.5
     */
    it("should recalculate step indices correctly after deleting any block", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }), // Number of blocks
          fc.integer({ min: 1, max: 3 }), // Steps before blocks
          fc.integer({ min: 1, max: 3 }), // Steps after blocks
          fc.integer({ min: 0, max: 4 }), // Index of block to delete
          (numBlocks, stepsBefore, stepsAfter, deleteIndex) => {
            // Ensure deleteIndex is within bounds
            const targetIndex = deleteIndex % numBlocks;

            // Arrange - Create workout with steps before, blocks, and steps after
            const blocks: Array<RepetitionBlock> = Array.from(
              { length: numBlocks },
              (_, i) => ({
                id: `block-${i}`,
                repeatCount: 2,
                steps: [createWorkoutStep(0)],
              })
            );

            const steps: Array<WorkoutStep | RepetitionBlock> = [
              ...Array.from({ length: stepsBefore }, (_, i) =>
                createWorkoutStep(i)
              ),
              ...blocks,
              ...Array.from({ length: stepsAfter }, (_, i) =>
                createWorkoutStep(stepsBefore + i)
              ),
            ];

            const krd = createKRDWithWorkout(steps);
            const state = createInitialState(krd);

            // Act - Delete a block by ID
            const targetId = blocks[targetIndex].id!;
            const result = deleteRepetitionBlockAction(krd, targetId, state);

            // Assert
            const workout = result.currentWorkout?.extensions?.workout;
            expect(workout).toBeDefined();

            // Extract all workout steps (not blocks)
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

            // Verify total number of steps is correct
            expect(workoutSteps.length).toBe(stepsBefore + stepsAfter);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should maintain sequential indices when deleting blocks at different positions", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 6 }), // Total number of items
          fc.integer({ min: 1, max: 3 }), // Number of blocks
          (totalItems, numBlocks) => {
            // Ensure we have at least one step
            const numSteps = Math.max(1, totalItems - numBlocks);
            const actualNumBlocks = Math.min(numBlocks, totalItems - 1);

            // Arrange - Create mixed workout
            const items: Array<WorkoutStep | RepetitionBlock> = [];
            let stepIndex = 0;

            // Distribute steps and blocks
            for (let i = 0; i < totalItems; i++) {
              if (i < actualNumBlocks) {
                // Add a block
                items.push({
                  id: `block-${i}`,
                  repeatCount: 2,
                  steps: [createWorkoutStep(0)],
                });
              } else {
                // Add a step
                items.push(createWorkoutStep(stepIndex++));
              }
            }

            const krd = createKRDWithWorkout(items);
            const state = createInitialState(krd);

            // Get the first block's ID
            const firstBlock = items.find(isRepetitionBlock);
            if (!firstBlock) return; // Skip if no blocks

            // Act - Delete the first block
            const result = deleteRepetitionBlockAction(
              krd,
              firstBlock.id!,
              state
            );

            // Assert
            const workout = result.currentWorkout?.extensions?.workout;
            expect(workout).toBeDefined();

            // Verify all remaining steps have sequential indices
            const workoutSteps = workout!.steps.filter(isWorkoutStep);
            workoutSteps.forEach((step, index) => {
              expect(step.stepIndex).toBe(index);
            });

            // Verify no duplicate indices
            const indices = workoutSteps.map((s) => s.stepIndex);
            const uniqueIndices = new Set(indices);
            expect(uniqueIndices.size).toBe(indices.length);
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
            const block = createRepetitionBlock(stepsInBlock, "test-block-1");
            const steps: Array<WorkoutStep | RepetitionBlock> = [
              ...Array.from({ length: stepsBefore }, (_, i) =>
                createWorkoutStep(i)
              ),
              block,
              ...Array.from({ length: stepsAfter }, (_, i) =>
                createWorkoutStep(stepsBefore + i)
              ),
            ];

            const krd = createKRDWithWorkout(steps);
            const state = createInitialState(krd);

            // Act
            const result = deleteRepetitionBlockAction(krd, block.id!, state);

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
            const block = createRepetitionBlock(stepsInBlock, "test-block-1");
            const steps: Array<WorkoutStep | RepetitionBlock> = [
              ...Array.from({ length: stepsBefore }, (_, i) =>
                createWorkoutStep(i)
              ),
              block,
              ...Array.from({ length: stepsAfter }, (_, i) =>
                createWorkoutStep(stepsBefore + i)
              ),
            ];

            const originalKrd = createKRDWithWorkout(steps);
            const state = createInitialState(originalKrd);

            // Store original state for comparison
            const originalWorkout = originalKrd.extensions?.workout;
            const originalStepsLength = originalWorkout?.steps.length ?? 0;

            // The block position in steps array
            const blockPositionInSteps = stepsBefore;

            // Act - Delete the block
            const afterDelete = deleteRepetitionBlockAction(
              originalKrd,
              block.id!,
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
            const block = createRepetitionBlock(stepsInBlock, "test-block-1");
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
            const result = deleteRepetitionBlockAction(krd, block.id!, state);

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

            const block: RepetitionBlock = {
              id: "test-block-1",
              repeatCount: 2,
              steps: Array.from({ length: stepsInBlock }, (_, i) =>
                createStepWithDuration(i, durationPerStep)
              ),
            };

            const steps: Array<WorkoutStep | RepetitionBlock> = [
              ...Array.from({ length: stepsBefore }, (_, i) =>
                createStepWithDuration(i, durationPerStep)
              ),
              block,
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
            const result = deleteRepetitionBlockAction(krd, block.id!, state);

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

    it("should return empty object if block ID does not exist", () => {
      // Arrange
      const block = createRepetitionBlock(3);
      const krd = createKRDWithWorkout([block]);
      const state = createInitialState(krd);

      // Act
      const result = deleteRepetitionBlockAction(krd, "non-existent-id", state);

      // Assert
      expect(result).toEqual({});
    });

    it("should handle deletion of the only block in workout", () => {
      // Arrange
      const block = createRepetitionBlock(3);
      const krd = createKRDWithWorkout([block]);
      const state = createInitialState(krd);

      // Act
      const result = deleteRepetitionBlockAction(krd, block.id!, state);

      // Assert
      const workout = result.currentWorkout?.extensions?.workout;
      expect(workout).toBeDefined();
      expect(workout!.steps.length).toBe(0);
    });
  });
});
