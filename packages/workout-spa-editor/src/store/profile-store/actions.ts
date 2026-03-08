/**
 * Profile Store Actions
 *
 * Combines all profile store actions.
 */

import { createActiveProfileActions } from "./actions/active-profile-actions";
import { createCrudActions } from "./actions/crud-actions";
import { createCustomZoneActions } from "./actions/custom-zone-actions";
import { createSportZoneActions } from "./actions/sport-zone-actions";
import type { ProfileStore } from "./types";
import type { StateCreator } from "zustand";

export const createActions: StateCreator<ProfileStore> = (set, get) => ({
  ...createCrudActions(set, get, {} as never),
  ...createSportZoneActions(set, get, {} as never),
  ...createCustomZoneActions(set, get, {} as never),
  ...createActiveProfileActions(set, get, {} as never),
});
