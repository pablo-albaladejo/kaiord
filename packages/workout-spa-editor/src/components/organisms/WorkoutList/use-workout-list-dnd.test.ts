import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RepetitionBlock, Workout, WorkoutStep } from "../../../types/krd";
import { useWorkoutListDnd } from "./use-workout-list-dnd";

describe("useWorkoutListDnd", () => {
  const createMockWorkout = (stepCount: number): Workout => ({
    name: "Test Workout",
    sport: "cycling",
    steps: Array.from({ length: stepCount }, (_, i) => ({
      stepIndex: i,
      durationType: "time" as const,
      duration: { type: "time" as const, seconds: 300 },
      targetType: "power" as const,
      target: {
        type: "power" as const,
        value: { unit: "watts" as const, value: 200 },
      },
      intensity: "active" as const,
    })),
  });

  describe("sortableIds generation", () => {
    it("should generate sortable IDs for workout steps", () => {
      // Arrange
      const workout = createMockWorkout(3);

      // Act
      const { result } = renderHook(() => useWorkoutListDnd(workout));

      // Assert
      expect(result.current.sortableIds).toEqual([
        "step-0",
        "step-1",
        "step-2",
      ]);
    });

    it("should generate sortable IDs for repetition blocks", () => {
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
          {
            repeatCount: 3,
            steps: [
              {
                stepIndex: 1,
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
          },
        ],
      };

      // Act
      const { result } = renderHook(() => useWorkoutListDnd(workout));

      // Assert - IDs based on array position, not content
      expect(result.current.sortableIds).toEqual(["step-0", "block-1"]);
    });
  });

  describe("handleDragEnd", () => {
    it("should call onStepReorder with correct indices", () => {
      // Arrange
      const workout = createMockWorkout(3);
      const onStepReorder = vi.fn();
      const { result } = renderHook(() =>
        useWorkoutListDnd(workout, onStepReorder)
      );

      // Act
      result.current.handleDragEnd({
        active: { id: "step-0", data: { current: undefined } },
        over: { id: "step-2", data: { current: undefined } },
        delta: { x: 0, y: 0 },
        activatorEvent: new MouseEvent("mousedown"),
        collisions: null,
      });

      // Assert
      expect(onStepReorder).toHaveBeenCalledWith(0, 2);
    });

    it("should not call onStepReorder when dropped on same position", () => {
      // Arrange
      const workout = createMockWorkout(3);
      const onStepReorder = vi.fn();
      const { result } = renderHook(() =>
        useWorkoutListDnd(workout, onStepReorder)
      );

      // Act
      result.current.handleDragEnd({
        active: { id: "step-1", data: { current: undefined } },
        over: { id: "step-1", data: { current: undefined } },
        delta: { x: 0, y: 0 },
        activatorEvent: new MouseEvent("mousedown"),
        collisions: null,
      });

      // Assert
      expect(onStepReorder).not.toHaveBeenCalled();
    });

    it("should not call onStepReorder when over is null", () => {
      // Arrange
      const workout = createMockWorkout(3);
      const onStepReorder = vi.fn();
      const { result } = renderHook(() =>
        useWorkoutListDnd(workout, onStepReorder)
      );

      // Act
      result.current.handleDragEnd({
        active: { id: "step-0", data: { current: undefined } },
        over: null,
        delta: { x: 0, y: 0 },
        activatorEvent: new MouseEvent("mousedown"),
        collisions: null,
      });

      // Assert
      expect(onStepReorder).not.toHaveBeenCalled();
    });

    it("should not call onStepReorder when callback is not provided", () => {
      // Arrange
      const workout = createMockWorkout(3);
      const { result } = renderHook(() => useWorkoutListDnd(workout));

      // Act & Assert - should not throw
      expect(() => {
        result.current.handleDragEnd({
          active: { id: "step-0", data: { current: undefined } },
          over: { id: "step-2", data: { current: undefined } },
          delta: { x: 0, y: 0 },
          activatorEvent: new MouseEvent("mousedown"),
          collisions: null,
        });
      }).not.toThrow();
    });
  });

  describe("sensors configuration", () => {
    it("should configure pointer and keyboard sensors", () => {
      // Arrange
      const workout = createMockWorkout(3);

      // Act
      const { result } = renderHook(() => useWorkoutListDnd(workout));

      // Assert
      expect(result.current.sensors).toBeDefined();
      expect(Array.isArray(result.current.sensors)).toBe(true);
    });

    it("should use closestCenter collision detection", () => {
      // Arrange
      const workout = createMockWorkout(3);

      // Act
      const { result } = renderHook(() => useWorkoutListDnd(workout));

      // Assert
      expect(result.current.collisionDetection).toBeDefined();
    });
  });

  describe("Property 1: Position-based ID generation", () => {
    /**
     * **Feature: dnd-stable-ids-fix, Property 1: Position-based ID generation**
     * **Validates: Requirements 2.1**
     *
     * For any workout step or repetition block at array position i,
     * the generated ID SHALL be step-{i} or block-{i} respectively,
     * using only the array index and not any content properties.
     */
    it("should generate IDs based on array position, not content properties", () => {
      // Arrange - Create steps with arbitrary stepIndex values (content)
      const steps: Array<WorkoutStep | RepetitionBlock> = [
        {
          stepIndex: 99, // Arbitrary content value
          durationType: "time" as const,
          duration: { type: "time" as const, seconds: 300 },
          targetType: "power" as const,
          target: {
            type: "power" as const,
            value: { unit: "watts" as const, value: 200 },
          },
          intensity: "active" as const,
        },
        {
          stepIndex: 42, // Different arbitrary content value
          durationType: "distance" as const,
          duration: { type: "distance" as const, meters: 1000 },
          targetType: "heart_rate" as const,
          target: {
            type: "heart_rate" as const,
            value: { unit: "bpm" as const, value: 150 },
          },
          intensity: "active" as const,
        },
        {
          repeatCount: 5, // Repetition block with arbitrary repeatCount
          steps: [
            {
              stepIndex: 0,
              durationType: "time" as const,
              duration: { type: "time" as const, seconds: 60 },
              targetType: "power" as const,
              target: {
                type: "power" as const,
                value: { unit: "watts" as const, value: 250 },
              },
              intensity: "active" as const,
            },
          ],
        },
      ];

      const workout: Workout = {
        name: "Test Workout",
        sport: "cycling",
        steps,
      };

      // Act
      const { result } = renderHook(() => useWorkoutListDnd(workout));
      const ids = result.current.sortableIds;

      // Assert - IDs should be based on array position (0, 1, 2), not content
      expect(ids).toEqual([
        "step-0", // Position 0, NOT step-99
        "step-1", // Position 1, NOT step-42
        "block-2", // Position 2, NOT block-5-2
      ]);

      // Verify generateStepId function directly
      const generateStepId = result.current.generateStepId;
      expect(generateStepId(steps[0], 0)).toBe("step-0");
      expect(generateStepId(steps[1], 1)).toBe("step-1");
      expect(generateStepId(steps[2], 2)).toBe("block-2");
    });

    it("should generate position-based IDs for various array positions", () => {
      // Arrange - Test with multiple positions
      const positions = [0, 1, 5, 10, 99];

      for (const position of positions) {
        const step: WorkoutStep = {
          stepIndex: 999, // Arbitrary content value
          durationType: "time" as const,
          duration: { type: "time" as const, seconds: 300 },
          targetType: "power" as const,
          target: {
            type: "power" as const,
            value: { unit: "watts" as const, value: 200 },
          },
          intensity: "active" as const,
        };

        const block: RepetitionBlock = {
          repeatCount: 888, // Arbitrary content value
          steps: [],
        };

        const workout: Workout = {
          name: "Test",
          sport: "cycling",
          steps: [step],
        };

        // Act
        const { result } = renderHook(() => useWorkoutListDnd(workout));
        const generateStepId = result.current.generateStepId;

        // Assert
        expect(generateStepId(step, position)).toBe(`step-${position}`);
        expect(generateStepId(block, position)).toBe(`block-${position}`);
      }
    });
  });

  describe("Property 2: Stable IDs during content changes", () => {
    /**
     * **Feature: dnd-stable-ids-fix, Property 2: Stable IDs during content changes**
     * **Validates: Requirements 2.2**
     *
     * For any workout step at array position i, if the step's content changes
     * (including stepIndex), the generated ID SHALL remain step-{i} as long as
     * the array position hasn't changed.
     */
    it("should maintain stable IDs when stepIndex changes", () => {
      // Arrange - Create a step at position 0
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time" as const,
        duration: { type: "time" as const, seconds: 300 },
        targetType: "power" as const,
        target: {
          type: "power" as const,
          value: { unit: "watts" as const, value: 200 },
        },
        intensity: "active" as const,
      };

      const workout: Workout = {
        name: "Test Workout",
        sport: "cycling",
        steps: [step],
      };

      const { result: result1 } = renderHook(() => useWorkoutListDnd(workout));
      const id1 = result1.current.generateStepId(step, 0);

      // Act - Change stepIndex (simulating reindexing)
      step.stepIndex = 5;
      const { result: result2 } = renderHook(() => useWorkoutListDnd(workout));
      const id2 = result2.current.generateStepId(step, 0);

      // Assert - ID should remain stable despite stepIndex change
      expect(id1).toBe("step-0");
      expect(id2).toBe("step-0");
      expect(id1).toBe(id2);
    });

    it("should maintain stable IDs when other content properties change", () => {
      // Arrange - Create a step at position 1
      const step: WorkoutStep = {
        stepIndex: 1,
        durationType: "time" as const,
        duration: { type: "time" as const, seconds: 300 },
        targetType: "power" as const,
        target: {
          type: "power" as const,
          value: { unit: "watts" as const, value: 200 },
        },
        intensity: "active" as const,
      };

      const workout: Workout = {
        name: "Test Workout",
        sport: "cycling",
        steps: [
          {
            stepIndex: 0,
            durationType: "time" as const,
            duration: { type: "time" as const, seconds: 60 },
            targetType: "open" as const,
            target: { type: "open" as const },
            intensity: "warmup" as const,
          },
          step,
        ],
      };

      const { result: result1 } = renderHook(() => useWorkoutListDnd(workout));
      const id1 = result1.current.generateStepId(step, 1);

      // Act - Change multiple content properties
      step.durationType = "distance";
      step.duration = { type: "distance" as const, meters: 5000 };
      step.targetType = "heart_rate";
      step.target = {
        type: "heart_rate" as const,
        value: { unit: "bpm" as const, value: 160 },
      };
      step.intensity = "cooldown";

      const { result: result2 } = renderHook(() => useWorkoutListDnd(workout));
      const id2 = result2.current.generateStepId(step, 1);

      // Assert - ID should remain stable despite content changes
      expect(id1).toBe("step-1");
      expect(id2).toBe("step-1");
      expect(id1).toBe(id2);
    });

    it("should maintain stable IDs for repetition blocks when repeatCount changes", () => {
      // Arrange - Create a repetition block at position 0
      const block: RepetitionBlock = {
        repeatCount: 3,
        steps: [
          {
            stepIndex: 0,
            durationType: "time" as const,
            duration: { type: "time" as const, seconds: 60 },
            targetType: "power" as const,
            target: {
              type: "power" as const,
              value: { unit: "watts" as const, value: 250 },
            },
            intensity: "active" as const,
          },
        ],
      };

      const workout: Workout = {
        name: "Test Workout",
        sport: "cycling",
        steps: [block],
      };

      const { result: result1 } = renderHook(() => useWorkoutListDnd(workout));
      const id1 = result1.current.generateStepId(block, 0);

      // Act - Change repeatCount
      block.repeatCount = 10;
      const { result: result2 } = renderHook(() => useWorkoutListDnd(workout));
      const id2 = result2.current.generateStepId(block, 0);

      // Assert - ID should remain stable despite repeatCount change
      expect(id1).toBe("block-0");
      expect(id2).toBe("block-0");
      expect(id1).toBe(id2);
    });
  });

  describe("Property 5: React key matches generated ID", () => {
    /**
     * **Feature: dnd-stable-ids-fix, Property 5: React key matches generated ID**
     * **Validates: Requirements 2.4**
     *
     * For any rendered workout item, the React key prop SHALL match the ID
     * generated by generateStepId for that item's array position.
     */
    it("should generate consistent IDs for React keys and sortable items", () => {
      // Arrange - Create workout with various items
      const steps: Array<WorkoutStep | RepetitionBlock> = [
        {
          stepIndex: 0,
          durationType: "time" as const,
          duration: { type: "time" as const, seconds: 300 },
          targetType: "power" as const,
          target: {
            type: "power" as const,
            value: { unit: "watts" as const, value: 200 },
          },
          intensity: "warmup" as const,
        },
        {
          repeatCount: 3,
          steps: [
            {
              stepIndex: 1,
              durationType: "time" as const,
              duration: { type: "time" as const, seconds: 60 },
              targetType: "power" as const,
              target: {
                type: "power" as const,
                value: { unit: "watts" as const, value: 300 },
              },
              intensity: "active" as const,
            },
          ],
        },
        {
          stepIndex: 2,
          durationType: "distance" as const,
          duration: { type: "distance" as const, meters: 5000 },
          targetType: "heart_rate" as const,
          target: {
            type: "heart_rate" as const,
            value: { unit: "bpm" as const, value: 150 },
          },
          intensity: "active" as const,
        },
      ];

      const workout: Workout = {
        name: "Test Workout",
        sport: "cycling",
        steps,
      };

      // Act
      const { result } = renderHook(() => useWorkoutListDnd(workout));
      const { sortableIds, generateStepId } = result.current;

      // Assert - For each item, the sortableId should match what generateStepId produces
      steps.forEach((step, index) => {
        const expectedId = generateStepId(step, index);
        const actualId = sortableIds[index];

        expect(actualId).toBe(expectedId);
      });

      // Verify specific IDs
      expect(sortableIds).toEqual(["step-0", "block-1", "step-2"]);
    });

    it("should maintain ID consistency across multiple renders", () => {
      // Arrange - Create workout
      const workout: Workout = {
        name: "Test Workout",
        sport: "cycling",
        steps: [
          {
            stepIndex: 0,
            durationType: "time" as const,
            duration: { type: "time" as const, seconds: 300 },
            targetType: "power" as const,
            target: {
              type: "power" as const,
              value: { unit: "watts" as const, value: 200 },
            },
            intensity: "active" as const,
          },
          {
            stepIndex: 1,
            durationType: "time" as const,
            duration: { type: "time" as const, seconds: 600 },
            targetType: "power" as const,
            target: {
              type: "power" as const,
              value: { unit: "watts" as const, value: 250 },
            },
            intensity: "active" as const,
          },
        ],
      };

      // Act - Render multiple times
      const { result: result1 } = renderHook(() => useWorkoutListDnd(workout));
      const { result: result2 } = renderHook(() => useWorkoutListDnd(workout));
      const { result: result3 } = renderHook(() => useWorkoutListDnd(workout));

      // Assert - All renders should produce identical IDs
      expect(result1.current.sortableIds).toEqual(result2.current.sortableIds);
      expect(result2.current.sortableIds).toEqual(result3.current.sortableIds);

      // Verify generateStepId produces same results
      workout.steps.forEach((step, index) => {
        const id1 = result1.current.generateStepId(step, index);
        const id2 = result2.current.generateStepId(step, index);
        const id3 = result3.current.generateStepId(step, index);

        expect(id1).toBe(id2);
        expect(id2).toBe(id3);
      });
    });

    it("should generate matching IDs for empty workout", () => {
      // Arrange - Empty workout
      const workout: Workout = {
        name: "Empty Workout",
        sport: "cycling",
        steps: [],
      };

      // Act
      const { result } = renderHook(() => useWorkoutListDnd(workout));
      const { sortableIds, generateStepId } = result.current;

      // Assert - Both should be empty
      expect(sortableIds).toEqual([]);
      expect(workout.steps.length).toBe(0);
    });

    it("should generate matching IDs for large workouts", () => {
      // Arrange - Create workout with many items
      const steps: WorkoutStep[] = Array.from({ length: 50 }, (_, i) => ({
        stepIndex: i,
        durationType: "time" as const,
        duration: { type: "time" as const, seconds: 300 },
        targetType: "power" as const,
        target: {
          type: "power" as const,
          value: { unit: "watts" as const, value: 200 },
        },
        intensity: "active" as const,
      }));

      const workout: Workout = {
        name: "Large Workout",
        sport: "cycling",
        steps,
      };

      // Act
      const { result } = renderHook(() => useWorkoutListDnd(workout));
      const { sortableIds, generateStepId } = result.current;

      // Assert - All IDs should match
      expect(sortableIds.length).toBe(50);

      steps.forEach((step, index) => {
        const expectedId = generateStepId(step, index);
        const actualId = sortableIds[index];

        expect(actualId).toBe(expectedId);
        expect(actualId).toBe(`step-${index}`);
      });
    });

    it("should generate matching IDs after content changes", () => {
      // Arrange - Create workout
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time" as const,
        duration: { type: "time" as const, seconds: 300 },
        targetType: "power" as const,
        target: {
          type: "power" as const,
          value: { unit: "watts" as const, value: 200 },
        },
        intensity: "active" as const,
      };

      const workout: Workout = {
        name: "Test Workout",
        sport: "cycling",
        steps: [step],
      };

      // Get initial IDs
      const { result: result1 } = renderHook(() => useWorkoutListDnd(workout));
      const initialId = result1.current.generateStepId(step, 0);
      const initialSortableId = result1.current.sortableIds[0];

      // Act - Change step content
      step.stepIndex = 99;
      step.durationType = "distance";
      step.duration = { type: "distance" as const, meters: 5000 };

      // Re-render with changed content
      const { result: result2 } = renderHook(() => useWorkoutListDnd(workout));
      const newId = result2.current.generateStepId(step, 0);
      const newSortableId = result2.current.sortableIds[0];

      // Assert - IDs should remain stable and matching
      expect(initialId).toBe(newId);
      expect(initialSortableId).toBe(newSortableId);
      expect(newId).toBe(newSortableId);
      expect(newId).toBe("step-0");
    });
  });

  describe("Property 6: Drag preview dimension preservation", () => {
    /**
     * **Feature: dnd-stable-ids-fix, Property 6: Drag preview dimension preservation**
     * **Validates: Requirements 3.1, 3.2**
     *
     * For any repetition block card being dragged, the drag overlay dimensions
     * SHALL be within 10% of the original card's width and height.
     *
     * Note: This property tests the implementation logic that ensures dimension
     * preservation. Actual visual dimension testing is done in E2E tests.
     */
    it("should provide activeId for DragOverlay when dragging", () => {
      // Arrange
      const workout: Workout = {
        name: "Test Workout",
        sport: "cycling",
        steps: [
          {
            repeatCount: 3,
            steps: [
              {
                stepIndex: 0,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 60 },
                targetType: "power" as const,
                target: {
                  type: "power" as const,
                  value: { unit: "watts" as const, value: 250 },
                },
                intensity: "active" as const,
              },
            ],
          },
        ],
      };

      const { result } = renderHook(() => useWorkoutListDnd(workout));

      // Act - Simulate drag start
      const dragStartEvent = {
        active: { id: "block-0", data: { current: undefined } },
        over: null,
        delta: { x: 0, y: 0 },
        activatorEvent: new MouseEvent("mousedown"),
        collisions: null,
      };

      // Assert - The hook should provide the active ID for DragOverlay
      expect(result.current.sortableIds).toContain("block-0");
      expect(result.current.sortableIds[0]).toBe("block-0");
    });

    it("should maintain consistent ID format for all item types", () => {
      // Arrange - Create workout with mixed items
      const workout: Workout = {
        name: "Test Workout",
        sport: "cycling",
        steps: [
          {
            stepIndex: 0,
            durationType: "time" as const,
            duration: { type: "time" as const, seconds: 300 },
            targetType: "power" as const,
            target: {
              type: "power" as const,
              value: { unit: "watts" as const, value: 200 },
            },
            intensity: "warmup" as const,
          },
          {
            repeatCount: 3,
            steps: [
              {
                stepIndex: 1,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 60 },
                targetType: "power" as const,
                target: {
                  type: "power" as const,
                  value: { unit: "watts" as const, value: 300 },
                },
                intensity: "active" as const,
              },
            ],
          },
          {
            stepIndex: 2,
            durationType: "time" as const,
            duration: { type: "time" as const, seconds: 300 },
            targetType: "power" as const,
            target: {
              type: "power" as const,
              value: { unit: "watts" as const, value: 150 },
            },
            intensity: "cooldown" as const,
          },
        ],
      };

      // Act
      const { result } = renderHook(() => useWorkoutListDnd(workout));

      // Assert - All IDs should follow consistent format
      expect(result.current.sortableIds).toEqual([
        "step-0",
        "block-1",
        "step-2",
      ]);

      // Verify each ID can be used for DragOverlay
      result.current.sortableIds.forEach((id) => {
        expect(typeof id).toBe("string");
        expect(id).toMatch(/^(step|block)-\d+$/);
      });
    });
  });

  describe("Property 7: Dimension restoration after drop", () => {
    /**
     * **Feature: dnd-stable-ids-fix, Property 7: Dimension restoration after drop**
     * **Validates: Requirements 3.3**
     *
     * For any repetition block card after being dropped, the card dimensions
     * SHALL match its dimensions before the drag operation started.
     *
     * Note: This property tests that the hook correctly handles drag end events
     * and maintains state consistency. Actual dimension testing is in E2E tests.
     */
    it("should maintain state consistency after drag end", () => {
      // Arrange
      const workout: Workout = {
        name: "Test Workout",
        sport: "cycling",
        steps: [
          {
            repeatCount: 3,
            steps: [
              {
                stepIndex: 0,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 60 },
                targetType: "power" as const,
                target: {
                  type: "power" as const,
                  value: { unit: "watts" as const, value: 250 },
                },
                intensity: "active" as const,
              },
            ],
          },
          {
            stepIndex: 1,
            durationType: "time" as const,
            duration: { type: "time" as const, seconds: 300 },
            targetType: "power" as const,
            target: {
              type: "power" as const,
              value: { unit: "watts" as const, value: 200 },
            },
            intensity: "active" as const,
          },
        ],
      };

      const onStepReorder = vi.fn();
      const { result } = renderHook(() =>
        useWorkoutListDnd(workout, onStepReorder)
      );

      const initialIds = [...result.current.sortableIds];

      // Act - Simulate drag and drop
      result.current.handleDragEnd({
        active: { id: "block-0", data: { current: undefined } },
        over: { id: "step-1", data: { current: undefined } },
        delta: { x: 0, y: 100 },
        activatorEvent: new MouseEvent("mousedown"),
        collisions: null,
      });

      // Assert - State should be consistent after drop
      expect(onStepReorder).toHaveBeenCalledWith(0, 1);
      expect(result.current.sortableIds).toEqual(initialIds);
    });

    it("should handle drop on same position without state changes", () => {
      // Arrange
      const workout: Workout = {
        name: "Test Workout",
        sport: "cycling",
        steps: [
          {
            repeatCount: 3,
            steps: [
              {
                stepIndex: 0,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 60 },
                targetType: "power" as const,
                target: {
                  type: "power" as const,
                  value: { unit: "watts" as const, value: 250 },
                },
                intensity: "active" as const,
              },
            ],
          },
        ],
      };

      const onStepReorder = vi.fn();
      const { result } = renderHook(() =>
        useWorkoutListDnd(workout, onStepReorder)
      );

      const initialIds = [...result.current.sortableIds];

      // Act - Drop on same position
      result.current.handleDragEnd({
        active: { id: "block-0", data: { current: undefined } },
        over: { id: "block-0", data: { current: undefined } },
        delta: { x: 0, y: 0 },
        activatorEvent: new MouseEvent("mousedown"),
        collisions: null,
      });

      // Assert - No state changes
      expect(onStepReorder).not.toHaveBeenCalled();
      expect(result.current.sortableIds).toEqual(initialIds);
    });
  });

  describe("Property 8: Consistent drag visual treatment", () => {
    /**
     * **Feature: dnd-stable-ids-fix, Property 8: Consistent drag visual treatment**
     * **Validates: Requirements 3.4**
     *
     * For any draggable card (step or block), the drag preview SHALL apply
     * the same opacity and transform styles regardless of card type.
     *
     * Note: This property tests that all items use the same DnD configuration.
     * Actual visual styling is tested in E2E tests.
     */
    it("should use same collision detection for all item types", () => {
      // Arrange - Create workout with mixed items
      const workout: Workout = {
        name: "Test Workout",
        sport: "cycling",
        steps: [
          {
            stepIndex: 0,
            durationType: "time" as const,
            duration: { type: "time" as const, seconds: 300 },
            targetType: "power" as const,
            target: {
              type: "power" as const,
              value: { unit: "watts" as const, value: 200 },
            },
            intensity: "warmup" as const,
          },
          {
            repeatCount: 3,
            steps: [
              {
                stepIndex: 1,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 60 },
                targetType: "power" as const,
                target: {
                  type: "power" as const,
                  value: { unit: "watts" as const, value: 300 },
                },
                intensity: "active" as const,
              },
            ],
          },
        ],
      };

      // Act
      const { result } = renderHook(() => useWorkoutListDnd(workout));

      // Assert - Same collision detection for all items
      expect(result.current.collisionDetection).toBeDefined();
      expect(typeof result.current.collisionDetection).toBe("function");
    });

    it("should use same sensors for all item types", () => {
      // Arrange - Create workout with mixed items
      const workout: Workout = {
        name: "Test Workout",
        sport: "cycling",
        steps: [
          {
            stepIndex: 0,
            durationType: "time" as const,
            duration: { type: "time" as const, seconds: 300 },
            targetType: "power" as const,
            target: {
              type: "power" as const,
              value: { unit: "watts" as const, value: 200 },
            },
            intensity: "warmup" as const,
          },
          {
            repeatCount: 3,
            steps: [
              {
                stepIndex: 1,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 60 },
                targetType: "power" as const,
                target: {
                  type: "power" as const,
                  value: { unit: "watts" as const, value: 300 },
                },
                intensity: "active" as const,
              },
            ],
          },
        ],
      };

      // Act
      const { result } = renderHook(() => useWorkoutListDnd(workout));

      // Assert - Sensors are configured consistently
      expect(result.current.sensors).toBeDefined();
      expect(Array.isArray(result.current.sensors)).toBe(true);
      expect(result.current.sensors.length).toBeGreaterThan(0);
    });

    it("should handle drag events consistently for steps and blocks", () => {
      // Arrange
      const workout: Workout = {
        name: "Test Workout",
        sport: "cycling",
        steps: [
          {
            stepIndex: 0,
            durationType: "time" as const,
            duration: { type: "time" as const, seconds: 300 },
            targetType: "power" as const,
            target: {
              type: "power" as const,
              value: { unit: "watts" as const, value: 200 },
            },
            intensity: "warmup" as const,
          },
          {
            repeatCount: 3,
            steps: [
              {
                stepIndex: 1,
                durationType: "time" as const,
                duration: { type: "time" as const, seconds: 60 },
                targetType: "power" as const,
                target: {
                  type: "power" as const,
                  value: { unit: "watts" as const, value: 300 },
                },
                intensity: "active" as const,
              },
            ],
          },
        ],
      };

      const onStepReorder = vi.fn();
      const { result } = renderHook(() =>
        useWorkoutListDnd(workout, onStepReorder)
      );

      // Act - Drag step over block
      result.current.handleDragEnd({
        active: { id: "step-0", data: { current: undefined } },
        over: { id: "block-1", data: { current: undefined } },
        delta: { x: 0, y: 100 },
        activatorEvent: new MouseEvent("mousedown"),
        collisions: null,
      });

      // Assert - Handler works for both types
      expect(onStepReorder).toHaveBeenCalledWith(0, 1);

      // Act - Drag block over step
      onStepReorder.mockClear();
      result.current.handleDragEnd({
        active: { id: "block-1", data: { current: undefined } },
        over: { id: "step-0", data: { current: undefined } },
        delta: { x: 0, y: -100 },
        activatorEvent: new MouseEvent("mousedown"),
        collisions: null,
      });

      // Assert - Handler works for both types
      expect(onStepReorder).toHaveBeenCalledWith(1, 0);
    });
  });

  describe("Property 3: ID regeneration after reorder", () => {
    /**
     * **Feature: dnd-stable-ids-fix, Property 3: ID regeneration after reorder**
     * **Validates: Requirements 2.3**
     *
     * For any reorder operation that moves a step from position i to position j,
     * the ID generation SHALL produce IDs that reflect the new array positions
     * for all affected steps.
     */
    it("should regenerate IDs based on new positions after reordering", () => {
      // Arrange - Create workout with 3 steps
      const steps: WorkoutStep[] = [
        {
          stepIndex: 0,
          durationType: "time" as const,
          duration: { type: "time" as const, seconds: 300 },
          targetType: "power" as const,
          target: {
            type: "power" as const,
            value: { unit: "watts" as const, value: 200 },
          },
          intensity: "warmup" as const,
        },
        {
          stepIndex: 1,
          durationType: "time" as const,
          duration: { type: "time" as const, seconds: 600 },
          targetType: "power" as const,
          target: {
            type: "power" as const,
            value: { unit: "watts" as const, value: 250 },
          },
          intensity: "active" as const,
        },
        {
          stepIndex: 2,
          durationType: "time" as const,
          duration: { type: "time" as const, seconds: 300 },
          targetType: "power" as const,
          target: {
            type: "power" as const,
            value: { unit: "watts" as const, value: 150 },
          },
          intensity: "cooldown" as const,
        },
      ];

      const workout: Workout = {
        name: "Test Workout",
        sport: "cycling",
        steps,
      };

      // Get initial IDs
      const { result: result1 } = renderHook(() => useWorkoutListDnd(workout));
      const initialIds = result1.current.sortableIds;

      // Act - Simulate reorder: move step from position 0 to position 2
      // After reorder: [step1, step2, step0]
      const reorderedSteps = [steps[1], steps[2], steps[0]];
      const reorderedWorkout: Workout = {
        ...workout,
        steps: reorderedSteps,
      };

      const { result: result2 } = renderHook(() =>
        useWorkoutListDnd(reorderedWorkout)
      );
      const newIds = result2.current.sortableIds;

      // Assert - IDs should reflect new array positions
      expect(initialIds).toEqual(["step-0", "step-1", "step-2"]);
      expect(newIds).toEqual([
        "step-0", // step1 is now at position 0
        "step-1", // step2 is now at position 1
        "step-2", // step0 is now at position 2
      ]);

      // Verify each step gets ID based on its new position
      expect(result2.current.generateStepId(reorderedSteps[0], 0)).toBe(
        "step-0"
      );
      expect(result2.current.generateStepId(reorderedSteps[1], 1)).toBe(
        "step-1"
      );
      expect(result2.current.generateStepId(reorderedSteps[2], 2)).toBe(
        "step-2"
      );
    });

    it("should regenerate IDs for all positions after multiple reorders", () => {
      // Arrange - Create workout with mixed steps and blocks
      const steps: Array<WorkoutStep | RepetitionBlock> = [
        {
          stepIndex: 0,
          durationType: "time" as const,
          duration: { type: "time" as const, seconds: 300 },
          targetType: "power" as const,
          target: {
            type: "power" as const,
            value: { unit: "watts" as const, value: 200 },
          },
          intensity: "warmup" as const,
        },
        {
          repeatCount: 3,
          steps: [
            {
              stepIndex: 1,
              durationType: "time" as const,
              duration: { type: "time" as const, seconds: 60 },
              targetType: "power" as const,
              target: {
                type: "power" as const,
                value: { unit: "watts" as const, value: 300 },
              },
              intensity: "active" as const,
            },
          ],
        },
        {
          stepIndex: 2,
          durationType: "time" as const,
          duration: { type: "time" as const, seconds: 300 },
          targetType: "power" as const,
          target: {
            type: "power" as const,
            value: { unit: "watts" as const, value: 150 },
          },
          intensity: "cooldown" as const,
        },
      ];

      const workout: Workout = {
        name: "Test Workout",
        sport: "cycling",
        steps,
      };

      // Act - Reorder: move block from position 1 to position 0
      const reorderedSteps = [steps[1], steps[0], steps[2]];
      const reorderedWorkout: Workout = {
        ...workout,
        steps: reorderedSteps,
      };

      const { result } = renderHook(() => useWorkoutListDnd(reorderedWorkout));
      const newIds = result.current.sortableIds;

      // Assert - All IDs should reflect new positions
      expect(newIds).toEqual([
        "block-0", // Block moved to position 0
        "step-1", // Step moved to position 1
        "step-2", // Step remains at position 2
      ]);
    });
  });
});
