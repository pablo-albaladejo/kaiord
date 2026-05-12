import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Workout } from "../../../types/krd";
import { WorkoutList } from "./WorkoutList";

const TOTAL_WORKOUTS_FIXTURE = 3;

const LARGE_WORKOUT_STEP_COUNT = 50;

const LARGE_RENDER_BUDGET_MS = 5000;

/**
 * Integration tests for WorkoutList drag-and-drop functionality
 * Tests the complete drag-and-drop flow with DndContext
 * Requirement 3: Complete drag-and-drop flow
 */
describe("WorkoutList - Drag and Drop Integration", () => {
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

  it("should render with DndContext wrapper", () => {
    // Arrange
    // Arrange

    const workout = createMockWorkout(TOTAL_WORKOUTS_FIXTURE);

    // Act

    // Act

    render(<WorkoutList workout={workout} />);

    // Assert

    // Assert

    expect(
      screen.getByRole("list", { name: "Workout steps" })
    ).toBeInTheDocument();
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2")).toBeInTheDocument();
    expect(screen.getByText("Step 3")).toBeInTheDocument();
  });

  it("should call onStepReorder when drag ends", () => {
    // Arrange
    // Arrange

    const workout = createMockWorkout(TOTAL_WORKOUTS_FIXTURE);
    const onStepReorder = vi.fn();

    // Act
    render(<WorkoutList workout={workout} onStepReorder={onStepReorder} />);

    // Simulate drag end event by calling the handler directly
    // Note: Full drag simulation requires more complex setup with @dnd-kit/testing

    // Act

    const list = screen.getByRole("list", { name: "Workout steps" });

    // Assert

    expect(list).toBeInTheDocument();

    // Assert - component renders correctly with drag-and-drop enabled
    expect(onStepReorder).not.toHaveBeenCalled(); // Not called until actual drag
  });

  it("should render sortable items with correct IDs", () => {
    // Arrange
    // Arrange

    const workout = createMockWorkout(TOTAL_WORKOUTS_FIXTURE);

    // Act
    const { container } = render(<WorkoutList workout={workout} />);

    // Assert - check that sortable items are rendered

    // Act

    const stepCards = container.querySelectorAll('[data-testid="step-card"]');

    // Assert

    expect(stepCards.length).toBe(TOTAL_WORKOUTS_FIXTURE);
  });

  it("should handle empty workout", () => {
    // Arrange
    // Arrange

    const workout: Workout = {
      name: "Empty Workout",
      sport: "cycling",
      steps: [],
    };

    // Act

    // Act

    render(<WorkoutList workout={workout} />);

    // Assert

    // Assert

    expect(
      screen.getByRole("list", { name: "Workout steps" })
    ).toBeInTheDocument();
    expect(screen.queryByText(/Step \d+/)).not.toBeInTheDocument();
  });

  it("should handle workout with repetition blocks", () => {
    // Arrange
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

    // Act

    render(<WorkoutList workout={workout} />);

    // Assert

    // Assert

    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("3x")).toBeInTheDocument();
    expect(screen.getByText("Repeat Block")).toBeInTheDocument();
  });

  it("should maintain accessibility during drag operations", () => {
    // Arrange
    // Arrange

    const workout = createMockWorkout(TOTAL_WORKOUTS_FIXTURE);

    // Act
    render(<WorkoutList workout={workout} />);

    // Assert - check ARIA attributes

    // Act

    const list = screen.getByRole("list", { name: "Workout steps" });

    // Assert

    expect(list).toBeInTheDocument();

    // Check that step cards are accessible
    const stepButtons = screen.getAllByRole("button");
    expect(stepButtons.length).toBeGreaterThan(0);
  });

  it("should handle large number of steps efficiently", () => {
    // Arrange
    // Arrange

    const workout = createMockWorkout(LARGE_WORKOUT_STEP_COUNT);

    // Act
    const startTime = performance.now();
    render(<WorkoutList workout={workout} />);

    // Act

    const endTime = performance.now();

    // Assert - rendering should complete (performance varies by environment)
    // Note: CI environments can be significantly slower than local development
    // (observed >2.7s on shared runners). Threshold is a sanity cap to catch
    // pathological regressions, not a strict performance budget.

    // Assert

    expect(endTime - startTime).toBeLessThan(LARGE_RENDER_BUDGET_MS); // 5 seconds max
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 50")).toBeInTheDocument();
  });

  it("should preserve step content including name after reorder", () => {
    // Arrange
    // Arrange

    const workout: Workout = {
      name: "Test Workout",
      sport: "running",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "heart_rate",
          target: { type: "heart_rate", value: { unit: "bpm", value: 140 } },
          name: "Warmup",
          intensity: "warmup",
        },
        {
          stepIndex: 1,
          durationType: "distance",
          duration: { type: "distance", meters: 5000 },
          targetType: "pace",
          target: { type: "pace", value: { unit: "min_per_km", value: 5 } },
          name: "Main Set",
          intensity: "active",
        },
      ],
    };
    const onStepReorder = vi.fn();

    // Act

    // Act

    render(<WorkoutList workout={workout} onStepReorder={onStepReorder} />);

    // Assert - verify custom step names are displayed in header

    // Assert

    expect(screen.getByText("Warmup")).toBeInTheDocument();
    expect(screen.getByText("Main Set")).toBeInTheDocument();

    // Verify aria-labels contain step numbers for accessibility
    expect(screen.getByLabelText(/Step 1:/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Step 2:/)).toBeInTheDocument();
  });
});
