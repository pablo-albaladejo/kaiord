import { describe, expect, it } from "vitest";
import type { Workout, WorkoutStep } from "../../../types/krd";
import { createUpdatedWorkout } from "./workout-section-handlers-helpers";

/**
 * Tests for workout section handler helpers
 *
 * Validates Requirements 1.1, 1.2:
 * - Step editing uses correct hierarchical IDs
 * - Only the selected step is updated, not steps with same stepIndex
 */
describe("createUpdatedWorkout", () => {
  const createMockStep = (stepIndex: number): WorkoutStep => ({
    stepIndex,
    durationType: "time",
    duration: { type: "time", seconds: 300 },
    targetType: "power",
    target: {
      type: "power",
      value: { unit: "watts", value: 200 },
    },
    intensity: "active",
  });

  const createMockWorkout = (): Workout => ({
    name: "Test Workout",
    sport: "cycling",
    steps: [
      createMockStep(0), // Main workout step
      createMockStep(1), // Main workout step
      {
        // Repetition block at index 2
        repeatCount: 3,
        steps: [
          createMockStep(1), // Block step with same stepIndex as main workout
          createMockStep(2),
        ],
      },
      {
        // Repetition block at index 3
        repeatCount: 2,
        steps: [
          createMockStep(1), // Block step with same stepIndex as main workout
          createMockStep(3),
        ],
      },
    ],
  });

  describe("updating main workout steps", () => {
    it("should update only the main workout step when selectedStepId is step-1", () => {
      // Arrange
      const workout = createMockWorkout();
      const updatedStep: WorkoutStep = {
        ...createMockStep(1),
        duration: { type: "time", seconds: 600 }, // Changed duration
      };
      const selectedStepId = "step-1";

      // Act
      const result = createUpdatedWorkout(workout, updatedStep, selectedStepId);

      // Assert
      // Main workout step should be updated
      expect(result.steps[1]).toEqual(updatedStep);

      // Block steps with same stepIndex should NOT be updated
      const block1 = result.steps[2];
      const block2 = result.steps[3];
      if ("repeatCount" in block1 && "repeatCount" in block2) {
        expect(block1.steps[0].duration).toEqual({
          type: "time",
          seconds: 300,
        }); // Original
        expect(block2.steps[0].duration).toEqual({
          type: "time",
          seconds: 300,
        }); // Original
      }
    });
  });

  describe("updating block steps", () => {
    it("should update only the step in Block A when selectedStepId is block-2-step-1", () => {
      // Arrange
      const workout = createMockWorkout();
      const updatedStep: WorkoutStep = {
        ...createMockStep(1),
        duration: { type: "time", seconds: 900 }, // Changed duration
      };
      const selectedStepId = "block-2-step-1"; // Block at array index 2, step with stepIndex 1

      // Act
      const result = createUpdatedWorkout(workout, updatedStep, selectedStepId);

      // Assert
      // Main workout step should NOT be updated
      expect(result.steps[1]).toEqual(createMockStep(1));

      // Block A step should be updated
      const blockA = result.steps[2];
      if ("repeatCount" in blockA) {
        expect(blockA.steps[0].duration).toEqual({
          type: "time",
          seconds: 900,
        }); // Updated
      }

      // Block B step should NOT be updated
      const blockB = result.steps[3];
      if ("repeatCount" in blockB) {
        expect(blockB.steps[0].duration).toEqual({
          type: "time",
          seconds: 300,
        }); // Original
      }
    });

    it("should update only the step in Block B when selectedStepId is block-3-step-1", () => {
      // Arrange
      const workout = createMockWorkout();
      const updatedStep: WorkoutStep = {
        ...createMockStep(1),
        duration: { type: "time", seconds: 1200 }, // Changed duration
      };
      const selectedStepId = "block-3-step-1"; // Block at array index 3, step with stepIndex 1

      // Act
      const result = createUpdatedWorkout(workout, updatedStep, selectedStepId);

      // Assert
      // Main workout step should NOT be updated
      expect(result.steps[1]).toEqual(createMockStep(1));

      // Block A step should NOT be updated
      const blockA = result.steps[2];
      if ("repeatCount" in blockA) {
        expect(blockA.steps[0].duration).toEqual({
          type: "time",
          seconds: 300,
        }); // Original
      }

      // Block B step should be updated
      const blockB = result.steps[3];
      if ("repeatCount" in blockB) {
        expect(blockB.steps[0].duration).toEqual({
          type: "time",
          seconds: 1200,
        }); // Updated
      }
    });
  });

  describe("edge cases", () => {
    it("should return unchanged workout when selectedStepId is null", () => {
      // Arrange
      const workout = createMockWorkout();
      const updatedStep = createMockStep(1);
      const selectedStepId = null;

      // Act
      const result = createUpdatedWorkout(workout, updatedStep, selectedStepId);

      // Assert
      expect(result).toEqual(workout);
    });

    it("should return unchanged workout when selectedStepId is invalid", () => {
      // Arrange
      const workout = createMockWorkout();
      const updatedStep = createMockStep(1);
      const selectedStepId = "invalid-id-format";

      // Act
      const result = createUpdatedWorkout(workout, updatedStep, selectedStepId);

      // Assert
      expect(result).toEqual(workout);
    });

    it("should return unchanged workout when selectedStepId is a block ID", () => {
      // Arrange
      const workout = createMockWorkout();
      const updatedStep = createMockStep(1);
      const selectedStepId = "block-2"; // Block ID, not step ID

      // Act
      const result = createUpdatedWorkout(workout, updatedStep, selectedStepId);

      // Assert
      expect(result).toEqual(workout);
    });
  });
});
