/**
 * Workout Store Error Recovery Tests
 *
 * Tests for error recovery functionality in the workout store.
 */

import { beforeEach, describe, expect, it } from "vitest";

import type { KRD } from "../types/krd";
import { useWorkoutStore } from "./workout-store";

describe("Workout Store - Error Recovery", () => {
  beforeEach(() => {
    // Reset store state before each test
    useWorkoutStore.setState({
      currentWorkout: null,
      undoHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      isEditing: false,
      safeMode: false,
      lastBackup: null,
    });
  });

  describe("createBackup", () => {
    it("should create backup of current workout", () => {
      // Arrange
      const mockWorkout: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
            name: "Test Workout",
            sport: "running",
            steps: [],
          },
        },
      };
      useWorkoutStore.setState({ currentWorkout: mockWorkout });
      useWorkoutStore.getState().createBackup();

      // Act
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.lastBackup).toBeDefined();
      expect(state.lastBackup).toEqual(mockWorkout);
    });

    it("should not create backup when no workout exists", () => {
      // Arrange
      useWorkoutStore.getState().createBackup();

      // Act
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.lastBackup).toBeNull();
    });
  });

  describe("restoreFromBackup", () => {
    it("should restore workout from backup", () => {
      // Arrange
      const mockBackup: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
            name: "Backup Workout",
            sport: "running",
            steps: [],
          },
        },
      };
      useWorkoutStore.setState({ lastBackup: mockBackup });
      const success = useWorkoutStore.getState().restoreFromBackup();

      // Act
      const state = useWorkoutStore.getState();

      // Assert
      expect(success).toBe(true);
      expect(state.currentWorkout).toEqual(mockBackup);
      expect(state.undoHistory).toHaveLength(1);
      expect(state.historyIndex).toBe(0);
    });

    it("should return false when no backup exists", () => {
      // Arrange

      // Act
      const success = useWorkoutStore.getState().restoreFromBackup();

      // Assert
      expect(success).toBe(false);
    });

    it("should reset history when restoring from backup", () => {
      // Arrange
      const mockBackup: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
            name: "Backup Workout",
            sport: "running",
            steps: [],
          },
        },
      };
      const mockCurrent: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "cycling",
        },
        extensions: {
          structured_workout: {
            name: "Current Workout",
            sport: "cycling",
            steps: [],
          },
        },
      };
      useWorkoutStore.setState({
        currentWorkout: mockCurrent,
        undoHistory: [{ workout: mockCurrent, selection: null }],
        historyIndex: 0,
        lastBackup: mockBackup,
      });
      useWorkoutStore.getState().restoreFromBackup();

      // Act
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.undoHistory).toHaveLength(1);
      expect(state.undoHistory[0].workout).toEqual(mockBackup);
      expect(state.historyIndex).toBe(0);
    });
  });

  describe("enableSafeMode", () => {
    it("should enable safe mode", () => {
      // Arrange
      useWorkoutStore.getState().enableSafeMode();

      // Act
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.safeMode).toBe(true);
    });
  });

  describe("disableSafeMode", () => {
    it("should disable safe mode", () => {
      // Arrange
      useWorkoutStore.setState({ safeMode: true });
      useWorkoutStore.getState().disableSafeMode();

      // Act
      const state = useWorkoutStore.getState();

      // Assert
      expect(state.safeMode).toBe(false);
    });
  });

  describe("hasBackup", () => {
    it("should return true when backup exists", () => {
      // Arrange
      const mockBackup: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
            name: "Backup Workout",
            sport: "running",
            steps: [],
          },
        },
      };
      useWorkoutStore.setState({ lastBackup: mockBackup });

      // Act
      const hasBackup = useWorkoutStore.getState().hasBackup();

      // Assert
      expect(hasBackup).toBe(true);
    });

    it("should return false when no backup exists", () => {
      // Arrange

      // Act
      const hasBackup = useWorkoutStore.getState().hasBackup();

      // Assert
      expect(hasBackup).toBe(false);
    });
  });

  describe("integration - backup and restore workflow", () => {
    it("should backup, modify, and restore workout", () => {
      // Arrange
      const originalWorkout: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: {
          created: "2025-01-15T10:30:00Z",
          sport: "running",
        },
        extensions: {
          structured_workout: {
            name: "Original Workout",
            sport: "running",
            steps: [],
          },
        },
      };
      const modifiedWorkout: KRD = {
        ...originalWorkout,
        extensions: {
          structured_workout: {
            name: "Modified Workout",
            sport: "running",
            steps: [],
          },
        },
      };
      useWorkoutStore.setState({ currentWorkout: originalWorkout });
      useWorkoutStore.getState().createBackup();
      useWorkoutStore.getState().updateWorkout(modifiedWorkout);
      const modifiedState = useWorkoutStore.getState();
      expect(
        modifiedState.currentWorkout?.extensions?.structured_workout?.name
      ).toBe("Modified Workout");
      useWorkoutStore.getState().restoreFromBackup();

      // Act
      const restoredState = useWorkoutStore.getState();

      // Assert
      expect(
        restoredState.currentWorkout?.extensions?.structured_workout?.name
      ).toBe("Original Workout");
    });
  });
});
