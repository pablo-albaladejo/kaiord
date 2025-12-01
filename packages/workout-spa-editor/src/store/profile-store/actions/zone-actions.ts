/**
 * Zone Actions
 *
 * Actions for updating power and heart rate zones.
 */

import type { StateCreator } from "zustand";
import { updateProfileZones } from "../helpers/profile-updater";
import { persistState } from "../persistence";
import type { ProfileStore } from "../types";

export const createZoneActions: StateCreator<ProfileStore> = (set) => ({
  updatePowerZones: (profileId, zones) => {
    set((state) => {
      const profileIndex = state.profiles.findIndex((p) => p.id === profileId);
      if (profileIndex === -1) return state;

      const profile = state.profiles[profileIndex];
      const updatedProfile = updateProfileZones(profile, zones, "power");

      const newProfiles = [...state.profiles];
      newProfiles[profileIndex] = updatedProfile;

      persistState(newProfiles, state.activeProfileId);
      return { profiles: newProfiles };
    });
  },

  updateHeartRateZones: (profileId, zones) => {
    set((state) => {
      const profileIndex = state.profiles.findIndex((p) => p.id === profileId);
      if (profileIndex === -1) return state;

      const profile = state.profiles[profileIndex];
      const updatedProfile = updateProfileZones(profile, zones, "heartRate");

      const newProfiles = [...state.profiles];
      newProfiles[profileIndex] = updatedProfile;

      persistState(newProfiles, state.activeProfileId);
      return { profiles: newProfiles };
    });
  },
});
