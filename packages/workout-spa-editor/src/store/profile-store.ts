/**
 * Profile Store
 *
 * Zustand store for managing user profiles with training zones.
 * Automatically persists to localStorage on changes.
 */

import { create } from "zustand";
import type { HeartRateZone, PowerZone, Profile } from "../types/profile";
import {
  calculateHeartRateZones,
  DEFAULT_HEART_RATE_ZONES,
  DEFAULT_POWER_ZONES,
} from "../types/profile";
import { loadProfiles, saveProfiles } from "../utils/profile-storage";

export type ProfileStore = {
  // State
  profiles: Array<Profile>;
  activeProfileId: string | null;

  // Actions
  createProfile: (
    name: string,
    options?: {
      bodyWeight?: number;
      ftp?: number;
      maxHeartRate?: number;
    }
  ) => Profile;
  updateProfile: (
    profileId: string,
    updates: Partial<
      Pick<Profile, "name" | "bodyWeight" | "ftp" | "maxHeartRate">
    >
  ) => void;
  deleteProfile: (profileId: string) => void;
  setActiveProfile: (profileId: string | null) => void;
  updatePowerZones: (profileId: string, zones: Array<PowerZone>) => void;
  updateHeartRateZones: (
    profileId: string,
    zones: Array<HeartRateZone>
  ) => void;
  getActiveProfile: () => Profile | null;
  getProfile: (profileId: string) => Profile | null;
};

// Load initial state from localStorage
const loadInitialState = (): Pick<
  ProfileStore,
  "profiles" | "activeProfileId"
> => {
  const result = loadProfiles();
  if (result.success) {
    return {
      profiles: result.data.profiles,
      activeProfileId: result.data.activeProfileId,
    };
  }
  return {
    profiles: [],
    activeProfileId: null,
  };
};

// Helper to persist state to localStorage
const persistState = (
  profiles: Array<Profile>,
  activeProfileId: string | null
): void => {
  const error = saveProfiles(profiles, activeProfileId);
  if (error) {
    console.error("Failed to save profiles:", error.message);
  }
};

export const useProfileStore = create<ProfileStore>((set, get) => ({
  // Initial state loaded from localStorage
  ...loadInitialState(),

  // Create a new profile
  createProfile: (name, options = {}) => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const heartRateZones = options.maxHeartRate
      ? calculateHeartRateZones(options.maxHeartRate)
      : DEFAULT_HEART_RATE_ZONES;

    const newProfile: Profile = {
      id,
      name,
      bodyWeight: options.bodyWeight,
      ftp: options.ftp,
      maxHeartRate: options.maxHeartRate,
      powerZones: DEFAULT_POWER_ZONES,
      heartRateZones,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const newProfiles = [...state.profiles, newProfile];
      const newActiveProfileId = state.activeProfileId ?? id;
      persistState(newProfiles, newActiveProfileId);
      return {
        profiles: newProfiles,
        activeProfileId: newActiveProfileId,
      };
    });

    return newProfile;
  },

  // Update profile data
  updateProfile: (profileId, updates) => {
    set((state) => {
      const profileIndex = state.profiles.findIndex((p) => p.id === profileId);
      if (profileIndex === -1) return state;

      const profile = state.profiles[profileIndex];
      const now = new Date().toISOString();

      const updatedProfile: Profile = {
        ...profile,
        ...updates,
        updatedAt: now,
      };

      // Recalculate heart rate zones if max HR changed
      if (
        updates.maxHeartRate !== undefined &&
        updates.maxHeartRate !== profile.maxHeartRate
      ) {
        updatedProfile.heartRateZones = calculateHeartRateZones(
          updates.maxHeartRate
        );
      }

      const newProfiles = [...state.profiles];
      newProfiles[profileIndex] = updatedProfile;

      persistState(newProfiles, state.activeProfileId);
      return { profiles: newProfiles };
    });
  },

  // Delete a profile
  deleteProfile: (profileId) => {
    set((state) => {
      const newProfiles = state.profiles.filter((p) => p.id !== profileId);
      const newActiveProfileId =
        state.activeProfileId === profileId
          ? (newProfiles[0]?.id ?? null)
          : state.activeProfileId;

      persistState(newProfiles, newActiveProfileId);
      return {
        profiles: newProfiles,
        activeProfileId: newActiveProfileId,
      };
    });
  },

  // Set the active profile
  setActiveProfile: (profileId) => {
    set((state) => {
      persistState(state.profiles, profileId);
      return { activeProfileId: profileId };
    });
  },

  // Update power zones for a profile
  updatePowerZones: (profileId, zones) => {
    set((state) => {
      const profileIndex = state.profiles.findIndex((p) => p.id === profileId);
      if (profileIndex === -1) return state;

      const profile = state.profiles[profileIndex];
      const now = new Date().toISOString();

      const updatedProfile: Profile = {
        ...profile,
        powerZones: zones,
        updatedAt: now,
      };

      const newProfiles = [...state.profiles];
      newProfiles[profileIndex] = updatedProfile;

      persistState(newProfiles, state.activeProfileId);
      return { profiles: newProfiles };
    });
  },

  // Update heart rate zones for a profile
  updateHeartRateZones: (profileId, zones) => {
    set((state) => {
      const profileIndex = state.profiles.findIndex((p) => p.id === profileId);
      if (profileIndex === -1) return state;

      const profile = state.profiles[profileIndex];
      const now = new Date().toISOString();

      const updatedProfile: Profile = {
        ...profile,
        heartRateZones: zones,
        updatedAt: now,
      };

      const newProfiles = [...state.profiles];
      newProfiles[profileIndex] = updatedProfile;

      persistState(newProfiles, state.activeProfileId);
      return { profiles: newProfiles };
    });
  },

  // Get the active profile
  getActiveProfile: () => {
    const state = get();
    if (!state.activeProfileId) return null;
    return state.profiles.find((p) => p.id === state.activeProfileId) ?? null;
  },

  // Get a profile by ID
  getProfile: (profileId) => {
    const state = get();
    return state.profiles.find((p) => p.id === profileId) ?? null;
  },
}));
