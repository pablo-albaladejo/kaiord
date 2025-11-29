/**
 * Create Repetition Block Action Tests
 *
 * Tests for the create repetition block action.
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { KRD } from "../../types/krd";
import { isRepetitionBlock, isWorkoutStep } from "../../types/krd";
import { useWorkoutStore } from "../workout-store";

describe("createRepetitionBlock", () => {
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

  it("should wrap selected steps in a repetition block", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
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
              durationType: "time",
              duration: { type: "time", seconds: 600 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "watts", value: 250 },
              },
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
            },
          ],
        },
      },
    };

    useWorkoutStore.getState().loadWorkout(mockKrd);

    // Act - Wrap steps 0 and 1 in a repetition block
    useWorkoutStore.getState().createRepetitionBlock([0, 1], 3);
    const state = useWorkoutStore.getState();

    // Assert
    const workout = state.currentWorkout?.extensions?.workout;
    expect(workout?.steps).toHaveLength(2);

    // First item should be a repetition block
    const firstItem = workout?.steps[0];
    expect(isRepetitionBlock(firstItem)).toBe(true);

    if (isRepetitionBlock(firstItem)) {
      expect(firstItem.repeatCount).toBe(3);
      expect(firstItem.steps).toHaveLength(2);
      expect(firstItem.steps[0].duration).toEqual({
        type: "time",
        seconds: 300,
      });
      expect(firstItem.steps[1].duration).toEqual({
        type: "time",
        seconds: 600,
      });
    }

    // Second item should be the remaining step with recalculated index
    const secondItem = workout?.steps[1];
    expect(isWorkoutStep(secondItem)).toBe(true);

    if (isWorkoutStep(secondItem)) {
      expect(secondItem.stepIndex).toBe(0);
      expect(secondItem.duration).toEqual({ type: "time", seconds: 300 });
      expect(secondItem.target).toEqual({
        type: "power",
        value: { unit: "watts", value: 150 },
      });
    }
  });

  it("should handle non-contiguous step indices", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "cycling",
      },
      extensions: {
        workout: {
          sport: "cycling",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "open",
              target: { type: "open" },
            },
            {
              stepIndex: 1,
              durationType: "time",
              duration: { type: "time", seconds: 600 },
              targetType: "open",
              target: { type: "open" },
            },
            {
              stepIndex: 2,
              durationType: "time",
              duration: { type: "time", seconds: 900 },
              targetType: "open",
              target: { type: "open" },
            },
            {
              stepIndex: 3,
              durationType: "time",
              duration: { type: "time", seconds: 1200 },
              targetType: "open",
              target: { type: "open" },
            },
          ],
        },
      },
    };

    useWorkoutStore.getState().loadWorkout(mockKrd);

    // Act - Wrap steps 0 and 2 (non-contiguous)
    useWorkoutStore.getState().createRepetitionBlock([0, 2], 2);
    const state = useWorkoutStore.getState();

    // Assert
    const workout = state.currentWorkout?.extensions?.workout;
    expect(workout?.steps).toHaveLength(3);

    // First item should be a repetition block with steps 0 and 2
    const firstItem = workout?.steps[0];
    expect(isRepetitionBlock(firstItem)).toBe(true);

    if (isRepetitionBlock(firstItem)) {
      expect(firstItem.repeatCount).toBe(2);
      expect(firstItem.steps).toHaveLength(2);
      expect(firstItem.steps[0].duration).toEqual({
        type: "time",
        seconds: 300,
      });
      expect(firstItem.steps[1].duration).toEqual({
        type: "time",
        seconds: 900,
      });
    }

    // Remaining steps should be reindexed
    const secondItem = workout?.steps[1];
    expect(isWorkoutStep(secondItem)).toBe(true);
    if (isWorkoutStep(secondItem)) {
      expect(secondItem.stepIndex).toBe(0);
      expect(secondItem.duration).toEqual({ type: "time", seconds: 600 });
    }

    const thirdItem = workout?.steps[2];
    expect(isWorkoutStep(thirdItem)).toBe(true);
    if (isWorkoutStep(thirdItem)) {
      expect(thirdItem.stepIndex).toBe(1);
      expect(thirdItem.duration).toEqual({ type: "time", seconds: 1200 });
    }
  });

  it("should sort step indices before creating block", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "swimming",
      },
      extensions: {
        workout: {
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

    // Act - Pass indices in reverse order
    useWorkoutStore.getState().createRepetitionBlock([2, 0, 1], 4);
    const state = useWorkoutStore.getState();

    // Assert
    const workout = state.currentWorkout?.extensions?.workout;
    expect(workout?.steps).toHaveLength(1);

    const block = workout?.steps[0];
    expect(isRepetitionBlock(block)).toBe(true);

    if (isRepetitionBlock(block)) {
      expect(block.repeatCount).toBe(4);
      expect(block.steps).toHaveLength(3);
      // Steps should be in original order (0, 1, 2)
      expect(block.steps[0].duration).toEqual({
        type: "distance",
        meters: 500,
      });
      expect(block.steps[1].duration).toEqual({
        type: "distance",
        meters: 1000,
      });
      expect(block.steps[2].duration).toEqual({
        type: "distance",
        meters: 1500,
      });
    }
  });

  it("should add creation to history", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
          sport: "running",
          steps: [
            {
              stepIndex: 0,
              durationType: "open",
              duration: { type: "open" },
              targetType: "open",
              target: { type: "open" },
            },
            {
              stepIndex: 1,
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
    useWorkoutStore.getState().createRepetitionBlock([0, 1], 2);
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
    useWorkoutStore.getState().createRepetitionBlock([0, 1], 2);
    const state = useWorkoutStore.getState();

    // Assert
    expect(state.currentWorkout).toBeNull();
    expect(state.workoutHistory).toHaveLength(0);
  });

  it("should do nothing when step indices array is empty", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "cycling",
      },
      extensions: {
        workout: {
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

    // Act
    useWorkoutStore.getState().createRepetitionBlock([], 2);
    const state = useWorkoutStore.getState();

    // Assert
    const workout = state.currentWorkout?.extensions?.workout;
    expect(workout?.steps).toHaveLength(1);
    expect(state.workoutHistory).toHaveLength(1); // Only the initial load
  });

  it("should do nothing when repeat count is less than 2", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
          sport: "running",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "open",
              target: { type: "open" },
            },
            {
              stepIndex: 1,
              durationType: "time",
              duration: { type: "time", seconds: 600 },
              targetType: "open",
              target: { type: "open" },
            },
          ],
        },
      },
    };

    useWorkoutStore.getState().loadWorkout(mockKrd);

    // Act
    useWorkoutStore.getState().createRepetitionBlock([0, 1], 1);
    const state = useWorkoutStore.getState();

    // Assert
    const workout = state.currentWorkout?.extensions?.workout;
    expect(workout?.steps).toHaveLength(2);
    expect(state.workoutHistory).toHaveLength(1); // Only the initial load
  });

  it("should wrap a single step in a repetition block", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "cycling",
      },
      extensions: {
        workout: {
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

    // Act - Wrap only step 0
    useWorkoutStore.getState().createRepetitionBlock([0], 5);
    const state = useWorkoutStore.getState();

    // Assert
    const workout = state.currentWorkout?.extensions?.workout;
    expect(workout?.steps).toHaveLength(2);

    const firstItem = workout?.steps[0];
    expect(isRepetitionBlock(firstItem)).toBe(true);

    if (isRepetitionBlock(firstItem)) {
      expect(firstItem.repeatCount).toBe(5);
      expect(firstItem.steps).toHaveLength(1);
      expect(firstItem.steps[0].duration).toEqual({
        type: "time",
        seconds: 300,
      });
    }

    const secondItem = workout?.steps[1];
    expect(isWorkoutStep(secondItem)).toBe(true);
    if (isWorkoutStep(secondItem)) {
      expect(secondItem.stepIndex).toBe(0);
    }
  });

  it("should preserve step properties in repetition block", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
          sport: "running",
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
    useWorkoutStore.getState().createRepetitionBlock([0], 3);
    const state = useWorkoutStore.getState();

    // Assert
    const workout = state.currentWorkout?.extensions?.workout;
    const block = workout?.steps[0];

    expect(isRepetitionBlock(block)).toBe(true);

    if (isRepetitionBlock(block)) {
      expect(block.steps[0]).toEqual({
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
      });
    }
  });
});

/**
 * Property-Based Tests
 *
 * Feature: workout-spa-editor/08-pr25-fixes, Property 1: Insertion order preservation
 * Validates: Requirements 1.1, 1.2, 1.3
 */
describe("createRepetitionBlock - Property Tests", () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      isEditing: false,
    });
  });

  /**
   * Edge Case Tests
   */
  it("should handle empty workout (workout with no steps)", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
          sport: "running",
          steps: [],
        },
      },
    };

    useWorkoutStore.getState().loadWorkout(mockKrd);

    // Act
    useWorkoutStore.getState().createRepetitionBlock([0, 1], 2);
    const state = useWorkoutStore.getState();

    // Assert
    const workout = state.currentWorkout?.extensions?.workout;
    expect(workout?.steps).toHaveLength(0);
    expect(state.workoutHistory).toHaveLength(1); // Only the initial load
  });

  it("should handle workout with existing repetition blocks", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "cycling",
      },
      extensions: {
        workout: {
          sport: "cycling",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "open",
              target: { type: "open" },
            },
            {
              repeatCount: 3,
              steps: [
                {
                  stepIndex: 1,
                  durationType: "time",
                  duration: { type: "time", seconds: 600 },
                  targetType: "power",
                  target: {
                    type: "power",
                    value: { unit: "watts", value: 200 },
                  },
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
                },
              ],
            },
            {
              stepIndex: 3,
              durationType: "time",
              duration: { type: "time", seconds: 900 },
              targetType: "open",
              target: { type: "open" },
            },
          ],
        },
      },
    };

    useWorkoutStore.getState().loadWorkout(mockKrd);

    // Act - Wrap steps 0 and 3 (skipping the existing repetition block)
    useWorkoutStore.getState().createRepetitionBlock([0, 3], 2);
    const state = useWorkoutStore.getState();

    // Assert
    const workout = state.currentWorkout?.extensions?.workout;
    expect(workout?.steps).toHaveLength(2);

    // First item should be the new repetition block
    const firstItem = workout?.steps[0];
    expect(isRepetitionBlock(firstItem)).toBe(true);

    if (isRepetitionBlock(firstItem)) {
      expect(firstItem.repeatCount).toBe(2);
      expect(firstItem.steps).toHaveLength(2);
      expect(firstItem.steps[0].duration).toEqual({
        type: "time",
        seconds: 300,
      });
      expect(firstItem.steps[1].duration).toEqual({
        type: "time",
        seconds: 900,
      });
    }

    // Second item should be the existing repetition block (preserved)
    const secondItem = workout?.steps[1];
    expect(isRepetitionBlock(secondItem)).toBe(true);

    if (isRepetitionBlock(secondItem)) {
      expect(secondItem.repeatCount).toBe(3);
      expect(secondItem.steps).toHaveLength(2);
    }
  });

  it("should handle mixed steps and blocks correctly", () => {
    // Arrange
    const mockKrd: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
          sport: "running",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "open",
              target: { type: "open" },
            },
            {
              repeatCount: 2,
              steps: [
                {
                  stepIndex: 1,
                  durationType: "time",
                  duration: { type: "time", seconds: 600 },
                  targetType: "open",
                  target: { type: "open" },
                },
              ],
            },
            {
              stepIndex: 2,
              durationType: "time",
              duration: { type: "time", seconds: 900 },
              targetType: "open",
              target: { type: "open" },
            },
            {
              stepIndex: 3,
              durationType: "time",
              duration: { type: "time", seconds: 1200 },
              targetType: "open",
              target: { type: "open" },
            },
          ],
        },
      },
    };

    useWorkoutStore.getState().loadWorkout(mockKrd);

    // Act - Wrap steps 2 and 3 (after the existing block)
    useWorkoutStore.getState().createRepetitionBlock([2, 3], 4);
    const state = useWorkoutStore.getState();

    // Assert
    const workout = state.currentWorkout?.extensions?.workout;
    expect(workout?.steps).toHaveLength(3);

    // First item should be step 0
    const firstItem = workout?.steps[0];
    expect(isWorkoutStep(firstItem)).toBe(true);
    if (isWorkoutStep(firstItem)) {
      expect(firstItem.stepIndex).toBe(0);
      expect(firstItem.duration).toEqual({ type: "time", seconds: 300 });
    }

    // Second item should be the existing repetition block
    const secondItem = workout?.steps[1];
    expect(isRepetitionBlock(secondItem)).toBe(true);
    if (isRepetitionBlock(secondItem)) {
      expect(secondItem.repeatCount).toBe(2);
    }

    // Third item should be the new repetition block
    const thirdItem = workout?.steps[2];
    expect(isRepetitionBlock(thirdItem)).toBe(true);
    if (isRepetitionBlock(thirdItem)) {
      expect(thirdItem.repeatCount).toBe(4);
      expect(thirdItem.steps).toHaveLength(2);
      expect(thirdItem.steps[0].duration).toEqual({
        type: "time",
        seconds: 900,
      });
      expect(thirdItem.steps[1].duration).toEqual({
        type: "time",
        seconds: 1200,
      });
    }
  });

  /**
   * Property 1: Insertion order preservation
   *
   * For any workout with existing steps and repetition blocks, when creating
   * a new repetition block from selected steps, the relative order of all
   * non-selected steps and existing blocks should remain unchanged.
   */
  it("should preserve relative order of non-selected items (property test)", () => {
    // Run property test with multiple iterations
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      // Arrange - Generate random workout structure
      const numSteps = Math.floor(Math.random() * 10) + 3; // 3-12 steps
      const steps = Array.from({ length: numSteps }, (_, idx) => ({
        stepIndex: idx,
        durationType: "time" as const,
        duration: { type: "time" as const, seconds: 300 + idx * 60 },
        targetType: "open" as const,
        target: { type: "open" as const },
      }));

      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            sport: "running",
            steps,
          },
        },
      };

      // Select random subset of steps (at least 1, at most numSteps-1)
      const numToSelect = Math.floor(Math.random() * (numSteps - 1)) + 1;
      const selectedIndices: number[] = [];
      const availableIndices = Array.from(
        { length: numSteps },
        (_, idx) => idx
      );

      for (let j = 0; j < numToSelect; j++) {
        const randomIdx = Math.floor(Math.random() * availableIndices.length);
        selectedIndices.push(availableIndices[randomIdx]);
        availableIndices.splice(randomIdx, 1);
      }

      // Track non-selected steps before transformation
      const nonSelectedSteps = steps.filter(
        (step) => !selectedIndices.includes(step.stepIndex)
      );
      const nonSelectedDurations = nonSelectedSteps.map(
        (step) => step.duration.seconds
      );

      useWorkoutStore.getState().loadWorkout(mockKrd);

      // Act
      useWorkoutStore.getState().createRepetitionBlock(selectedIndices, 2);
      const state = useWorkoutStore.getState();

      // Assert - Verify non-selected items maintain relative order
      const workout = state.currentWorkout?.extensions?.workout;
      expect(workout).toBeDefined();

      if (workout) {
        // Extract non-selected steps from result (skip repetition blocks)
        const resultNonSelectedSteps = workout.steps.filter(
          (item) => isWorkoutStep(item) && item
        );
        const resultDurations = resultNonSelectedSteps.map((step) => {
          if (isWorkoutStep(step)) {
            return step.duration.seconds;
          }
          return -1;
        });

        // Verify same durations in same order
        expect(resultDurations).toEqual(nonSelectedDurations);
      }

      // Reset for next iteration
      useWorkoutStore.setState({
        currentWorkout: null,
        workoutHistory: [],
        historyIndex: -1,
      });
    }
  });
});
