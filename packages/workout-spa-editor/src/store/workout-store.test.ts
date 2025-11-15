/**
 * Workout Store Tests
 *
 * Tests for the Zustand workout store implementation.
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { KRD } from "../types/krd";
import { useWorkoutStore } from "./workout-store";

describe("useWorkoutStore", () => {
  // Reset store before each test
  beforeEach(() => {
    useWorkoutStore.setState({
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      isEditing: false,
    });
  });

  describe("initial state", () => {
    it("should have null workout initially", () => {
      // Arrange & Act
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.currentWorkout).toBeNull();
    });

    it("should have null selectedStepId initially", () => {
      // Arrange & Act
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.selectedStepId).toBeNull();
    });

    it("should have isEditing false initially", () => {
      // Arrange & Act
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.isEditing).toBe(false);
    });
  });

  describe("loadWorkout", () => {
    it("should load a workout into the store", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Test Workout",
            sport: "running",
            steps: [],
          },
        },
      };

      // Act
      useWorkoutStore.getState().loadWorkout(mockKrd);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.currentWorkout).toEqual(mockKrd);
    });

    it("should reset selectedStepId when loading a workout", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          workout: {
            sport: "cycling",
            steps: [],
          },
        },
      };

      useWorkoutStore.setState({ selectedStepId: "step-123" });

      // Act
      useWorkoutStore.getState().loadWorkout(mockKrd);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.selectedStepId).toBeNull();
    });

    it("should reset isEditing when loading a workout", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "swimming",
        },
        extensions: {
          workout: {
            sport: "swimming",
            steps: [],
          },
        },
      };

      useWorkoutStore.setState({ isEditing: true });

      // Act
      useWorkoutStore.getState().loadWorkout(mockKrd);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.isEditing).toBe(false);
    });
  });

  describe("updateWorkout", () => {
    it("should update the current workout", () => {
      // Arrange
      const initialKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Initial Workout",
            sport: "running",
            steps: [],
          },
        },
      };

      const updatedKrd: KRD = {
        ...initialKrd,
        extensions: {
          workout: {
            name: "Updated Workout",
            sport: "running",
            steps: [],
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(initialKrd);

      // Act
      useWorkoutStore.getState().updateWorkout(updatedKrd);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.currentWorkout).toEqual(updatedKrd);
      expect(
        (state.currentWorkout?.extensions?.workout as { name?: string })?.name
      ).toBe("Updated Workout");
    });

    it("should preserve selectedStepId when updating workout", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          workout: {
            sport: "cycling",
            steps: [],
          },
        },
      };

      useWorkoutStore.setState({
        currentWorkout: mockKrd,
        selectedStepId: "step-456",
      });

      // Act
      useWorkoutStore.getState().updateWorkout(mockKrd);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.selectedStepId).toBe("step-456");
    });

    it("should preserve isEditing when updating workout", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "swimming",
        },
        extensions: {
          workout: {
            sport: "swimming",
            steps: [],
          },
        },
      };

      useWorkoutStore.setState({
        currentWorkout: mockKrd,
        isEditing: true,
      });

      // Act
      useWorkoutStore.getState().updateWorkout(mockKrd);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.isEditing).toBe(true);
    });
  });

  describe("selectStep", () => {
    it("should select a step by ID", () => {
      // Arrange
      const stepId = "step-789";

      // Act
      useWorkoutStore.getState().selectStep(stepId);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.selectedStepId).toBe(stepId);
    });

    it("should deselect when passed null", () => {
      // Arrange
      useWorkoutStore.setState({ selectedStepId: "step-123" });

      // Act
      useWorkoutStore.getState().selectStep(null);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.selectedStepId).toBeNull();
    });

    it("should allow changing selection from one step to another", () => {
      // Arrange
      useWorkoutStore.setState({ selectedStepId: "step-1" });

      // Act
      useWorkoutStore.getState().selectStep("step-2");
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.selectedStepId).toBe("step-2");
    });
  });

  describe("setEditing", () => {
    it("should set isEditing to true", () => {
      // Arrange & Act
      useWorkoutStore.getState().setEditing(true);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.isEditing).toBe(true);
    });

    it("should set isEditing to false", () => {
      // Arrange
      useWorkoutStore.setState({ isEditing: true });

      // Act
      useWorkoutStore.getState().setEditing(false);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.isEditing).toBe(false);
    });
  });

  describe("clearWorkout", () => {
    it("should clear the current workout", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            sport: "running",
            steps: [],
          },
        },
      };

      useWorkoutStore.setState({
        currentWorkout: mockKrd,
        selectedStepId: "step-123",
        isEditing: true,
      });

      // Act
      useWorkoutStore.getState().clearWorkout();
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.currentWorkout).toBeNull();
      expect(state.selectedStepId).toBeNull();
      expect(state.isEditing).toBe(false);
    });
  });

  describe("undo/redo functionality", () => {
    it("should initialize with empty history", () => {
      // Arrange & Act
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.workoutHistory).toEqual([]);
      expect(state.historyIndex).toBe(-1);
    });

    it("should add workout to history when loading", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Test Workout",
            sport: "running",
            steps: [],
          },
        },
      };

      // Act
      useWorkoutStore.getState().loadWorkout(mockKrd);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.workoutHistory).toHaveLength(1);
      expect(state.workoutHistory[0]).toEqual(mockKrd);
      expect(state.historyIndex).toBe(0);
    });

    it("should add workout to history when updating", () => {
      // Arrange
      const initialKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Initial",
            sport: "running",
            steps: [],
          },
        },
      };

      const updatedKrd: KRD = {
        ...initialKrd,
        extensions: {
          workout: {
            name: "Updated",
            sport: "running",
            steps: [],
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(initialKrd);

      // Act
      useWorkoutStore.getState().updateWorkout(updatedKrd);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.workoutHistory).toHaveLength(2);
      expect(state.workoutHistory[0]).toEqual(initialKrd);
      expect(state.workoutHistory[1]).toEqual(updatedKrd);
      expect(state.historyIndex).toBe(1);
    });

    it("should undo to previous state", () => {
      // Arrange
      const krd1: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Version 1",
            sport: "running",
            steps: [],
          },
        },
      };

      const krd2: KRD = {
        ...krd1,
        extensions: {
          workout: {
            name: "Version 2",
            sport: "running",
            steps: [],
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(krd1);
      useWorkoutStore.getState().updateWorkout(krd2);

      // Act
      useWorkoutStore.getState().undo();
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.currentWorkout).toEqual(krd1);
      expect(state.historyIndex).toBe(0);
    });

    it("should redo to next state", () => {
      // Arrange
      const krd1: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          workout: {
            name: "Version 1",
            sport: "cycling",
            steps: [],
          },
        },
      };

      const krd2: KRD = {
        ...krd1,
        extensions: {
          workout: {
            name: "Version 2",
            sport: "cycling",
            steps: [],
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(krd1);
      useWorkoutStore.getState().updateWorkout(krd2);
      useWorkoutStore.getState().undo();

      // Act
      useWorkoutStore.getState().redo();
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.currentWorkout).toEqual(krd2);
      expect(state.historyIndex).toBe(1);
    });

    it("should not undo when at beginning of history", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "swimming",
        },
        extensions: {
          workout: {
            sport: "swimming",
            steps: [],
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(mockKrd);

      // Act
      useWorkoutStore.getState().undo();
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.currentWorkout).toEqual(mockKrd);
      expect(state.historyIndex).toBe(0);
    });

    it("should not redo when at end of history", () => {
      // Arrange
      const krd1: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Version 1",
            sport: "running",
            steps: [],
          },
        },
      };

      const krd2: KRD = {
        ...krd1,
        extensions: {
          workout: {
            name: "Version 2",
            sport: "running",
            steps: [],
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(krd1);
      useWorkoutStore.getState().updateWorkout(krd2);

      // Act
      useWorkoutStore.getState().redo();
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.currentWorkout).toEqual(krd2);
      expect(state.historyIndex).toBe(1);
    });

    it("should clear redo history when making new change after undo", () => {
      // Arrange
      const krd1: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Version 1",
            sport: "running",
            steps: [],
          },
        },
      };

      const krd2: KRD = {
        ...krd1,
        extensions: {
          workout: {
            name: "Version 2",
            sport: "running",
            steps: [],
          },
        },
      };

      const krd3: KRD = {
        ...krd1,
        extensions: {
          workout: {
            name: "Version 3",
            sport: "running",
            steps: [],
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(krd1);
      useWorkoutStore.getState().updateWorkout(krd2);
      useWorkoutStore.getState().undo();

      // Act
      useWorkoutStore.getState().updateWorkout(krd3);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.workoutHistory).toHaveLength(2);
      expect(state.workoutHistory[0]).toEqual(krd1);
      expect(state.workoutHistory[1]).toEqual(krd3);
      expect(state.historyIndex).toBe(1);
    });

    it("should limit history to 50 states", () => {
      // Arrange
      const baseKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Initial",
            sport: "running",
            steps: [],
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(baseKrd);

      // Act - Add 60 updates
      for (let i = 1; i <= 60; i++) {
        const updatedKrd: KRD = {
          ...baseKrd,
          extensions: {
            workout: {
              name: `Version ${i}`,
              sport: "running",
              steps: [],
            },
          },
        };
        useWorkoutStore.getState().updateWorkout(updatedKrd);
      }

      const state = useWorkoutStore.getState();

      // Assert
      expect(state.workoutHistory).toHaveLength(50);
      expect(state.historyIndex).toBe(49);
      expect(
        (state.workoutHistory[0].extensions?.workout as { name?: string })?.name
      ).toBe("Version 11");
      expect(
        (state.workoutHistory[49].extensions?.workout as { name?: string })
          ?.name
      ).toBe("Version 60");
    });

    it("should report canUndo correctly", () => {
      // Arrange
      const krd1: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            sport: "running",
            steps: [],
          },
        },
      };

      const krd2: KRD = {
        ...krd1,
        extensions: {
          workout: {
            name: "Updated",
            sport: "running",
            steps: [],
          },
        },
      };

      // Act & Assert - No history
      expect(useWorkoutStore.getState().canUndo()).toBe(false);

      // Load workout
      useWorkoutStore.getState().loadWorkout(krd1);
      expect(useWorkoutStore.getState().canUndo()).toBe(false);

      // Update workout
      useWorkoutStore.getState().updateWorkout(krd2);
      expect(useWorkoutStore.getState().canUndo()).toBe(true);

      // Undo
      useWorkoutStore.getState().undo();
      expect(useWorkoutStore.getState().canUndo()).toBe(false);
    });

    it("should report canRedo correctly", () => {
      // Arrange
      const krd1: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          workout: {
            sport: "cycling",
            steps: [],
          },
        },
      };

      const krd2: KRD = {
        ...krd1,
        extensions: {
          workout: {
            name: "Updated",
            sport: "cycling",
            steps: [],
          },
        },
      };

      // Act & Assert - No history
      expect(useWorkoutStore.getState().canRedo()).toBe(false);

      // Load and update
      useWorkoutStore.getState().loadWorkout(krd1);
      useWorkoutStore.getState().updateWorkout(krd2);
      expect(useWorkoutStore.getState().canRedo()).toBe(false);

      // Undo
      useWorkoutStore.getState().undo();
      expect(useWorkoutStore.getState().canRedo()).toBe(true);

      // Redo
      useWorkoutStore.getState().redo();
      expect(useWorkoutStore.getState().canRedo()).toBe(false);
    });

    it("should clear history when clearing workout", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            sport: "running",
            steps: [],
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(mockKrd);
      useWorkoutStore.getState().updateWorkout(mockKrd);

      // Act
      useWorkoutStore.getState().clearWorkout();
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.workoutHistory).toEqual([]);
      expect(state.historyIndex).toBe(-1);
    });
  });

<<<<<<< HEAD
  describe("createStep", () => {
    it("should add a new step with default values to the end of the workout", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Test Workout",
            sport: "running",
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
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(mockKrd);

      // Act
      useWorkoutStore.getState().createStep();
      const state = useWorkoutStore.getState();

      // Assert
      const workout = state.currentWorkout?.extensions?.workout;
      expect(workout?.steps).toHaveLength(2);

      const newStep = workout?.steps[1];
      expect(newStep).toEqual({
        stepIndex: 1,
        durationType: "open",
        duration: { type: "open" },
        targetType: "open",
        target: { type: "open" },
      });
    });

    it("should add step to history", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          workout: {
            sport: "cycling",
            steps: [],
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(mockKrd);

      // Act
      useWorkoutStore.getState().createStep();
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.workoutHistory).toHaveLength(2);
      expect(state.historyIndex).toBe(1);
    });

    it("should assign correct stepIndex when adding to empty workout", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "swimming",
        },
        extensions: {
          workout: {
            sport: "swimming",
            steps: [],
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(mockKrd);

      // Act
      useWorkoutStore.getState().createStep();
      const state = useWorkoutStore.getState();

      // Assert
      const workout = state.currentWorkout?.extensions?.workout;
      expect(workout?.steps).toHaveLength(1);
      expect(workout?.steps[0]).toMatchObject({
        stepIndex: 0,
      });
    });

    it("should do nothing when no workout is loaded", () => {
      // Arrange
      useWorkoutStore.setState({
        currentWorkout: null,
        workoutHistory: [],
        historyIndex: -1,
      });

      // Act
      useWorkoutStore.getState().createStep();
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.currentWorkout).toBeNull();
      expect(state.workoutHistory).toHaveLength(0);
    });

    it("should create step with open duration and open target", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            sport: "running",
            steps: [],
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(mockKrd);

      // Act
      useWorkoutStore.getState().createStep();
      const state = useWorkoutStore.getState();

      // Assert
      const workout = state.currentWorkout?.extensions?.workout;
      const newStep = workout?.steps[0];

      expect(newStep?.durationType).toBe("open");
      expect(newStep?.duration).toEqual({ type: "open" });
      expect(newStep?.targetType).toBe("open");
      expect(newStep?.target).toEqual({ type: "open" });
    });
  });

  describe("deleteStep", () => {
    it("should remove step from workout", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            name: "Test Workout",
            sport: "running",
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
              {
                stepIndex: 1,
                durationType: "distance",
                duration: { type: "distance", meters: 1000 },
                targetType: "heart_rate",
                target: {
                  type: "heart_rate",
                  value: { unit: "bpm", value: 150 },
                },
              },
              {
                stepIndex: 2,
                durationType: "open",
                duration: { type: "open" },
                targetType: "open",
                target: { type: "open" },
              },
            ],
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(mockKrd);

      // Act
      useWorkoutStore.getState().deleteStep(1);
      const state = useWorkoutStore.getState();

      // Assert
      const workout = state.currentWorkout?.extensions?.workout;
      expect(workout?.steps).toHaveLength(2);
      expect(workout?.steps[0].stepIndex).toBe(0);
      expect(workout?.steps[1].stepIndex).toBe(1);
    });

    it("should recalculate stepIndex for all subsequent steps", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          workout: {
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
              },
              {
                stepIndex: 1,
                durationType: "time",
                duration: { type: "time", seconds: 600 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 250 },
                },
              },
              {
                stepIndex: 2,
                durationType: "time",
                duration: { type: "time", seconds: 900 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 300 },
                },
              },
            ],
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(mockKrd);

      // Act - Delete first step
      useWorkoutStore.getState().deleteStep(0);
      const state = useWorkoutStore.getState();

      // Assert
      const workout = state.currentWorkout?.extensions?.workout;
      expect(workout?.steps).toHaveLength(2);
      expect(workout?.steps[0].stepIndex).toBe(0);
      expect(workout?.steps[0].duration).toEqual({
        type: "time",
        seconds: 600,
      });
      expect(workout?.steps[1].stepIndex).toBe(1);
      expect(workout?.steps[1].duration).toEqual({
        type: "time",
        seconds: 900,
      });
    });

    it("should add deletion to history", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "swimming",
        },
        extensions: {
          workout: {
            sport: "swimming",
            steps: [
              {
                stepIndex: 0,
                durationType: "distance",
                duration: { type: "distance", meters: 500 },
                targetType: "open",
                target: { type: "open" },
              },
              {
                stepIndex: 1,
                durationType: "distance",
                duration: { type: "distance", meters: 1000 },
                targetType: "open",
                target: { type: "open" },
              },
            ],
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(mockKrd);

      // Act
      useWorkoutStore.getState().deleteStep(0);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.workoutHistory).toHaveLength(2);
      expect(state.historyIndex).toBe(1);
    });

    it("should do nothing when no workout is loaded", () => {
      // Arrange
      useWorkoutStore.setState({
        currentWorkout: null,
        workoutHistory: [],
        historyIndex: -1,
      });

      // Act
      useWorkoutStore.getState().deleteStep(0);
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.currentWorkout).toBeNull();
      expect(state.workoutHistory).toHaveLength(0);
    });

    it("should handle deleting the only step in workout", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          workout: {
            sport: "running",
            steps: [
              {
                stepIndex: 0,
                durationType: "open",
                duration: { type: "open" },
                targetType: "open",
                target: { type: "open" },
              },
            ],
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(mockKrd);

      // Act
      useWorkoutStore.getState().deleteStep(0);
      const state = useWorkoutStore.getState();

      // Assert
      const workout = state.currentWorkout?.extensions?.workout;
      expect(workout?.steps).toHaveLength(0);
    });

    it("should handle deleting last step in workout", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          workout: {
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
              },
              {
                stepIndex: 1,
                durationType: "time",
                duration: { type: "time", seconds: 600 },
                targetType: "power",
                target: {
                  type: "power",
                  value: { unit: "watts", value: 250 },
                },
              },
            ],
          },
        },
      };

      useWorkoutStore.getState().loadWorkout(mockKrd);

      // Act
      useWorkoutStore.getState().deleteStep(1);
      const state = useWorkoutStore.getState();

      // Assert
      const workout = state.currentWorkout?.extensions?.workout;
      expect(workout?.steps).toHaveLength(1);
      expect(workout?.steps[0].stepIndex).toBe(0);
      expect(workout?.steps[0].duration).toEqual({
        type: "time",
        seconds: 300,
      });
    });
  });

=======
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)
  describe("selector hooks", () => {
    it("should provide access to currentWorkout", () => {
      // Arrange
      const mockKrd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          workout: {
            sport: "cycling",
            steps: [],
          },
        },
      };

      useWorkoutStore.setState({ currentWorkout: mockKrd });

      // Act
      const workout = useWorkoutStore.getState().currentWorkout;

      // Assert
      expect(workout).toEqual(mockKrd);
    });

    it("should provide access to selectedStepId", () => {
      // Arrange
      useWorkoutStore.setState({ selectedStepId: "step-999" });

      // Act
      const stepId = useWorkoutStore.getState().selectedStepId;

      // Assert
      expect(stepId).toBe("step-999");
    });

    it("should provide access to isEditing", () => {
      // Arrange
      useWorkoutStore.setState({ isEditing: true });

      // Act
      const editing = useWorkoutStore.getState().isEditing;

      // Assert
      expect(editing).toBe(true);
    });
  });
});
