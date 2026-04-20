/**
 * Workout Loading Integration Tests
 *
 * Integration tests for workout loading with migration support.
 * Tests the integration between loadWorkout action and migration utilities.
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { KRD, RepetitionBlock } from "../types/krd";
import { useWorkoutStore } from "./workout-store";

describe("workout loading integration", () => {
  // Reset store before each test
  beforeEach(() => {
    useWorkoutStore.setState({
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
    });
  });

  describe("loading workout without block IDs", () => {
    it("should load workout and add IDs to blocks without them", () => {
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
                  },
                ],
              } as RepetitionBlock,
            ],
          },
        },
      };

      // Act
      useWorkoutStore.getState().loadWorkout(mockKrd);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.currentWorkout).toBeDefined();
      const workout = state.currentWorkout?.extensions?.structured_workout;
      expect(workout?.steps).toHaveLength(1);

      const block = workout?.steps[0] as RepetitionBlock;
      expect(block.id).toBeDefined();
      expect(typeof block.id).toBe("string");
      // loadWorkout hydrates through defaultIdProvider() which yields a v4 UUID.
      expect(block.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });

    it("should add unique IDs to multiple blocks without IDs", () => {
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
                  },
                ],
              } as RepetitionBlock,
              {
                repeatCount: 3,
                steps: [
                  {
                    stepIndex: 0,
                    durationType: "time",
                    duration: { type: "time", seconds: 360 },
                    targetType: "power",
                    target: {
                      type: "power",
                      value: { unit: "watts", value: 210 },
                    },
                  },
                ],
              } as RepetitionBlock,
            ],
          },
        },
      };

      // Act
      useWorkoutStore.getState().loadWorkout(mockKrd);
      const state = useWorkoutStore.getState();

      // Assert
      const workout = state.currentWorkout?.extensions?.structured_workout;
      expect(workout?.steps).toHaveLength(2);

      const block1 = workout?.steps[0] as RepetitionBlock;
      const block2 = workout?.steps[1] as RepetitionBlock;
      expect(block1.id).toBeDefined();
      expect(block2.id).toBeDefined();
      expect(block1.id).not.toBe(block2.id);
    });

    it("should handle workout with mixed steps and blocks without IDs", () => {
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
                duration: { type: "time", seconds: 600 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 150 },
                },
              },
              {
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
                  },
                ],
              } as RepetitionBlock,
              {
                stepIndex: 1,
                durationType: "time",
                duration: { type: "time", seconds: 300 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 100 },
                },
              },
            ],
          },
        },
      };

      // Act
      useWorkoutStore.getState().loadWorkout(mockKrd);
      const state = useWorkoutStore.getState();

      // Assert
      const workout = state.currentWorkout?.extensions?.structured_workout;
      expect(workout?.steps).toHaveLength(3);

      const block = workout?.steps[1] as RepetitionBlock;
      expect(block.id).toBeDefined();
      expect(typeof block.id).toBe("string");
    });
  });

  describe("loading workout with block IDs", () => {
    it("regenerates block IDs on load even when the portable KRD already carries one", () => {
      // Arrange
      const existingId = "block-1234567890-abc123";
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
                id: existingId,
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
                  },
                ],
              } as RepetitionBlock,
            ],
          },
        },
      };

      // Act
      useWorkoutStore.getState().loadWorkout(mockKrd);
      const state = useWorkoutStore.getState();

      // Assert — stable ids are UI-scope (design decision 6); the portable
      // KRD id is never carried into the in-memory UIWorkout.
      const workout = state.currentWorkout?.extensions?.structured_workout;
      const block = workout?.steps[0] as RepetitionBlock;
      expect(block.id).toBeDefined();
      expect(block.id).not.toBe(existingId);
      expect(block.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });

    it("regenerates every block ID on load", () => {
      // Arrange
      const existingId1 = "block-1111111111-aaa111";
      const existingId2 = "block-2222222222-bbb222";
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
                id: existingId1,
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
                  },
                ],
              } as RepetitionBlock,
              {
                id: existingId2,
                repeatCount: 3,
                steps: [
                  {
                    stepIndex: 0,
                    durationType: "time",
                    duration: { type: "time", seconds: 360 },
                    targetType: "power",
                    target: {
                      type: "power",
                      value: { unit: "watts", value: 210 },
                    },
                  },
                ],
              } as RepetitionBlock,
            ],
          },
        },
      };

      // Act
      useWorkoutStore.getState().loadWorkout(mockKrd);
      const state = useWorkoutStore.getState();

      // Assert
      const workout = state.currentWorkout?.extensions?.structured_workout;
      const block1 = workout?.steps[0] as RepetitionBlock;
      const block2 = workout?.steps[1] as RepetitionBlock;
      expect(block1.id).not.toBe(existingId1);
      expect(block2.id).not.toBe(existingId2);
      expect(block1.id).not.toBe(block2.id);
    });

    it("assigns a fresh UUID to every block regardless of existing ids", () => {
      // Arrange
      const existingId = "block-1234567890-abc123";
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
                id: existingId,
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
                  },
                ],
              } as RepetitionBlock,
              {
                repeatCount: 3,
                steps: [
                  {
                    stepIndex: 0,
                    durationType: "time",
                    duration: { type: "time", seconds: 360 },
                    targetType: "power",
                    target: {
                      type: "power",
                      value: { unit: "watts", value: 210 },
                    },
                  },
                ],
              } as RepetitionBlock,
            ],
          },
        },
      };

      // Act
      useWorkoutStore.getState().loadWorkout(mockKrd);
      const state = useWorkoutStore.getState();

      // Assert
      const workout = state.currentWorkout?.extensions?.structured_workout;
      const block1 = workout?.steps[0] as RepetitionBlock;
      const block2 = workout?.steps[1] as RepetitionBlock;
      expect(block1.id).not.toBe(existingId);
      expect(block2.id).toBeDefined();
      expect(block1.id).not.toBe(block2.id);
    });
  });

  describe("verifying IDs are present after load", () => {
    it("should ensure all blocks have IDs after loading", () => {
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
                  },
                ],
              } as RepetitionBlock,
              {
                repeatCount: 3,
                steps: [
                  {
                    stepIndex: 0,
                    durationType: "time",
                    duration: { type: "time", seconds: 360 },
                    targetType: "power",
                    target: {
                      type: "power",
                      value: { unit: "watts", value: 210 },
                    },
                  },
                ],
              } as RepetitionBlock,
              {
                repeatCount: 4,
                steps: [
                  {
                    stepIndex: 0,
                    durationType: "time",
                    duration: { type: "time", seconds: 420 },
                    targetType: "power",
                    target: {
                      type: "power",
                      value: { unit: "watts", value: 220 },
                    },
                  },
                ],
              } as RepetitionBlock,
            ],
          },
        },
      };

      // Act
      useWorkoutStore.getState().loadWorkout(mockKrd);
      const state = useWorkoutStore.getState();

      // Assert
      const workout = state.currentWorkout?.extensions?.structured_workout;
      expect(workout?.steps).toHaveLength(3);

      // Verify all blocks have IDs — hydrated through defaultIdProvider().
      const blocks = workout?.steps as RepetitionBlock[];
      blocks.forEach((block) => {
        expect(block.id).toBeDefined();
        expect(typeof block.id).toBe("string");
        expect(block.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
        );
      });

      // Verify all IDs are unique
      const ids = blocks.map((block) => block.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(blocks.length);
    });

    it("should maintain IDs in workout history", () => {
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
                  },
                ],
              } as RepetitionBlock,
            ],
          },
        },
      };

      // Act
      useWorkoutStore.getState().loadWorkout(mockKrd);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.workoutHistory).toHaveLength(1);
      const historyWorkout =
        state.workoutHistory[0].extensions?.structured_workout;
      const historyBlock = historyWorkout?.steps[0] as RepetitionBlock;
      expect(historyBlock.id).toBeDefined();
      expect(typeof historyBlock.id).toBe("string");
    });

    it("should handle empty workout without errors", () => {
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

      // Act
      useWorkoutStore.getState().loadWorkout(mockKrd);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.currentWorkout).toBeDefined();
      const workout = state.currentWorkout?.extensions?.structured_workout;
      expect(workout?.steps).toHaveLength(0);
    });

    it("should handle workout with only individual steps", () => {
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
                duration: { type: "time", seconds: 600 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 150 },
                },
              },
              {
                stepIndex: 1,
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

      // Act
      useWorkoutStore.getState().loadWorkout(mockKrd);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.currentWorkout).toBeDefined();
      const workout = state.currentWorkout?.extensions?.structured_workout;
      expect(workout?.steps).toHaveLength(2);
      // Individual steps don't need IDs, only repetition blocks
    });
  });
});
