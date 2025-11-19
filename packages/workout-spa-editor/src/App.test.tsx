import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { useWorkoutStore } from "./store/workout-store";
import { renderWithProviders } from "./test-utils";
import type { KRD, Workout, WorkoutStep } from "./types/krd";

describe("App", () => {
  beforeEach(() => {
    // Reset store state before each test
    useWorkoutStore.setState({
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
      safeMode: false,
      lastBackup: null,
    });
  });

  it("should render without crashing", () => {
    const { container } = renderWithProviders(<App />);
    expect(container).toBeInTheDocument();
  });

  it("should render the welcome section when no workout is loaded", () => {
    const { container } = renderWithProviders(<App />);
    expect(container.querySelector(".space-y-6")).toBeInTheDocument();
  });

  describe("keyboard shortcuts for reordering (Requirement 29)", () => {
    const createMockStep = (stepIndex: number): WorkoutStep => ({
      stepIndex,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "watts", value: 200 },
      },
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
      extensions: { workout },
    });

    it("should move step up when Alt+ArrowUp is pressed with a selected step", () => {
      // Arrange
      const step1 = createMockStep(0);
      const step2 = createMockStep(1);
      const step3 = createMockStep(2);
      const workout = createMockWorkout([step1, step2, step3]);
      const krd = createMockKRD(workout);

      useWorkoutStore.getState().loadWorkout(krd);
      useWorkoutStore.getState().selectStep("step-1"); // Select step at index 1

      renderWithProviders(<App />);

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        altKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      const updatedWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.workout as Workout | undefined;
      expect(updatedWorkout?.steps[0]).toMatchObject({ stepIndex: 0 });
      expect(updatedWorkout?.steps[1]).toMatchObject({ stepIndex: 1 });
    });

    it("should move step down when Alt+ArrowDown is pressed with a selected step", () => {
      // Arrange
      const step1 = createMockStep(0);
      const step2 = createMockStep(1);
      const step3 = createMockStep(2);
      const workout = createMockWorkout([step1, step2, step3]);
      const krd = createMockKRD(workout);

      useWorkoutStore.getState().loadWorkout(krd);
      useWorkoutStore.getState().selectStep("step-1"); // Select step at index 1

      renderWithProviders(<App />);

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        altKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      const updatedWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.workout as Workout | undefined;
      expect(updatedWorkout?.steps[1]).toMatchObject({ stepIndex: 1 });
      expect(updatedWorkout?.steps[2]).toMatchObject({ stepIndex: 2 });
    });

    it("should not move step up when it is already at the top", () => {
      // Arrange
      const step1 = createMockStep(0);
      const step2 = createMockStep(1);
      const workout = createMockWorkout([step1, step2]);
      const krd = createMockKRD(workout);

      useWorkoutStore.getState().loadWorkout(krd);
      useWorkoutStore.getState().selectStep("step-0"); // Select first step

      renderWithProviders(<App />);

      const initialWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.workout as Workout | undefined;

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        altKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      const updatedWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.workout as Workout | undefined;
      expect(updatedWorkout?.steps).toEqual(initialWorkout?.steps);
    });

    it("should not move step down when it is already at the bottom", () => {
      // Arrange
      const step1 = createMockStep(0);
      const step2 = createMockStep(1);
      const workout = createMockWorkout([step1, step2]);
      const krd = createMockKRD(workout);

      useWorkoutStore.getState().loadWorkout(krd);
      useWorkoutStore.getState().selectStep("step-1"); // Select last step

      renderWithProviders(<App />);

      const initialWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.workout as Workout | undefined;

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        altKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      const updatedWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.workout as Workout | undefined;
      expect(updatedWorkout?.steps).toEqual(initialWorkout?.steps);
    });

    it("should not move step when no step is selected", () => {
      // Arrange
      const step1 = createMockStep(0);
      const step2 = createMockStep(1);
      const workout = createMockWorkout([step1, step2]);
      const krd = createMockKRD(workout);

      useWorkoutStore.getState().loadWorkout(krd);
      // No step selected

      renderWithProviders(<App />);

      const initialWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.workout as Workout | undefined;

      // Act
      const upEvent = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        altKey: true,
        bubbles: true,
      });
      window.dispatchEvent(upEvent);

      const downEvent = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        altKey: true,
        bubbles: true,
      });
      window.dispatchEvent(downEvent);

      // Assert
      const updatedWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.workout as Workout | undefined;
      expect(updatedWorkout?.steps).toEqual(initialWorkout?.steps);
    });

    it("should not move step when no workout is loaded", () => {
      // Arrange
      renderWithProviders(<App />);

      // Act
      const upEvent = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        altKey: true,
        bubbles: true,
      });
      window.dispatchEvent(upEvent);

      const downEvent = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        altKey: true,
        bubbles: true,
      });
      window.dispatchEvent(downEvent);

      // Assert - no error thrown
      expect(useWorkoutStore.getState().currentWorkout).toBeNull();
    });
  });
});
