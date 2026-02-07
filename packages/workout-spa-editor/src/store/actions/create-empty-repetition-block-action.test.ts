/**
 * Property-Based Tests for Create Empty Repetition Block Action
 *
 * Tests correctness properties for creating empty repetition blocks.
 */

import { fc } from "@fast-check/vitest";
import { describe, expect, it } from "vitest";
import type { KRD, Workout, WorkoutStep } from "../../types/krd";
import { isRepetitionBlock } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { createEmptyRepetitionBlockAction } from "./create-empty-repetition-block-action";
import { createRepetitionBlockAction } from "./create-repetition-block-action";

/**
 * Helper to create a minimal valid KRD for testing
 */
const createTestKrd = (workout: Workout): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: {
    created: new Date().toISOString(),
    sport: workout.sport,
  },
  extensions: {
    structured_workout: workout,
  },
});

/**
 * Helper to create a minimal workout state for testing
 */
const createTestState = (krd: KRD): WorkoutState => ({
  currentWorkout: krd,
  workoutHistory: [],
  historyIndex: -1,
  selectedStepId: null,
  selectedStepIds: [],
  isEditing: false,
  deletedSteps: [],
});

describe("createEmptyRepetitionBlockAction - Property Tests", () => {
  describe("Property 1: Empty blocks always contain default step", () => {
    /**
     * Feature: 09-repetition-blocks-and-ui-polish, Property 1: Empty blocks always contain default step
     * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
     *
     * For any newly created empty repetition block, the block should contain exactly one step
     * with the default values (5 minutes duration, open target, active intensity)
     */
    it("should add exactly one default step to empty repetition blocks", () => {
      fc.assert(
        fc.property(
          // Generate random repeat counts (1-10)
          fc.integer({ min: 1, max: 10 }),
          (repeatCount) => {
            // Arrange
            const workout: Workout = {
              sport: "running",
              steps: [],
            };
            const krd = createTestKrd(workout);
            const state = createTestState(krd);

            // Act
            const result = createEmptyRepetitionBlockAction(
              krd,
              repeatCount,
              state
            );

            // Assert
            expect(result.currentWorkout).toBeDefined();
            const updatedKrd = result.currentWorkout as KRD;
            const updatedWorkout = updatedKrd.extensions
              ?.structured_workout as Workout;

            // Should have exactly one step (the repetition block)
            expect(updatedWorkout.steps).toHaveLength(1);

            // That step should be a repetition block
            const block = updatedWorkout.steps[0];
            expect(isRepetitionBlock(block)).toBe(true);

            if (isRepetitionBlock(block)) {
              // Block should have exactly one step (the default step)
              expect(block.steps).toHaveLength(1);

              const defaultStep = block.steps[0];

              // Verify default step properties
              expect(defaultStep.stepIndex).toBe(0);
              expect(defaultStep.durationType).toBe("time");
              expect(defaultStep.duration).toEqual({
                type: "time",
                seconds: 300, // 5 minutes
              });
              expect(defaultStep.targetType).toBe("open");
              expect(defaultStep.target).toEqual({ type: "open" });
              expect(defaultStep.intensity).toBe("active");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should add default step with correct properties regardless of existing steps", () => {
      fc.assert(
        fc.property(
          // Generate random repeat counts
          fc.integer({ min: 1, max: 10 }),
          // Generate random number of existing steps
          fc.integer({ min: 0, max: 5 }),
          (repeatCount, existingStepCount) => {
            // Arrange - Create workout with existing steps
            const existingSteps = Array.from(
              { length: existingStepCount },
              (_, i) => ({
                stepIndex: i,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 60 },
                targetType: "open" as const,
                target: { type: "open" as const },
              })
            );

            const workout: Workout = {
              sport: "cycling",
              steps: existingSteps,
            };
            const krd = createTestKrd(workout);
            const state = createTestState(krd);

            // Act
            const result = createEmptyRepetitionBlockAction(
              krd,
              repeatCount,
              state
            );

            // Assert
            const updatedKrd = result.currentWorkout as KRD;
            const updatedWorkout = updatedKrd.extensions
              ?.structured_workout as Workout;

            // Should have existing steps + 1 new block
            expect(updatedWorkout.steps).toHaveLength(existingStepCount + 1);

            // Last step should be the new repetition block
            const lastStep =
              updatedWorkout.steps[updatedWorkout.steps.length - 1];
            expect(isRepetitionBlock(lastStep)).toBe(true);

            if (isRepetitionBlock(lastStep)) {
              // Block should have exactly one default step
              expect(lastStep.steps).toHaveLength(1);

              const defaultStep = lastStep.steps[0];
              expect(defaultStep.duration).toEqual({
                type: "time",
                seconds: 300,
              });
              expect(defaultStep.target).toEqual({ type: "open" });
              expect(defaultStep.intensity).toBe("active");
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 2: Blocks from selected steps preserve step count", () => {
    /**
     * Feature: 09-repetition-blocks-and-ui-polish, Property 2: Blocks from selected steps preserve step count
     * Validates: Requirements 1.6, 7.1
     *
     * For any set of selected steps, creating a repetition block from those steps should result
     * in a block containing exactly those steps with no additions or removals
     */
    it("should preserve exact step count when creating block from selected steps", () => {
      fc.assert(
        fc.property(
          // Generate random number of steps (1-10)
          fc.integer({ min: 1, max: 10 }),
          // Generate random repeat count (2-10, minimum 2 for repetition blocks)
          fc.integer({ min: 2, max: 10 }),
          (stepCount, repeatCount) => {
            // Arrange - Create workout with specified number of steps
            const steps: Array<WorkoutStep> = Array.from(
              { length: stepCount },
              (_, i) => ({
                stepIndex: i,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 60 * (i + 1) },
                targetType: "open" as const,
                target: { type: "open" as const },
              })
            );

            const workout: Workout = {
              sport: "running",
              steps,
            };
            const krd = createTestKrd(workout);
            const state = createTestState(krd);

            // Select all steps
            const stepIndices = Array.from({ length: stepCount }, (_, i) => i);

            // Act - Create repetition block from selected steps
            const result = createRepetitionBlockAction(
              krd,
              stepIndices,
              repeatCount,
              state
            );

            // Assert
            expect(result.currentWorkout).toBeDefined();
            const updatedKrd = result.currentWorkout as KRD;
            const updatedWorkout = updatedKrd.extensions
              ?.structured_workout as Workout;

            // Should have exactly one step (the repetition block)
            expect(updatedWorkout.steps).toHaveLength(1);

            // That step should be a repetition block
            const block = updatedWorkout.steps[0];
            expect(isRepetitionBlock(block)).toBe(true);

            if (isRepetitionBlock(block)) {
              // Block should have exactly the same number of steps as selected
              expect(block.steps).toHaveLength(stepCount);

              // Verify each step is preserved
              block.steps.forEach((step, index) => {
                expect(step.stepIndex).toBe(index);
                expect(step.duration).toEqual({
                  type: "time",
                  seconds: 60 * (index + 1),
                });
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should not add default step when creating block from selected steps", () => {
      fc.assert(
        fc.property(
          // Generate random number of steps (1-5)
          fc.integer({ min: 1, max: 5 }),
          // Generate random repeat count
          fc.integer({ min: 2, max: 10 }),
          (stepCount, repeatCount) => {
            // Arrange
            const steps: Array<WorkoutStep> = Array.from(
              { length: stepCount },
              (_, i) => ({
                stepIndex: i,
                durationType: "distance" as const,
                duration: { type: "distance" as const, meters: 1000 * (i + 1) },
                targetType: "power" as const,
                target: {
                  type: "power" as const,
                  value: { unit: "watts" as const, value: 200 + i * 10 },
                },
              })
            );

            const workout: Workout = {
              sport: "cycling",
              steps,
            };
            const krd = createTestKrd(workout);
            const state = createTestState(krd);

            // Select all steps
            const stepIndices = Array.from({ length: stepCount }, (_, i) => i);

            // Act
            const result = createRepetitionBlockAction(
              krd,
              stepIndices,
              repeatCount,
              state
            );

            // Assert
            const updatedKrd = result.currentWorkout as KRD;
            const updatedWorkout = updatedKrd.extensions
              ?.structured_workout as Workout;
            const block = updatedWorkout.steps[0];

            if (isRepetitionBlock(block)) {
              // Should have exactly the selected steps, no default step added
              expect(block.steps).toHaveLength(stepCount);

              // Verify steps are the original ones, not default steps
              block.steps.forEach((step, index) => {
                expect(step.durationType).toBe("distance");
                expect(step.targetType).toBe("power");
                // Should NOT have default step properties
                expect(step.duration).not.toEqual({
                  type: "time",
                  seconds: 300,
                });
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
