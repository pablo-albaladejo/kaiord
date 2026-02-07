/**
 * Profile Storage Utility
 *
 * Handles persistence of user profiles to localStorage with error handling.
 */

import { z } from "zod";
import { profileSchema } from "../types/profile";
import type { Profile } from "../types/profile";

const STORAGE_KEY = "workout-spa-profiles";
const ACTIVE_PROFILE_KEY = "workout-spa-active-profile";

/**
 * Storage State Schema
 *
 * Validates the complete storage state structure.
 */
const storageStateSchema = z.object({
  profiles: z.array(profileSchema),
  activeProfileId: z.string().uuid().nullable(),
});

export type StorageState = z.infer<typeof storageStateSchema>;

/**
 * Storage Error Types
 */
export type StorageError =
  | { type: "quota_exceeded"; message: string }
  | { type: "parse_error"; message: string }
  | { type: "unknown_error"; message: string };

/**
 * Save profiles to localStorage
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
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    return null;
  } catch (error) {
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
  }
};

/**
 * Load profiles from localStorage
 *
 * @returns Loaded state or error
 */
export const loadProfiles = ():
  | { success: true; data: StorageState }
  | { success: false; error: StorageError } => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);

    if (!serialized) {
      return {
        success: true,
        data: { profiles: [], activeProfileId: null },
      };
    }

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
 * Clear all profiles from localStorage
 */
export const clearProfiles = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVE_PROFILE_KEY);
};
