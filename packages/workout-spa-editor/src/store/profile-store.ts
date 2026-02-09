/**
 * Profile Store
 *
 * Zustand store for managing user profiles with training zones.
 * Automatically persists to localStorage on changes.
 */

import { create } from "zustand";
import { createActions } from "./profile-store/actions";
import { loadInitialState } from "./profile-store/initial-state";
import type { ProfileStore } from "./profile-store/types";

export type { ProfileStore } from "./profile-store/types";

export const useProfileStore = create<ProfileStore>((set, get) => ({
  ...createActions(set, get, {} as never),
  ...loadInitialState(),
}));
