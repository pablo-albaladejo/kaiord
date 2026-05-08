import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import App from "./App";
import { useWorkoutStore } from "./store/workout-store";
import { renderWithProviders, screen } from "./test-utils";
import type { KRD, Workout, WorkoutStep } from "./types/krd";

const STEP3_POWER_WATTS = 300;
const TUTORIAL_TOTAL_STEPS = 6;
const TUTORIAL_LAST_INDEX = 5;

describe("App", () => {
  beforeEach(() => {
    // Reset store state before each test
    useWorkoutStore.setState({
      currentWorkout: null,
      undoHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
      safeMode: false,
      lastBackup: null,
      deletedSteps: [],
    });

    // Clear localStorage before each test
    localStorage.clear();

    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      };
    })();

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  it("should render without crashing", () => {
    // Arrange

    // Act

    const { container } = renderWithProviders(<App />);

    // Assert

    expect(container).toBeInTheDocument();
  });

  it("should render the calendar page by default when no workout is loaded", async () => {
    // Arrange

    window.localStorage.setItem("workout-spa-onboarding-completed", "true");

    // Act

    renderWithProviders(<App />);

    // Assert

    expect(await screen.findByText("Welcome to Kaiord")).toBeInTheDocument();
  });

  describe("onboarding tutorial integration (Requirements 37.1, 37.5)", () => {
    it("should show tutorial on first visit", async () => {
      // Arrange - localStorage is empty (first visit)

      // Act
      // Arrange

      // Act

      renderWithProviders(<App />);

      // Assert - Tutorial should appear (check for unique tutorial content)

      // Assert

      await waitFor(
        () => {
          expect(
            screen.getByText(
              /this tutorial will guide you through the key features/i
            )
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it("should not show tutorial if already completed", () => {
      // Arrange - Mark tutorial as completed
      // Arrange

      localStorage.setItem("workout-spa-onboarding-completed", "true");

      // Act

      // Act

      renderWithProviders(<App />);

      // Assert - Tutorial should not appear (check for unique tutorial content)

      // Assert

      expect(
        screen.queryByText(
          /this tutorial will guide you through the key features/i
        )
      ).not.toBeInTheDocument();
    });

    it("should allow skipping tutorial", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();

      // Act

      renderWithProviders(<App />);

      // Wait for tutorial to appear

      // Assert

      await waitFor(
        () => {
          expect(
            screen.getByText(
              /this tutorial will guide you through the key features/i
            )
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Act - Click the "Skip" button
      const skipButton = screen.getByRole("button", { name: /^skip$/i });
      await user.click(skipButton);

      // Assert - Tutorial should be closed
      await waitFor(
        () => {
          expect(
            screen.queryByText(
              /this tutorial will guide you through the key features/i
            )
          ).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Verify completion state was saved
      expect(localStorage.getItem("workout-spa-onboarding-completed")).toBe(
        "true"
      );
    });

    it("should save completion state when tutorial is completed", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();

      // Act

      renderWithProviders(<App />);

      // Wait for tutorial to appear

      // Assert

      await waitFor(
        () => {
          expect(
            screen.getByText(
              /this tutorial will guide you through the key features/i
            )
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Act - Navigate through all steps and complete
      // Click through all 6 steps (0-5)
      for (let i = 0; i < TUTORIAL_TOTAL_STEPS; i++) {
        // On the last step, the button says "Finish", otherwise "Next"
        const buttonName = i === TUTORIAL_LAST_INDEX ? /finish/i : /next/i;
        const button = screen.getByRole("button", {
          name: buttonName,
        });
        await user.click(button);

        // Wait a bit for the state to update between clicks
        if (i < TUTORIAL_LAST_INDEX) {
          await waitFor(() => {
            expect(screen.getByText(`Step ${i + 2} of 6`)).toBeInTheDocument();
          });
        }
      }

      // Assert - Tutorial should be closed
      await waitFor(
        () => {
          expect(
            screen.queryByText(
              /this tutorial will guide you through the key features/i
            )
          ).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Verify completion state was saved
      expect(localStorage.getItem("workout-spa-onboarding-completed")).toBe(
        "true"
      );
    });
  });

  describe("keyboard shortcuts for reordering (Requirement 29)", () => {
    const createMockStep = (
      stepIndex: number,
      powerValue: number
    ): WorkoutStep => ({
      stepIndex,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "power",
      target: {
        type: "power",
        value: { unit: "watts", value: powerValue },
      },
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
      extensions: { structured_workout: workout },
    });

    it("should move step up when Alt+ArrowUp is pressed with a selected step", () => {
      // Arrange
      // Arrange

      const step1 = createMockStep(0, 100); // 100W
      const step2 = createMockStep(1, 200); // 200W
      const step3 = createMockStep(2, STEP3_POWER_WATTS); // 300W
      const workout = createMockWorkout([step1, step2, step3]);
      const krd = createMockKRD(workout);

      useWorkoutStore.getState().loadWorkout(krd);
      // loadWorkout hydrates every step with a stable ItemId; read the
      // freshly-assigned id of step[1] and select by that.
      const hydratedSteps = (
        useWorkoutStore.getState().currentWorkout?.extensions
          ?.structured_workout as Workout
      ).steps;
      useWorkoutStore
        .getState()
        .selectStep((hydratedSteps[1] as { id: string }).id);

      renderWithProviders(<App />);

      // Capture initial step identities by power value
      const initialWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.structured_workout as Workout | undefined;
      const initialStep0Power = (initialWorkout?.steps[0] as WorkoutStep).target
        .value?.value;
      const initialStep1Power = (initialWorkout?.steps[1] as WorkoutStep).target
        .value?.value;

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        altKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      const updatedWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.structured_workout as Workout | undefined;
      const updatedStep0 = updatedWorkout?.steps[0] as WorkoutStep;

      // Act

      const updatedStep1 = updatedWorkout?.steps[1] as WorkoutStep;

      // Verify that the step that was at index 1 is now at index 0

      // Assert

      expect(updatedStep0.target.value?.value).toBe(initialStep1Power);
      expect(updatedStep0.target.value?.value).toBe(200);

      // Verify that the step that was at index 0 is now at index 1
      expect(updatedStep1.target.value?.value).toBe(initialStep0Power);
      expect(updatedStep1.target.value?.value).toBe(100);

      // Verify stepIndex properties remain stable (no reindexing)
      expect(updatedStep0.stepIndex).toBe(1); // Was step1, keeps stepIndex=1
      expect(updatedStep1.stepIndex).toBe(0); // Was step0, keeps stepIndex=0
    });

    it("should move step down when Alt+ArrowDown is pressed with a selected step", () => {
      // Arrange
      // Arrange

      const step1 = createMockStep(0, 100); // 100W
      const step2 = createMockStep(1, 200); // 200W
      const step3 = createMockStep(2, STEP3_POWER_WATTS); // 300W
      const workout = createMockWorkout([step1, step2, step3]);
      const krd = createMockKRD(workout);

      useWorkoutStore.getState().loadWorkout(krd);
      const hydratedSteps = (
        useWorkoutStore.getState().currentWorkout?.extensions
          ?.structured_workout as Workout
      ).steps;
      useWorkoutStore
        .getState()
        .selectStep((hydratedSteps[1] as { id: string }).id);

      renderWithProviders(<App />);

      // Capture initial step identities by power value
      const initialWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.structured_workout as Workout | undefined;
      const initialStep1Power = (initialWorkout?.steps[1] as WorkoutStep).target
        .value?.value;
      const initialStep2Power = (initialWorkout?.steps[2] as WorkoutStep).target
        .value?.value;

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        altKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      const updatedWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.structured_workout as Workout | undefined;
      const updatedStep1 = updatedWorkout?.steps[1] as WorkoutStep;

      // Act

      const updatedStep2 = updatedWorkout?.steps[2] as WorkoutStep;

      // Verify that the step that was at index 2 is now at index 1

      // Assert

      expect(updatedStep1.target.value?.value).toBe(initialStep2Power);
      expect(updatedStep1.target.value?.value).toBe(STEP3_POWER_WATTS);

      // Verify that the step that was at index 1 is now at index 2
      expect(updatedStep2.target.value?.value).toBe(initialStep1Power);
      expect(updatedStep2.target.value?.value).toBe(200);

      // Verify stepIndex properties remain stable (no reindexing)
      expect(updatedStep1.stepIndex).toBe(2); // Was step2, keeps stepIndex=2
      expect(updatedStep2.stepIndex).toBe(1); // Was step1, keeps stepIndex=1
    });

    it("should not move step up when it is already at the top", () => {
      // Arrange
      // Arrange

      const step1 = createMockStep(0, 100);
      const step2 = createMockStep(1, 200);
      const workout = createMockWorkout([step1, step2]);
      const krd = createMockKRD(workout);

      useWorkoutStore.getState().loadWorkout(krd);
      const hydrated = (
        useWorkoutStore.getState().currentWorkout?.extensions
          ?.structured_workout as Workout
      ).steps;
      useWorkoutStore.getState().selectStep((hydrated[0] as { id: string }).id);

      renderWithProviders(<App />);

      const initialWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.structured_workout as Workout | undefined;

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        altKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert

      // Act

      const updatedWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.structured_workout as Workout | undefined;

      // Assert

      expect(updatedWorkout?.steps).toEqual(initialWorkout?.steps);
    });

    it("should not move step down when it is already at the bottom", () => {
      // Arrange
      // Arrange

      const step1 = createMockStep(0, 100);
      const step2 = createMockStep(1, 200);
      const workout = createMockWorkout([step1, step2]);
      const krd = createMockKRD(workout);

      useWorkoutStore.getState().loadWorkout(krd);
      const hydrated = (
        useWorkoutStore.getState().currentWorkout?.extensions
          ?.structured_workout as Workout
      ).steps;
      useWorkoutStore.getState().selectStep((hydrated[1] as { id: string }).id);

      renderWithProviders(<App />);

      const initialWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.structured_workout as Workout | undefined;

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        altKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert

      // Act

      const updatedWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.structured_workout as Workout | undefined;

      // Assert

      expect(updatedWorkout?.steps).toEqual(initialWorkout?.steps);
    });

    it("should not move step when no step is selected", () => {
      // Arrange
      // Arrange

      const step1 = createMockStep(0, 100);
      const step2 = createMockStep(1, 200);
      const workout = createMockWorkout([step1, step2]);
      const krd = createMockKRD(workout);

      useWorkoutStore.getState().loadWorkout(krd);
      // No step selected

      renderWithProviders(<App />);

      const initialWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.structured_workout as Workout | undefined;

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

      // Act

      const updatedWorkout = useWorkoutStore.getState().currentWorkout
        ?.extensions?.structured_workout as Workout | undefined;

      // Assert

      expect(updatedWorkout?.steps).toEqual(initialWorkout?.steps);
    });

    it("should not move step when no workout is loaded", () => {
      // Arrange
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

      // Act

      window.dispatchEvent(downEvent);

      // Assert - no error thrown

      // Assert

      expect(useWorkoutStore.getState().currentWorkout).toBeNull();
    });
  });
});
