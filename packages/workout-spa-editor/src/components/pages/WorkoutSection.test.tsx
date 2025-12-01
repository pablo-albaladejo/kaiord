import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach } from "node:test";
import { describe, expect, it, vi } from "vitest";
import { useWorkoutStore } from "../../store/workout-store";
import { renderWithProviders } from "../../test-utils";
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
  beforeEach(() => {
    // Reset store state before each test
    useWorkoutStore.setState({
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      isEditing: false,
    });
  });

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
    renderWithProviders(
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

  it("should render SaveToLibraryButton when workout is loaded (Requirement 17)", () => {
    // Arrange
    const workout = createMockWorkout([createMockStep(0)]);
    const krd = createMockKRD(workout);

    // Act
    renderWithProviders(
      <WorkoutSection
        workout={workout}
        krd={krd}
        selectedStepId={null}
        onStepSelect={vi.fn()}
      />
    );

    // Assert
    expect(
      screen.getByRole("button", { name: /Save to Library/i })
    ).toBeInTheDocument();
  });

  it("should open StepEditor when step is selected and editing is enabled", () => {
    // Arrange
    const workout = createMockWorkout([createMockStep(0)]);
    const krd = createMockKRD(workout);
    const selectedStepId = `step-${workout.steps[0].stepIndex}`;

    // Set editing state to true
    useWorkoutStore.setState({ isEditing: true });

    // Act
    renderWithProviders(
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
    renderWithProviders(
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
    renderWithProviders(
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

  it("should close editor and clear selection on cancel", async () => {
    // Arrange
    const workout = createMockWorkout([createMockStep(0)]);
    const krd = createMockKRD(workout);
    const selectedStepId = `step-${workout.steps[0].stepIndex}`;

    useWorkoutStore.setState({
      isEditing: true,
      selectedStepId,
    });

    renderWithProviders(
      <WorkoutSection
        workout={workout}
        krd={krd}
        selectedStepId={selectedStepId}
        onStepSelect={vi.fn()}
      />
    );

    // Act - Click cancel button
    const cancelButton = screen.getByText(/Cancel/);
    await act(async () => {
      cancelButton.click();
    });

    // Assert - Wait for state updates
    await waitFor(() => {
      expect(useWorkoutStore.getState().isEditing).toBe(false);
      expect(useWorkoutStore.getState().selectedStepId).toBe(null);
    });
  });

  describe("CreateRepetitionBlockButton integration (Requirement 7.1)", () => {
    it("should not show create repetition block button when no steps selected", () => {
      // Arrange
      const workout = createMockWorkout([createMockStep(0), createMockStep(1)]);
      const krd = createMockKRD(workout);

      useWorkoutStore.setState({
        selectedStepIds: [],
      });

      // Act
      renderWithProviders(
        <WorkoutSection
          workout={workout}
          krd={krd}
          selectedStepId={null}
          onStepSelect={vi.fn()}
        />
      );

      // Assert
      expect(
        screen.queryByTestId("create-repetition-block-button")
      ).not.toBeInTheDocument();
    });

    it("should not show create repetition block button when only 1 step selected", () => {
      // Arrange
      const workout = createMockWorkout([createMockStep(0), createMockStep(1)]);
      const krd = createMockKRD(workout);

      useWorkoutStore.setState({
        selectedStepIds: ["step-0"],
      });

      // Act
      renderWithProviders(
        <WorkoutSection
          workout={workout}
          krd={krd}
          selectedStepId={null}
          onStepSelect={vi.fn()}
        />
      );

      // Assert
      expect(
        screen.queryByTestId("create-repetition-block-button")
      ).not.toBeInTheDocument();
    });

    it("should show create repetition block button when 2+ steps selected", () => {
      // Arrange
      const workout = createMockWorkout([
        createMockStep(0),
        createMockStep(1),
        createMockStep(2),
      ]);
      const krd = createMockKRD(workout);

      useWorkoutStore.setState({
        selectedStepIds: ["step-0", "step-1"],
      });

      // Act
      renderWithProviders(
        <WorkoutSection
          workout={workout}
          krd={krd}
          selectedStepId={null}
          onStepSelect={vi.fn()}
        />
      );

      // Assert
      const button = screen.getByTestId("create-repetition-block-button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Create Repetition Block (2 steps)");
    });

    it("should open CreateRepetitionBlockDialog when button clicked", async () => {
      // Arrange
      const workout = createMockWorkout([createMockStep(0), createMockStep(1)]);
      const krd = createMockKRD(workout);

      useWorkoutStore.setState({
        selectedStepIds: ["step-0", "step-1"],
      });

      renderWithProviders(
        <WorkoutSection
          workout={workout}
          krd={krd}
          selectedStepId={null}
          onStepSelect={vi.fn()}
        />
      );

      // Act - Click create repetition block button
      const button = screen.getByTestId("create-repetition-block-button");
      await act(async () => {
        button.click();
      });

      // Assert - Dialog should be visible
      await waitFor(() => {
        expect(screen.getByText("Create Repetition Block")).toBeInTheDocument();
        expect(screen.getByLabelText("Repeat Count")).toBeInTheDocument();
      });
    });

    it("should create repetition block and clear selection on confirm", async () => {
      // Arrange
      const workout = createMockWorkout([createMockStep(0), createMockStep(1)]);
      const krd = createMockKRD(workout);

      useWorkoutStore.setState({
        currentWorkout: krd,
        selectedStepIds: ["step-0", "step-1"],
      });

      renderWithProviders(
        <WorkoutSection
          workout={workout}
          krd={krd}
          selectedStepId={null}
          onStepSelect={vi.fn()}
        />
      );

      // Act - Open dialog
      const button = screen.getByTestId("create-repetition-block-button");
      await act(async () => {
        button.click();
      });

      // Act - Confirm with repeat count
      await waitFor(() => {
        expect(screen.getByLabelText("Repeat Count")).toBeInTheDocument();
      });

      const input = screen.getByLabelText("Repeat Count");
      await act(async () => {
        input.focus();
        // Input already has default value of "2"
      });

      const confirmButton = screen.getByTestId("confirm-create-block-button");
      await act(async () => {
        confirmButton.click();
      });

      // Assert - Dialog should close and selection should be cleared
      await waitFor(() => {
        expect(
          screen.queryByText("Create Repetition Block")
        ).not.toBeInTheDocument();
        expect(useWorkoutStore.getState().selectedStepIds).toHaveLength(0);
      });
    });

    it("should close dialog without creating block on cancel", async () => {
      // Arrange
      const workout = createMockWorkout([createMockStep(0), createMockStep(1)]);
      const krd = createMockKRD(workout);

      useWorkoutStore.setState({
        selectedStepIds: ["step-0", "step-1"],
      });

      renderWithProviders(
        <WorkoutSection
          workout={workout}
          krd={krd}
          selectedStepId={null}
          onStepSelect={vi.fn()}
        />
      );

      // Act - Open dialog
      const button = screen.getByTestId("create-repetition-block-button");
      await act(async () => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByText("Create Repetition Block")).toBeInTheDocument();
      });

      // Act - Cancel
      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await act(async () => {
        cancelButton.click();
      });

      // Assert - Dialog should close, selection should remain
      await waitFor(() => {
        expect(
          screen.queryByText("Create Repetition Block")
        ).not.toBeInTheDocument();
        expect(useWorkoutStore.getState().selectedStepIds).toHaveLength(2);
      });
    });

    it("should display correct step count in button text", () => {
      // Arrange
      const workout = createMockWorkout([
        createMockStep(0),
        createMockStep(1),
        createMockStep(2),
        createMockStep(3),
      ]);
      const krd = createMockKRD(workout);

      useWorkoutStore.setState({
        selectedStepIds: ["step-0", "step-1", "step-2"],
      });

      // Act
      renderWithProviders(
        <WorkoutSection
          workout={workout}
          krd={krd}
          selectedStepId={null}
          onStepSelect={vi.fn()}
        />
      );

      // Assert
      const button = screen.getByTestId("create-repetition-block-button");
      expect(button).toHaveTextContent("Create Repetition Block (3 steps)");
    });
  });
});
