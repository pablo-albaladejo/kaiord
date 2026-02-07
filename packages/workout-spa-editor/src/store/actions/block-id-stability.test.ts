/**
 * Property-Based Tests for Block ID Stability
 *
 * Tests that validate block IDs remain constant across operations.
 *
 * **Feature: workout-spa-editor/11-fix-repetition-block-deletion-index-bug, Property 3: Block ID stability**
 * **Validates: Requirements 2.3**
 */

import type { RepetitionBlock, WorkoutStep } from "@kaiord/core";
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { KRD } from "../../types/krd";
import { isRepetitionBlock } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { addStepToRepetitionBlockAction } from "./add-step-to-repetition-block-action";
import { editRepetitionBlockAction } from "./edit-repetition-block-action";
import { reorderStepAction } from "./reorder-step-action";

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
 * Helper to create a repetition block with a specific ID
 */
const createRepetitionBlock = (
  id: string,
  repeatCount: number,
  stepCount: number
): RepetitionBlock => ({
  id,
  repeatCount,
  steps: Array.from({ length: stepCount }, (_, i) => createWorkoutStep(i)),
});

/**
 * Helper to create a KRD with a workout containing steps and blocks
 */
const createKRDWithWorkout = (
  steps: Array<WorkoutStep | RepetitionBlock>
): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: {
    created: "2025-01-15T10:30:00Z",
    sport: "cycling",
  },
  extensions: {
    structured_workout: {
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

describe("Block ID Stability", () => {
  describe("Property 3: Block ID stability", () => {
    /**
     * Property: For any repetition block, its ID should remain constant
     * when editing the repeat count
     *
     * This ensures that block IDs are stable identifiers that don't change
     * when the block's properties are modified.
     *
     * **Validates: Requirements 2.3**
     */
    it("should preserve block ID when editing repeat count", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 30 }), // Block ID
          fc.integer({ min: 2, max: 10 }), // Initial repeat count
          fc.integer({ min: 1, max: 5 }), // Number of steps in block
          fc.integer({ min: 2, max: 10 }), // New repeat count
          (blockId, initialRepeatCount, stepCount, newRepeatCount) => {
            // Arrange
            const block = createRepetitionBlock(
              blockId,
              initialRepeatCount,
              stepCount
            );
            const krd = createKRDWithWorkout([block]);
            const state = createInitialState(krd);

            // Act - Edit the repeat count
            const result = editRepetitionBlockAction(
              krd,
              blockId,
              newRepeatCount,
              state
            );

            // Assert
            const workout =
              result.currentWorkout?.extensions?.structured_workout;
            expect(workout).toBeDefined();

            // Find the block in the updated workout
            const updatedBlock = workout!.steps.find(
              (step) => isRepetitionBlock(step) && step.id === blockId
            ) as RepetitionBlock | undefined;

            // Block should still exist with the same ID
            expect(updatedBlock).toBeDefined();
            expect(updatedBlock!.id).toBe(blockId);

            // Repeat count should be updated
            expect(updatedBlock!.repeatCount).toBe(newRepeatCount);

            // Steps should be unchanged
            expect(updatedBlock!.steps.length).toBe(stepCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any repetition block, its ID should remain constant
     * when adding steps to the block
     *
     * This ensures that block IDs don't change when the block's content
     * is modified.
     *
     * **Validates: Requirements 2.3**
     */
    it("should preserve block ID when adding steps to block", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 30 }), // Block ID
          fc.integer({ min: 2, max: 10 }), // Repeat count
          fc.integer({ min: 1, max: 5 }), // Initial number of steps
          (blockId, repeatCount, initialStepCount) => {
            // Arrange
            const block = createRepetitionBlock(
              blockId,
              repeatCount,
              initialStepCount
            );
            const krd = createKRDWithWorkout([block]);
            const state = createInitialState(krd);

            // Act - Add a step to the block
            const result = addStepToRepetitionBlockAction(krd, blockId, state);

            // Assert
            const workout =
              result.currentWorkout?.extensions?.structured_workout;
            expect(workout).toBeDefined();

            // Find the block in the updated workout
            const updatedBlock = workout!.steps.find(
              (step) => isRepetitionBlock(step) && step.id === blockId
            ) as RepetitionBlock | undefined;

            // Block should still exist with the same ID
            expect(updatedBlock).toBeDefined();
            expect(updatedBlock!.id).toBe(blockId);

            // Should have one more step
            expect(updatedBlock!.steps.length).toBe(initialStepCount + 1);

            // Repeat count should be unchanged
            expect(updatedBlock!.repeatCount).toBe(repeatCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any repetition block, its ID should remain constant
     * when reordering steps in the workout
     *
     * This ensures that block IDs don't change when blocks are moved
     * to different positions in the workout.
     *
     * **Validates: Requirements 2.3**
     */
    it("should preserve block ID when reordering workout steps", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }), // Number of blocks
          fc.integer({ min: 0, max: 4 }), // Source index
          fc.integer({ min: 0, max: 4 }), // Target index
          (numBlocks, sourceIdx, targetIdx) => {
            // Ensure indices are within bounds and different
            const actualSourceIdx = sourceIdx % numBlocks;
            const actualTargetIdx = targetIdx % numBlocks;

            if (actualSourceIdx === actualTargetIdx) {
              return; // Skip if same position
            }

            // Arrange - Create multiple blocks with unique IDs
            const blocks: Array<RepetitionBlock> = Array.from(
              { length: numBlocks },
              (_, i) => createRepetitionBlock(`block-${i}`, 2, 2)
            );

            const krd = createKRDWithWorkout(blocks);
            const state = createInitialState(krd);

            // Store the ID of the block being moved
            const movedBlockId = blocks[actualSourceIdx].id!;

            // Act - Reorder by moving block from source to target
            const result = reorderStepAction(
              krd,
              actualSourceIdx,
              actualTargetIdx,
              state
            );

            // Assert
            const workout =
              result.currentWorkout?.extensions?.structured_workout;
            expect(workout).toBeDefined();

            // Find the moved block in the updated workout
            const movedBlock = workout!.steps.find(
              (step) => isRepetitionBlock(step) && step.id === movedBlockId
            ) as RepetitionBlock | undefined;

            // Block should still exist with the same ID
            expect(movedBlock).toBeDefined();
            expect(movedBlock!.id).toBe(movedBlockId);

            // All original blocks should still be present with their IDs
            const allBlockIds = blocks.map((b) => b.id);
            const updatedBlockIds = workout!.steps
              .filter(isRepetitionBlock)
              .map((b) => b.id);

            expect(updatedBlockIds.sort()).toEqual(allBlockIds.sort());
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any repetition block, its ID should remain constant
     * across multiple sequential operations
     *
     * This tests that IDs remain stable even when multiple operations
     * are performed on the same block.
     *
     * **Validates: Requirements 2.3**
     */
    it("should preserve block ID across multiple operations", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 30 }), // Block ID
          fc.integer({ min: 2, max: 5 }), // Initial repeat count
          fc.integer({ min: 1, max: 3 }), // Initial step count
          fc.integer({ min: 3, max: 8 }), // New repeat count
          (blockId, initialRepeatCount, initialStepCount, newRepeatCount) => {
            // Arrange
            const block = createRepetitionBlock(
              blockId,
              initialRepeatCount,
              initialStepCount
            );
            const krd = createKRDWithWorkout([block]);
            let state = createInitialState(krd);
            let currentKrd = krd;

            // Act - Perform multiple operations

            // Operation 1: Edit repeat count
            let result = editRepetitionBlockAction(
              currentKrd,
              blockId,
              newRepeatCount,
              state
            );
            currentKrd = result.currentWorkout!;
            state = { ...state, ...result };

            // Verify ID after operation 1
            let workout = currentKrd.extensions?.structured_workout;
            let updatedBlock = workout!.steps.find(
              (step) => isRepetitionBlock(step) && step.id === blockId
            ) as RepetitionBlock | undefined;
            expect(updatedBlock).toBeDefined();
            expect(updatedBlock!.id).toBe(blockId);

            // Operation 2: Add a step
            result = addStepToRepetitionBlockAction(currentKrd, blockId, state);
            currentKrd = result.currentWorkout!;
            state = { ...state, ...result };

            // Verify ID after operation 2
            workout = currentKrd.extensions?.structured_workout;
            updatedBlock = workout!.steps.find(
              (step) => isRepetitionBlock(step) && step.id === blockId
            ) as RepetitionBlock | undefined;
            expect(updatedBlock).toBeDefined();
            expect(updatedBlock!.id).toBe(blockId);

            // Operation 3: Edit repeat count again
            result = editRepetitionBlockAction(
              currentKrd,
              blockId,
              initialRepeatCount,
              state
            );
            currentKrd = result.currentWorkout!;

            // Assert - Final verification
            workout = currentKrd.extensions?.structured_workout;
            updatedBlock = workout!.steps.find(
              (step) => isRepetitionBlock(step) && step.id === blockId
            ) as RepetitionBlock | undefined;

            // Block should still exist with the same ID
            expect(updatedBlock).toBeDefined();
            expect(updatedBlock!.id).toBe(blockId);

            // Verify final state
            expect(updatedBlock!.repeatCount).toBe(initialRepeatCount);
            expect(updatedBlock!.steps.length).toBe(initialStepCount + 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any workout with multiple blocks, all block IDs
     * should remain constant when performing operations on any block
     *
     * This ensures that operations on one block don't affect the IDs
     * of other blocks in the workout.
     *
     * **Validates: Requirements 2.3**
     */
    it("should preserve all block IDs when operating on one block", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }), // Number of blocks
          fc.integer({ min: 0, max: 4 }), // Index of block to modify
          fc.integer({ min: 2, max: 10 }), // New repeat count
          (numBlocks, modifyIdx, newRepeatCount) => {
            // Ensure modifyIdx is within bounds
            const actualModifyIdx = modifyIdx % numBlocks;

            // Arrange - Create multiple blocks with unique IDs
            const blocks: Array<RepetitionBlock> = Array.from(
              { length: numBlocks },
              (_, i) =>
                createRepetitionBlock(
                  `block-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  2,
                  2
                )
            );

            const krd = createKRDWithWorkout(blocks);
            const state = createInitialState(krd);

            // Store all original block IDs
            const originalBlockIds = blocks.map((b) => b.id!);

            // Get the ID of the block to modify
            const targetBlockId = blocks[actualModifyIdx].id!;

            // Act - Edit one block's repeat count
            const result = editRepetitionBlockAction(
              krd,
              targetBlockId,
              newRepeatCount,
              state
            );

            // Assert
            const workout =
              result.currentWorkout?.extensions?.structured_workout;
            expect(workout).toBeDefined();

            // Extract all block IDs from the updated workout
            const updatedBlockIds = workout!.steps
              .filter(isRepetitionBlock)
              .map((b) => b.id);

            // All original block IDs should still be present
            expect(updatedBlockIds.sort()).toEqual(originalBlockIds.sort());

            // Verify each block still has its original ID
            blocks.forEach((originalBlock) => {
              const updatedBlock = workout!.steps.find(
                (step) =>
                  isRepetitionBlock(step) && step.id === originalBlock.id
              ) as RepetitionBlock | undefined;

              expect(updatedBlock).toBeDefined();
              expect(updatedBlock!.id).toBe(originalBlock.id);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
