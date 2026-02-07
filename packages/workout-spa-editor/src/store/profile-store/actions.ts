/**
 * Profile Store Actions
 *
 * Combines all profile store actions.
 */

import { createActiveProfileActions } from "./actions/active-profile-actions";
import { createCrudActions } from "./actions/crud-actions";
import { createZoneActions } from "./actions/zone-actions";
import type { ProfileStore } from "./types";
import type { StateCreator } from "zustand";

export const createActions: StateCreator<ProfileStore> = (set, get) => ({
  ...createCrudActions(set, get, {} as never),
  ...createZoneActions(set, get, {} as never),
  ...createActiveProfileActions(set, get, {} as never),
});
