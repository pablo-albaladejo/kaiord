import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Workout } from "../../../types/krd";
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

      // Assert
      expect(result.current.sortableIds).toEqual([
        "step-0",
        "block-3-1",
      ]);
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
});
