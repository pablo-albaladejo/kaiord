/**
 * Active Profile Actions
 *
 * Actions for managing the active profile.
 */

import { persistState } from "../persistence";
import type { ProfileStore } from "../types";
import type { StateCreator } from "zustand";

type ActiveProfileActions = Pick<
  ProfileStore,
  "setActiveProfile" | "getActiveProfile"
>;

export const createActiveProfileActions: StateCreator<
  ProfileStore,
  [],
  [],
  ActiveProfileActions
> = (set, get) => ({
  setActiveProfile: (profileId) => {
    set((state) => {
      persistState(state.profiles, profileId);
      return { activeProfileId: profileId };
    });
  },

  getActiveProfile: () => {
    const state = get();
    if (!state.activeProfileId) return null;
    return state.profiles.find((p) => p.id === state.activeProfileId) ?? null;
  },
});
