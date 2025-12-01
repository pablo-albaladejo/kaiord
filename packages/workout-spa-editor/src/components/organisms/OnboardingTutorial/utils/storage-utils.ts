/**
 * Storage utilities for onboarding state
 */

const DEFAULT_STORAGE_KEY = "workout-spa-onboarding-completed";

export function hasCompletedOnboarding(
  storageKey: string = DEFAULT_STORAGE_KEY
): boolean {
  try {
    return localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

export function resetOnboarding(
  storageKey: string = DEFAULT_STORAGE_KEY
): void {
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Failed to reset onboarding state:", error);
  }
}

export { DEFAULT_STORAGE_KEY };
