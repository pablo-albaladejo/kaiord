/**
 * Error Recovery Actions Tests
 *
 * Tests for error recovery action creators.
 */

import { describe, expect, it } from "vitest";
import type { KRD } from "../../types/krd";
import type { WorkoutStore } from "../workout-store-types";
import {
  createBackupAction,
  disableSafeModeAction,
  enableSafeModeAction,
  restoreFromBackupAction,
} from "./error-recovery-actions";

describe("createBackupAction", () => {
  it("should create backup of current workout", () => {
    // Arrange
    const mockWorkout: KRD = {
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

    const state: WorkoutStore = {
      currentWorkout: mockWorkout,
      workoutHistory: [mockWorkout],
      historyIndex: 0,
      selectedStepId: null,
      isEditing: false,
      safeMode: false,
      lastBackup: null,
    } as WorkoutStore;

    // Act
    const result = createBackupAction(state);

    // Assert
    expect(result.lastBackup).toBeDefined();
    expect(result.lastBackup).toEqual(mockWorkout);
    expect(result.lastBackup).not.toBe(mockWorkout); // Should be a clone
  });

  it("should return empty object when no current workout", () => {
    // Arrange
    const state: WorkoutStore = {
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      isEditing: false,
      safeMode: false,
      lastBackup: null,
    } as WorkoutStore;

    // Act
    const result = createBackupAction(state);

    // Assert
    expect(result).toEqual({});
  });
});

describe("restoreFromBackupAction", () => {
  it("should restore workout from backup", () => {
    // Arrange
    const mockBackup: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
          name: "Backup Workout",
          sport: "running",
          steps: [],
        },
      },
    };

    const state: WorkoutStore = {
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      isEditing: false,
      safeMode: false,
      lastBackup: mockBackup,
    } as WorkoutStore;

    // Act
    const result = restoreFromBackupAction(state);

    // Assert
    expect(result.success).toBe(true);
    expect(result.currentWorkout).toEqual(mockBackup);
    expect(result.currentWorkout).not.toBe(mockBackup); // Should be a clone
    expect(result.workoutHistory).toEqual([mockBackup]);
    expect(result.historyIndex).toBe(0);
  });

  it("should return failure when no backup exists", () => {
    // Arrange
    const state: WorkoutStore = {
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      isEditing: false,
      safeMode: false,
      lastBackup: null,
    } as WorkoutStore;

    // Act
    const result = restoreFromBackupAction(state);

    // Assert
    expect(result.success).toBe(false);
    expect(result.currentWorkout).toBeUndefined();
  });
});

describe("enableSafeModeAction", () => {
  it("should enable safe mode", () => {
    // Act
    const result = enableSafeModeAction();

    // Assert
    expect(result.safeMode).toBe(true);
  });
});

describe("disableSafeModeAction", () => {
  it("should disable safe mode", () => {
    // Act
    const result = disableSafeModeAction();

    // Assert
    expect(result.safeMode).toBe(false);
  });
});
