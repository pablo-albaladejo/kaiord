import { describe, expect, it } from "vitest";
import type { KRD, RepetitionBlock, Workout } from "../../types/krd";
import type { WorkoutState } from "../workout-store";
import { reorderStepsInBlockAction } from "./reorder-steps-in-block-action";

describe("reorderStepsInBlockAction", () => {
  const createMockKRD = (workout: Workout): KRD => ({
    version: "1.0",
    type: "structured_workout",
    metadata: {
      created: new Date().toISOString(),
      sport: "cycling",
    },
    extensions: {
      structured_workout: workout,
    },
  });

  const createMockState = (): Partial<WorkoutState> => ({
    currentWorkout: null,
    workoutHistory: [],
    historyIndex: -1,
    selectedStepId: null,
    selectedStepIds: [],
    isEditing: false,
  });

  it("should reorder steps within a repetition block", () => {
    // Arrange
    const block: RepetitionBlock = {
      id: "block-test-1",
      repeatCount: 3,
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "watts", value: 200 },
          },
          intensity: "active",
        },
        {
          stepIndex: 1,
          durationType: "time",
          duration: { type: "time", seconds: 600 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "watts", value: 250 },
          },
          intensity: "active",
        },
        {
          stepIndex: 2,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "watts", value: 150 },
          },
          intensity: "cooldown",
        },
      ],
    };

    const workout: Workout = {
      name: "Test Workout",
      sport: "cycling",
      steps: [block],
    };

    const krd = createMockKRD(workout);
    const state = createMockState();

    // Act - move first step to last position
    const result = reorderStepsInBlockAction(krd, "block-test-1", 0, 2, state);

    // Assert
    expect(result.currentWorkout).toBeDefined();
    const updatedWorkout = result.currentWorkout?.extensions
      ?.structured_workout as Workout;
    expect(updatedWorkout).toBeDefined();

    const updatedBlock = updatedWorkout.steps[0] as RepetitionBlock;
    expect(updatedBlock.steps).toHaveLength(3);

    // Check that steps were reordered
    expect(updatedBlock.steps[0].duration.seconds).toBe(600); // Was second
    expect(updatedBlock.steps[1].duration.seconds).toBe(300); // Was third
    expect(updatedBlock.steps[2].duration.seconds).toBe(300); // Was first

    // Check that stepIndex remains stable (not recalculated)
    expect(updatedBlock.steps[0].stepIndex).toBe(1); // Was step1, keeps stepIndex=1
    expect(updatedBlock.steps[1].stepIndex).toBe(2); // Was step2, keeps stepIndex=2
    expect(updatedBlock.steps[2].stepIndex).toBe(0); // Was step0, keeps stepIndex=0
  });

  it("should return empty object when activeIndex equals overIndex", () => {
    // Arrange
    const block: RepetitionBlock = {
      id: "block-test-2",
      repeatCount: 2,
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "watts", value: 200 },
          },
          intensity: "active",
        },
      ],
    };

    const workout: Workout = {
      name: "Test Workout",
      sport: "cycling",
      steps: [block],
    };

    const krd = createMockKRD(workout);
    const state = createMockState();

    // Act
    const result = reorderStepsInBlockAction(krd, "block-test-2", 0, 0, state);

    // Assert
    expect(result).toEqual({});
  });

  it("should return empty object when block is not found", () => {
    // Arrange
    const workout: Workout = {
      name: "Test Workout",
      sport: "cycling",
      steps: [],
    };

    const krd = createMockKRD(workout);
    const state = createMockState();

    // Act
    const result = reorderStepsInBlockAction(
      krd,
      "non-existent-block",
      0,
      1,
      state
    );

    // Assert
    expect(result).toEqual({});
  });

  it("should return empty object when step indices are out of bounds", () => {
    // Arrange
    const block: RepetitionBlock = {
      id: "block-test-3",
      repeatCount: 2,
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "watts", value: 200 },
          },
          intensity: "active",
        },
      ],
    };

    const workout: Workout = {
      name: "Test Workout",
      sport: "cycling",
      steps: [block],
    };

    const krd = createMockKRD(workout);
    const state = createMockState();

    // Act
    const result = reorderStepsInBlockAction(krd, "block-test-3", 0, 5, state);

    // Assert
    expect(result).toEqual({});
  });

  it("should return empty object when item is not a repetition block", () => {
    // Arrange
    const workout: Workout = {
      name: "Test Workout",
      sport: "cycling",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "watts", value: 200 },
          },
          intensity: "active",
        },
      ],
    };

    const krd = createMockKRD(workout);
    const state = createMockState();

    // Act
    const result = reorderStepsInBlockAction(
      krd,
      "non-existent-block",
      0,
      1,
      state
    );

    // Assert
    expect(result).toEqual({});
  });

  it("should return empty object when workout is not present", () => {
    // Arrange
    const krd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: new Date().toISOString(),
        sport: "cycling",
      },
    };

    const state = createMockState();

    // Act
    const result = reorderStepsInBlockAction(krd, "any-block-id", 0, 1, state);

    // Assert
    expect(result).toEqual({});
  });
});
