/**
 * CRUD Actions
 *
 * Create, Read, Update, Delete actions for profiles.
 */

import { createNewProfile } from "../helpers/profile-factory";
import { updateProfileData } from "../helpers/profile-updater";
import { getNewActiveProfileId } from "../helpers/profile-utils";
import { persistState } from "../persistence";
import type { ProfileStore } from "../types";
import type { StateCreator } from "zustand";

type CrudActions = Pick<
  ProfileStore,
  | "profiles"
  | "activeProfileId"
  | "createProfile"
  | "updateProfile"
  | "deleteProfile"
  | "getProfile"
>;

export const createCrudActions: StateCreator<
  ProfileStore,
  [],
  [],
  CrudActions
> = (set, get) => ({
  profiles: [],
  activeProfileId: null,

  createProfile: (name, options = {}) => {
    const newProfile = createNewProfile(name, options);

    set((state) => {
      const newProfiles = [...state.profiles, newProfile];
      const newActiveProfileId = state.activeProfileId ?? newProfile.id;
      persistState(newProfiles, newActiveProfileId);
      return {
        profiles: newProfiles,
        activeProfileId: newActiveProfileId,
      };
    });

    return newProfile;
  },

  updateProfile: (profileId, updates) => {
    set((state) => {
      const profileIndex = state.profiles.findIndex((p) => p.id === profileId);
      if (profileIndex === -1) return state;

      const profile = state.profiles[profileIndex];
      const updatedProfile = updateProfileData(profile, updates);

      const newProfiles = [...state.profiles];
      newProfiles[profileIndex] = updatedProfile;

      persistState(newProfiles, state.activeProfileId);
      return { profiles: newProfiles };
    });
  },

  deleteProfile: (profileId) => {
    set((state) => {
      const newProfiles = state.profiles.filter((p) => p.id !== profileId);
      const newActiveProfileId = getNewActiveProfileId(
        newProfiles,
        profileId,
        state.activeProfileId
      );

      persistState(newProfiles, newActiveProfileId);
      return {
        profiles: newProfiles,
        activeProfileId: newActiveProfileId,
      };
    });
  },

  getProfile: (profileId) => {
    const state = get();
    return state.profiles.find((p) => p.id === profileId) ?? null;
  },
});
