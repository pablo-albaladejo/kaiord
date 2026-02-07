/**
 * Library Storage Utility
 *
 * Handles persistence of workout library to localStorage with error handling.
 */

import { workoutLibraryStateSchema } from "../types/workout-library";
import type {
  WorkoutLibraryState,
  WorkoutTemplate,
} from "../types/workout-library";

const STORAGE_KEY = "workout-spa-library";

/**
 * Storage Error Types
 */
export type StorageError =
  | { type: "quota_exceeded"; message: string }
  | { type: "parse_error"; message: string }
  | { type: "unknown_error"; message: string };

/**
 * Save library to localStorage
 *
 * @param templates - Array of workout templates to save
 * @returns Error if save failed, null if successful
 */
export const saveLibrary = (
  templates: Array<WorkoutTemplate>
): StorageError | null => {
  try {
    const state: WorkoutLibraryState = { templates };
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    return null;
  } catch (error) {
    if (error instanceof Error && error.name === "QuotaExceededError") {
      return {
        type: "quota_exceeded",
        message: "Storage quota exceeded. Unable to save library.",
      };
    }
    return {
      type: "unknown_error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Load library from localStorage
 *
 * @returns Loaded state or error
 */
export const loadLibrary = ():
  | { success: true; data: WorkoutLibraryState }
  | { success: false; error: StorageError } => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);

    if (!serialized) {
      return {
        success: true,
        data: { templates: [] },
      };
    }

    const parsed = JSON.parse(serialized);
    const result = workoutLibraryStateSchema.safeParse(parsed);

    if (!result.success) {
      return {
        success: false,
        error: {
          type: "parse_error",
          message: "Invalid library data in storage",
        },
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: {
        type: "parse_error",
        message: error instanceof Error ? error.message : "Parse error",
      },
    };
  }
};

/**
 * Clear library from localStorage
 */
export const clearLibrary = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
