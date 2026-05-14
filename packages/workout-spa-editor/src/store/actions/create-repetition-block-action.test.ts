/**
 * Create Repetition Block Action Tests
 *
 * Tests for the create repetition block action.
 */

import { beforeEach, describe, expect, it } from "vitest";

import type { KRD } from "../../types/krd";
import { isRepetitionBlock, isWorkoutStep } from "../../types/krd";
import { useWorkoutStore } from "../workout-store";
import {
  ITER_COUNT_FIVE,
  ITER_COUNT_FOUR,
  ITER_COUNT_THREE,
  PROPERTY_TEST_BASE_DURATION_S,
  PROPERTY_TEST_DURATION_INCREMENT_S,
  PROPERTY_TEST_MIN_STEPS,
  PROPERTY_TEST_RANDOM_RANGE,
  STEP_COUNT_THREE,
} from "./create-repetition-block-action.test-fixtures";

describe("createRepetitionBlock", () => {
  // Reset store before each test
  beforeEach(() => {
    useWorkoutStore.setState({
      currentWorkout: null,
      undoHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      isEditing: false,
    });
  });

  it("should wrap selected steps in a repetition block", () => {
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
    useWorkoutStore.getState().createRepetitionBlock([0, 1], ITER_COUNT_THREE);
    const state = useWorkoutStore.getState();
    const workout = state.currentWorkout?.extensions?.structured_workout;
    expect(workout?.steps).toHaveLength(2);
    const firstItem = workout?.steps[0];
    expect(isRepetitionBlock(firstItem)).toBe(true);
    if (isRepetitionBlock(firstItem)) {
      expect(firstItem.repeatCount).toBe(ITER_COUNT_THREE);
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

    // Act
    const secondItem = workout?.steps[1];

    // Assert
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
    useWorkoutStore.getState().createRepetitionBlock([0, 2], 2);
    const state = useWorkoutStore.getState();
    const workout = state.currentWorkout?.extensions?.structured_workout;
    expect(workout?.steps).toHaveLength(STEP_COUNT_THREE);
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
    const secondItem = workout?.steps[1];
    expect(isWorkoutStep(secondItem)).toBe(true);
    if (isWorkoutStep(secondItem)) {
      expect(secondItem.stepIndex).toBe(0);
      expect(secondItem.duration).toEqual({ type: "time", seconds: 600 });
    }

    // Act
    const thirdItem = workout?.steps[2];

    // Assert
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
    useWorkoutStore
      .getState()
      .createRepetitionBlock([2, 0, 1], ITER_COUNT_FOUR);
    const state = useWorkoutStore.getState();
    const workout = state.currentWorkout?.extensions?.structured_workout;
    expect(workout?.steps).toHaveLength(1);

    // Act
    const block = workout?.steps[0];

    // Assert
    expect(isRepetitionBlock(block)).toBe(true);
    if (isRepetitionBlock(block)) {
      expect(block.repeatCount).toBe(ITER_COUNT_FOUR);
      expect(block.steps).toHaveLength(STEP_COUNT_THREE);
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
    useWorkoutStore.getState().createRepetitionBlock([0, 1], 2);

    // Act
    const state = useWorkoutStore.getState();

    // Assert
    expect(state.undoHistory).toHaveLength(2);
    expect(state.historyIndex).toBe(1);
  });

  it("should do nothing when no workout is loaded", () => {
    // Arrange
    useWorkoutStore.setState({
      currentWorkout: null,
      undoHistory: [],
      historyIndex: -1,
    });
    useWorkoutStore.getState().createRepetitionBlock([0, 1], 2);

    // Act
    const state = useWorkoutStore.getState();

    // Assert
    expect(state.currentWorkout).toBeNull();
    expect(state.undoHistory).toHaveLength(0);
  });

  it("should do nothing when step indices array is empty", () => {
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
    useWorkoutStore.getState().createRepetitionBlock([], 2);
    const state = useWorkoutStore.getState();

    // Act
    const workout = state.currentWorkout?.extensions?.structured_workout;

    // Assert
    expect(workout?.steps).toHaveLength(1);
    expect(state.undoHistory).toHaveLength(1);
  });

  it("should do nothing when repeat count is less than 2", () => {
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
    useWorkoutStore.getState().createRepetitionBlock([0, 1], 1);
    const state = useWorkoutStore.getState();

    // Act
    const workout = state.currentWorkout?.extensions?.structured_workout;

    // Assert
    expect(workout?.steps).toHaveLength(2);
    expect(state.undoHistory).toHaveLength(1);
  });

  it("should wrap a single step in a repetition block", () => {
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
    useWorkoutStore.getState().createRepetitionBlock([0], ITER_COUNT_FIVE);
    const state = useWorkoutStore.getState();
    const workout = state.currentWorkout?.extensions?.structured_workout;
    expect(workout?.steps).toHaveLength(2);
    const firstItem = workout?.steps[0];
    expect(isRepetitionBlock(firstItem)).toBe(true);
    if (isRepetitionBlock(firstItem)) {
      expect(firstItem.repeatCount).toBe(ITER_COUNT_FIVE);
      expect(firstItem.steps).toHaveLength(1);
      expect(firstItem.steps[0].duration).toEqual({
        type: "time",
        seconds: 300,
      });
    }

    // Act
    const secondItem = workout?.steps[1];

    // Assert
    expect(isWorkoutStep(secondItem)).toBe(true);
    if (isWorkoutStep(secondItem)) {
      expect(secondItem.stepIndex).toBe(0);
    }
  });

  it("should preserve step properties in repetition block", () => {
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
    useWorkoutStore.getState().createRepetitionBlock([0], ITER_COUNT_THREE);
    const state = useWorkoutStore.getState();
    const workout = state.currentWorkout?.extensions?.structured_workout;

    // Act
    const block = workout?.steps[0];

    // Assert
    expect(isRepetitionBlock(block)).toBe(true);
    if (isRepetitionBlock(block)) {
      // Block id comes from `defaultIdProvider()` — uniform UUID v4
      // ItemId contract shared with step ids (design decision 1).
      expect(block.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
      expect(block.steps[0]).toEqual({
        id: expect.any(String),
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

describe("createRepetitionBlock - Property Tests", () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      currentWorkout: null,
      undoHistory: [],
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
      type: "structured_workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        structured_workout: {
          sport: "running",
          steps: [],
        },
      },
    };
    useWorkoutStore.getState().loadWorkout(mockKrd);
    useWorkoutStore.getState().createRepetitionBlock([0, 1], 2);
    const state = useWorkoutStore.getState();

    // Act
    const workout = state.currentWorkout?.extensions?.structured_workout;

    // Assert
    expect(workout?.steps).toHaveLength(0);
    expect(state.undoHistory).toHaveLength(1);
  });

  it("should handle workout with existing repetition blocks", () => {
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
    useWorkoutStore.getState().createRepetitionBlock([0, ITER_COUNT_THREE], 2);
    const state = useWorkoutStore.getState();
    const workout = state.currentWorkout?.extensions?.structured_workout;
    expect(workout?.steps).toHaveLength(2);
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

    // Act
    const secondItem = workout?.steps[1];

    // Assert
    expect(isRepetitionBlock(secondItem)).toBe(true);
    if (isRepetitionBlock(secondItem)) {
      expect(secondItem.repeatCount).toBe(ITER_COUNT_THREE);
      expect(secondItem.steps).toHaveLength(2);
    }
  });

  it("should handle mixed steps and blocks correctly", () => {
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
    useWorkoutStore
      .getState()
      .createRepetitionBlock([2, ITER_COUNT_THREE], ITER_COUNT_FOUR);
    const state = useWorkoutStore.getState();
    const workout = state.currentWorkout?.extensions?.structured_workout;
    expect(workout?.steps).toHaveLength(STEP_COUNT_THREE);
    const firstItem = workout?.steps[0];
    expect(isWorkoutStep(firstItem)).toBe(true);
    if (isWorkoutStep(firstItem)) {
      expect(firstItem.stepIndex).toBe(0);
      expect(firstItem.duration).toEqual({ type: "time", seconds: 300 });
    }
    const secondItem = workout?.steps[1];
    expect(isRepetitionBlock(secondItem)).toBe(true);
    if (isRepetitionBlock(secondItem)) {
      expect(secondItem.repeatCount).toBe(2);
    }

    // Act
    const thirdItem = workout?.steps[2];

    // Assert
    expect(isRepetitionBlock(thirdItem)).toBe(true);
    if (isRepetitionBlock(thirdItem)) {
      expect(thirdItem.repeatCount).toBe(ITER_COUNT_FOUR);
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
    // Arrange

    // Act
    const iterations = 100;

    // Assert
    for (let i = 0; i < iterations; i++) {
      // Arrange - Generate random workout structure
      const numSteps =
        Math.floor(Math.random() * PROPERTY_TEST_RANDOM_RANGE) +
        PROPERTY_TEST_MIN_STEPS; // 3-12 steps
      const steps = Array.from({ length: numSteps }, (_, idx) => ({
        stepIndex: idx,
        durationType: "time" as const,
        duration: {
          type: "time" as const,
          seconds:
            PROPERTY_TEST_BASE_DURATION_S +
            idx * PROPERTY_TEST_DURATION_INCREMENT_S,
        },
        targetType: "open" as const,
        target: { type: "open" as const },
      }));

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
      const workout = state.currentWorkout?.extensions?.structured_workout;
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
        undoHistory: [],
        historyIndex: -1,
      });
    }
  });
});
