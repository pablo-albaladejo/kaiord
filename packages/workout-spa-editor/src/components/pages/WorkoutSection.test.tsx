import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useWorkoutStore } from "../../store/workout-store";
import type { KRD, Workout, WorkoutStep } from "../../types/krd";
import { WorkoutSection } from "./WorkoutSection/WorkoutSection";

/**
 * WorkoutSection Tests
 *
 * Tests the step editing flow (Requirement 3):
 * - Opening StepEditor on step selection
 * - Updating workout state on save
 * - Reverting changes on cancel
 * - Closing editor after save/cancel
 */
describe("WorkoutSection", () => {
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

  const createMockWorkout = (steps: Array<WorkoutStep>): Workout => ({
    name: "Test Workout",
    sport: "cycling",
    steps,
  });

  const createMockKRD = (workout: Workout): KRD => ({
    version: "1.0",
    type: "workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "cycling",
    },
    extensions: {
      workout,
    },
  });

  it("should render workout information", () => {
    // Arrange
    const workout = createMockWorkout([createMockStep(0)]);
    const krd = createMockKRD(workout);

    // Act
    render(
      <WorkoutSection
        workout={workout}
        krd={krd}
        selectedStepId={null}
        onStepSelect={vi.fn()}
      />
    );

    // Assert
    expect(
      screen.getByText(workout.name || "Untitled Workout")
    ).toBeInTheDocument();
    expect(screen.getByText(/Sport:/)).toBeInTheDocument();
  });

  it("should open StepEditor when step is selected and editing is enabled", () => {
    // Arrange
    const workout = createMockWorkout([createMockStep(0)]);
    const krd = createMockKRD(workout);
    const selectedStepId = `step-${workout.steps[0].stepIndex}`;

    // Set editing state to true
    useWorkoutStore.setState({ isEditing: true });

    // Act
    render(
      <WorkoutSection
        workout={workout}
        krd={krd}
        selectedStepId={selectedStepId}
        onStepSelect={vi.fn()}
      />
    );

    // Assert - StepEditor should be visible with Edit Step heading
    expect(screen.getByText(/Edit Step/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Save step changes/ })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/ })).toBeInTheDocument();
  });

  it("should not show StepEditor when no step is selected", () => {
    // Arrange
    const workout = createMockWorkout([createMockStep(0)]);
    const krd = createMockKRD(workout);

    useWorkoutStore.setState({ isEditing: false });

    // Act
    render(
      <WorkoutSection
        workout={workout}
        krd={krd}
        selectedStepId={null}
        onStepSelect={vi.fn()}
      />
    );

    // Assert - StepEditor should not be visible (no Edit Step heading)
    expect(screen.queryByText(/Edit Step/)).not.toBeInTheDocument();
  });

  it("should show editor when step is selected and editing is true", () => {
    // Arrange
    const workout = createMockWorkout([createMockStep(0)]);
    const krd = createMockKRD(workout);

    // Set up state with a selected step and editing enabled
    useWorkoutStore.setState({
      isEditing: true,
      selectedStepId: "step-0",
    });

    // Act
    render(
      <WorkoutSection
        workout={workout}
        krd={krd}
        selectedStepId="step-0"
        onStepSelect={vi.fn()}
      />
    );

    // Assert - Editor should be visible
    expect(screen.getByText(/Edit Step/)).toBeInTheDocument();
  });

  it("should close editor and clear selection on cancel", () => {
    // Arrange
    const workout = createMockWorkout([createMockStep(0)]);
    const krd = createMockKRD(workout);
    const selectedStepId = `step-${workout.steps[0].stepIndex}`;

    useWorkoutStore.setState({
      isEditing: true,
      selectedStepId,
    });

    render(
      <WorkoutSection
        workout={workout}
        krd={krd}
        selectedStepId={selectedStepId}
        onStepSelect={vi.fn()}
      />
    );

    // Act - Click cancel button
    const cancelButton = screen.getByText(/Cancel/);
    cancelButton.click();

    // Assert
    expect(useWorkoutStore.getState().isEditing).toBe(false);
    expect(useWorkoutStore.getState().selectedStepId).toBe(null);
  });
});
