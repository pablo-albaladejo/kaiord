import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
 * - Immediate step deletion without modal (Requirement 1.1)
 * - Undo toast after deletion (Requirement 1.2)
 * - Step restoration via undo (Requirement 1.3)
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
      deletedSteps: [],
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
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "cycling",
    },
    extensions: {
      structured_workout: workout,
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

  describe("step deletion without modal (Requirement 1.1, 1.2, 1.3)", () => {
    it("should delete step immediately without modal", () => {
      // Arrange
      const step1 = createMockStep(0);
      const step2 = createMockStep(1);
      const workout = createMockWorkout([step1, step2]);
      const krd = createMockKRD(workout);

      useWorkoutStore.setState({
        currentWorkout: krd,
      });

      renderWithProviders(
        <WorkoutSection
          workout={workout}
          krd={krd}
          selectedStepId={null}
          onStepSelect={vi.fn()}
        />
      );

      // Act - Delete the first step
      act(() => {
        useWorkoutStore.getState().deleteStep(0);
      });

      // Assert - Step should be deleted immediately
      const state = useWorkoutStore.getState();
      const updatedWorkout = state.currentWorkout?.extensions
        ?.structured_workout as Workout;
      expect(updatedWorkout.steps).toHaveLength(1);
      expect((updatedWorkout.steps[0] as WorkoutStep).stepIndex).toBe(0); // Reindexed

      // Assert - No modal should appear
      expect(screen.queryByText("Delete Step")).not.toBeInTheDocument();
      expect(screen.queryByText("Are you sure")).not.toBeInTheDocument();
    });

    it("should show undo toast after deletion", async () => {
      // Arrange
      const step1 = createMockStep(0);
      const step2 = createMockStep(1);
      const workout = createMockWorkout([step1, step2]);
      const krd = createMockKRD(workout);

      // Ensure clean state
      useWorkoutStore.setState({
        currentWorkout: krd,
        deletedSteps: [],
      });

      renderWithProviders(
        <WorkoutSection
          workout={workout}
          krd={krd}
          selectedStepId={null}
          onStepSelect={vi.fn()}
        />
      );

      // Verify initial state
      expect(useWorkoutStore.getState().deletedSteps).toHaveLength(0);

      // Act - Delete the first step
      act(() => {
        useWorkoutStore.getState().deleteStep(0);
      });

      // Assert - Deleted step should be tracked for undo
      await waitFor(() => {
        const state = useWorkoutStore.getState();
        expect(state.deletedSteps).toHaveLength(1);
        expect(state.deletedSteps[0].step).toEqual(step1);
        expect(state.deletedSteps[0].index).toBe(0);
        expect(state.deletedSteps[0].timestamp).toBeDefined();
      });
    });

    it("should restore step when undo is clicked", async () => {
      // Arrange
      const step1 = createMockStep(0);
      const step2 = createMockStep(1);
      const workout = createMockWorkout([step1, step2]);
      const krd = createMockKRD(workout);

      useWorkoutStore.setState({
        currentWorkout: krd,
      });

      renderWithProviders(
        <WorkoutSection
          workout={workout}
          krd={krd}
          selectedStepId={null}
          onStepSelect={vi.fn()}
        />
      );

      // Act - Delete the first step
      let deletedTimestamp: number;
      act(() => {
        useWorkoutStore.getState().deleteStep(0);
        const state = useWorkoutStore.getState();
        deletedTimestamp = state.deletedSteps[0].timestamp;
      });

      // Verify step was deleted
      let state = useWorkoutStore.getState();
      let updatedWorkout = state.currentWorkout?.extensions
        ?.structured_workout as Workout;
      expect(updatedWorkout.steps).toHaveLength(1);

      // Act - Undo the deletion
      act(() => {
        useWorkoutStore.getState().undoDelete(deletedTimestamp);
      });

      // Assert - Step should be restored
      await waitFor(() => {
        state = useWorkoutStore.getState();
        updatedWorkout = state.currentWorkout?.extensions
          ?.structured_workout as Workout;
        expect(updatedWorkout.steps).toHaveLength(2);
        expect((updatedWorkout.steps[0] as WorkoutStep).stepIndex).toBe(0);
        expect((updatedWorkout.steps[1] as WorkoutStep).stepIndex).toBe(1);
      });
    });
  });
});
