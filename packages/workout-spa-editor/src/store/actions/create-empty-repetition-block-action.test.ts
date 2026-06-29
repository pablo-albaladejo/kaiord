/**
 * Property-Based Tests for Create Empty Repetition Block Action
 *
 * Tests correctness properties for creating empty repetition blocks.
 */

import { fc } from "@fast-check/vitest";
import { describe, expect, it } from "vitest";

import type { KRD, Workout } from "../../types/krd";
import { isRepetitionBlock } from "../../types/krd";
import type { WorkoutState } from "../workout-actions";
import { createEmptyRepetitionBlockAction } from "./create-empty-repetition-block-action";

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
  undoHistory: [],
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
      // Arrange

      // Act

      // Assert
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
      // Arrange

      // Act

      // Assert
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
});
