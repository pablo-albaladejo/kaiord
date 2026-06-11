/**
 * Storage Utilities
 *
 * LocalStorage utilities for first-time hints.
 */

import { logger } from "../../../../utils/logger";
import { DEFAULT_STORAGE_KEY } from "./constants";

/**
 * Check if user has completed their first workout
 */
export function hasCompletedFirstWorkout(
  storageKey: string = DEFAULT_STORAGE_KEY
): boolean {
  try {
    return localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

/**
 * Save completion state to localStorage
 */
export function saveCompletionState(storageKey: string): void {
  try {
    localStorage.setItem(storageKey, "true");
  } catch (error) {
    logger.error("Failed to save first workout completion state:", { error });
  }
}

/**
 * Reset first workout completion state (for testing)
 */
export function resetFirstWorkoutState(
  storageKey: string = DEFAULT_STORAGE_KEY
): void {
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    logger.error("Failed to reset first workout state:", { error });
  }
}
