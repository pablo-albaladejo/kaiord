/**
 * Profile Storage Utility
 *
 * Handles persistence of user profiles to localStorage with error handling.
 */

import type { Profile } from "../types/profile";
import {
  ACTIVE_PROFILE_KEY,
  STORAGE_KEY,
  type StorageError,
  type StorageState,
  storageStateSchema,
} from "./profile-storage.types";

export type { StorageError, StorageState } from "./profile-storage.types";

const toSaveError = (error: unknown): StorageError => {
  if (error instanceof Error && error.name === "QuotaExceededError") {
    return {
      type: "quota_exceeded",
      message: "Storage quota exceeded. Unable to save profiles.",
    };
  }
  return {
    type: "unknown_error",
    message: error instanceof Error ? error.message : "Unknown error",
  };
};

/**
 * Save profiles to localStorage.
 *
 * @param profiles - Array of profiles to save
 * @param activeProfileId - ID of the active profile
 * @returns Error if save failed, null if successful
 */
export const saveProfiles = (
  profiles: Array<Profile>,
  activeProfileId: string | null
): StorageError | null => {
  try {
    const state: StorageState = { profiles, activeProfileId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return null;
  } catch (error) {
    return toSaveError(error);
  }
};

const parseLoadedState = (
  serialized: string
):
  | { success: true; data: StorageState }
  | { success: false; error: StorageError } => {
  const parsed = JSON.parse(serialized);
  const result = storageStateSchema.safeParse(parsed);
  if (!result.success) {
    return {
      success: false,
      error: {
        type: "parse_error",
        message: "Invalid profile data in storage",
      },
    };
  }
  return { success: true, data: result.data };
};

/**
 * Load profiles from localStorage.
 *
 * @returns Loaded state or error
 */
export const loadProfiles = ():
  | { success: true; data: StorageState }
  | { success: false; error: StorageError } => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return { success: true, data: { profiles: [], activeProfileId: null } };
    }
    return parseLoadedState(serialized);
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

/** Clear all profiles from localStorage. */
export const clearProfiles = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVE_PROFILE_KEY);
};
