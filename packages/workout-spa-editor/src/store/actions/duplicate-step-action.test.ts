/**
 * Duplicate Step Action Tests
 *
 * Tests for the duplicate step action.
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { KRD } from "../../types/krd";
import { useWorkoutStore } from "../workout-store";

describe("duplicateStep", () => {
  // Reset store before each test
  beforeEach(() => {
    useWorkoutStore.setState({
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      isEditing: false,
    });
  });

  it("should duplicate a step and insert it after the original", () => {
    // Arrange
    const mockKrd: KRD = {
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
            },
            {
              stepIndex: 1,
              durationType: "distance",
              duration: { type: "distance", meters: 1000 },
              targetType: "heart_rate",
              target: {
                type: "heart_rate",
                value: { unit: "bpm", value: 150 },
              },
            },
          ],
        },
      },
    };

    useWorkoutStore.getState().loadWorkout(mockKrd);

    // Act
    useWorkoutStore.getState().duplicateStep(0);
    const state = useWorkoutStore.getState();

    // Assert
    const workout = state.currentWorkout?.extensions?.structured_workout;
    expect(workout?.steps).toHaveLength(3);

    // Original step at index 0
    expect(workout?.steps[0].stepIndex).toBe(0);
    expect(workout?.steps[0].duration).toEqual({ type: "time", seconds: 300 });

    // Duplicated step at index 1
    expect(workout?.steps[1].stepIndex).toBe(1);
    expect(workout?.steps[1].duration).toEqual({ type: "time", seconds: 300 });
    expect(workout?.steps[1].target).toEqual({
      type: "power",
      value: { unit: "watts", value: 200 },
    });

    // Original second step now at index 2
    expect(workout?.steps[2].stepIndex).toBe(2);
    expect(workout?.steps[2].duration).toEqual({
      type: "distance",
      meters: 1000,
    });
  });

  it("should create a deep clone of the step", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "cycling",
      },
      extensions: {
        structured_workout: {
          sport: "cycling",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 600 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "zone", value: 3 },
              },
              notes: "Test notes",
            },
          ],
        },
      },
    };

    useWorkoutStore.getState().loadWorkout(mockKrd);

    // Act
    useWorkoutStore.getState().duplicateStep(0);
    const state = useWorkoutStore.getState();

    // Assert
    const workout = state.currentWorkout?.extensions?.structured_workout;
    expect(workout?.steps).toHaveLength(2);

    // Verify the duplicated step is a deep clone
    expect(workout?.steps[1]).toEqual({
      stepIndex: 1,
      durationType: "time",
      duration: { type: "time", seconds: 600 },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "zone", value: 3 },
      },
      notes: "Test notes",
    });

    // Verify they are not the same object reference
    expect(workout?.steps[0]).not.toBe(workout?.steps[1]);
  });

  it("should recalculate stepIndex for all subsequent steps", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "swimming",
      },
      extensions: {
        structured_workout: {
          sport: "swimming",
          steps: [
            {
              stepIndex: 0,
              durationType: "distance",
              duration: { type: "distance", meters: 500 },
              targetType: "open",
              target: { type: "open" },
            },
            {
              stepIndex: 1,
              durationType: "distance",
              duration: { type: "distance", meters: 1000 },
              targetType: "open",
              target: { type: "open" },
            },
            {
              stepIndex: 2,
              durationType: "distance",
              duration: { type: "distance", meters: 1500 },
              targetType: "open",
              target: { type: "open" },
            },
          ],
        },
      },
    };

    useWorkoutStore.getState().loadWorkout(mockKrd);

    // Act - Duplicate the first step
    useWorkoutStore.getState().duplicateStep(0);
    const state = useWorkoutStore.getState();

    // Assert
    const workout = state.currentWorkout?.extensions?.structured_workout;
    expect(workout?.steps).toHaveLength(4);

    // Verify all stepIndex values are sequential
    expect(workout?.steps[0].stepIndex).toBe(0);
    expect(workout?.steps[0].duration).toEqual({
      type: "distance",
      meters: 500,
    });

    expect(workout?.steps[1].stepIndex).toBe(1);
    expect(workout?.steps[1].duration).toEqual({
      type: "distance",
      meters: 500,
    });

    expect(workout?.steps[2].stepIndex).toBe(2);
    expect(workout?.steps[2].duration).toEqual({
      type: "distance",
      meters: 1000,
    });

    expect(workout?.steps[3].stepIndex).toBe(3);
    expect(workout?.steps[3].duration).toEqual({
      type: "distance",
      meters: 1500,
    });
  });

  it("should add duplication to history", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        structured_workout: {
          sport: "running",
          steps: [
            {
              stepIndex: 0,
              durationType: "open",
              duration: { type: "open" },
              targetType: "open",
              target: { type: "open" },
            },
          ],
        },
      },
    };

    useWorkoutStore.getState().loadWorkout(mockKrd);

    // Act
    useWorkoutStore.getState().duplicateStep(0);
    const state = useWorkoutStore.getState();

    // Assert
    expect(state.workoutHistory).toHaveLength(2);
    expect(state.historyIndex).toBe(1);
  });

  it("should do nothing when no workout is loaded", () => {
    // Arrange
    useWorkoutStore.setState({
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
    });

    // Act
    useWorkoutStore.getState().duplicateStep(0);
    const state = useWorkoutStore.getState();

    // Assert
    expect(state.currentWorkout).toBeNull();
    expect(state.workoutHistory).toHaveLength(0);
  });

  it("should do nothing when step index does not exist", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "cycling",
      },
      extensions: {
        structured_workout: {
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
            },
          ],
        },
      },
    };

    useWorkoutStore.getState().loadWorkout(mockKrd);

    // Act - Try to duplicate non-existent step
    useWorkoutStore.getState().duplicateStep(5);
    const state = useWorkoutStore.getState();

    // Assert - Workout should remain unchanged
    const workout = state.currentWorkout?.extensions?.structured_workout;
    expect(workout?.steps).toHaveLength(1);
    expect(state.workoutHistory).toHaveLength(1); // Only the initial load
  });

  it("should duplicate the last step in workout", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        structured_workout: {
          sport: "running",
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
            },
          ],
        },
      },
    };

    useWorkoutStore.getState().loadWorkout(mockKrd);

    // Act - Duplicate the last step
    useWorkoutStore.getState().duplicateStep(1);
    const state = useWorkoutStore.getState();

    // Assert
    const workout = state.currentWorkout?.extensions?.structured_workout;
    expect(workout?.steps).toHaveLength(3);

    expect(workout?.steps[0].stepIndex).toBe(0);
    expect(workout?.steps[1].stepIndex).toBe(1);
    expect(workout?.steps[2].stepIndex).toBe(2);

    // Verify the last step is duplicated
    expect(workout?.steps[2].duration).toEqual({ type: "time", seconds: 600 });
    expect(workout?.steps[2].target).toEqual({
      type: "power",
      value: { unit: "watts", value: 250 },
    });
  });

  it("should duplicate a step with complex target structure", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "cycling",
      },
      extensions: {
        structured_workout: {
          sport: "cycling",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 1200 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "range", min: 200, max: 250 },
              },
              intensity: "active",
              notes: "Steady effort",
            },
          ],
        },
      },
    };

    useWorkoutStore.getState().loadWorkout(mockKrd);

    // Act
    useWorkoutStore.getState().duplicateStep(0);
    const state = useWorkoutStore.getState();

    // Assert
    const workout = state.currentWorkout?.extensions?.structured_workout;
    expect(workout?.steps).toHaveLength(2);

    // Verify complex structure is preserved
    expect(workout?.steps[1]).toEqual({
      stepIndex: 1,
      durationType: "time",
      duration: { type: "time", seconds: 1200 },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "range", min: 200, max: 250 },
      },
      intensity: "active",
      notes: "Steady effort",
    });
  });
});
