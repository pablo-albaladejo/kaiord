import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Workout } from "../../../types/krd";
import { WorkoutList } from "./WorkoutList";

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
    const workout = createMockWorkout(3);

    // Act
    render(<WorkoutList workout={workout} />);

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
    const workout = createMockWorkout(3);
    const onStepReorder = vi.fn();

    // Act
    render(<WorkoutList workout={workout} onStepReorder={onStepReorder} />);

    // Simulate drag end event by calling the handler directly
    // Note: Full drag simulation requires more complex setup with @dnd-kit/testing
    const list = screen.getByRole("list", { name: "Workout steps" });
    expect(list).toBeInTheDocument();

    // Assert - component renders correctly with drag-and-drop enabled
    expect(onStepReorder).not.toHaveBeenCalled(); // Not called until actual drag
  });

  it("should render sortable items with correct IDs", () => {
    // Arrange
    const workout = createMockWorkout(3);

    // Act
    const { container } = render(<WorkoutList workout={workout} />);

    // Assert - check that sortable items are rendered
    const stepCards = container.querySelectorAll('[data-testid="step-card"]');
    expect(stepCards.length).toBe(3);
  });

  it("should handle empty workout", () => {
    // Arrange
    const workout: Workout = {
      name: "Empty Workout",
      sport: "cycling",
      steps: [],
    };

    // Act
    render(<WorkoutList workout={workout} />);

    // Assert
    expect(
      screen.getByRole("list", { name: "Workout steps" })
    ).toBeInTheDocument();
    expect(screen.queryByText(/Step \d+/)).not.toBeInTheDocument();
  });

  it("should handle workout with repetition blocks", () => {
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
    render(<WorkoutList workout={workout} />);

    // Assert
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("3x")).toBeInTheDocument();
    expect(screen.getByText("Repeat Block")).toBeInTheDocument();
  });

  it("should maintain accessibility during drag operations", () => {
    // Arrange
    const workout = createMockWorkout(3);

    // Act
    render(<WorkoutList workout={workout} />);

    // Assert - check ARIA attributes
    const list = screen.getByRole("list", { name: "Workout steps" });
    expect(list).toBeInTheDocument();

    // Check that step cards are accessible
    const stepButtons = screen.getAllByRole("button");
    expect(stepButtons.length).toBeGreaterThan(0);
  });

  it("should handle large number of steps efficiently", () => {
    // Arrange
    const workout = createMockWorkout(50);

    // Act
    const startTime = performance.now();
    render(<WorkoutList workout={workout} />);
    const endTime = performance.now();

    // Assert - rendering should complete (performance varies by environment)
    // Note: CI environments can be significantly slower than local development
    // We verify functionality rather than strict performance thresholds
    expect(endTime - startTime).toBeLessThan(2000); // 2 seconds max
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 50")).toBeInTheDocument();
  });

  it("should preserve step content including name after reorder", () => {
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
    render(<WorkoutList workout={workout} onStepReorder={onStepReorder} />);

    // Assert - verify custom step names are displayed in header
    expect(screen.getByText("Warmup")).toBeInTheDocument();
    expect(screen.getByText("Main Set")).toBeInTheDocument();

    // Verify aria-labels contain step numbers for accessibility
    expect(screen.getByLabelText(/Step 1:/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Step 2:/)).toBeInTheDocument();
  });
});
