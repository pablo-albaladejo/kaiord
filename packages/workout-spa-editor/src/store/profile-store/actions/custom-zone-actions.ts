/**
 * Custom Zone Actions
 *
 * Actions for adding/removing custom zones.
 */

import type { StateCreator } from "zustand";

import { updateSportConfig } from "../helpers/sport-zone-updater";
import { persistState } from "../persistence";
import type { ProfileStore } from "../types";

type CustomZoneActions = Pick<
  ProfileStore,
  "addCustomZone" | "removeCustomZone"
>;

function applyUpdate(state: ProfileStore, profiles: typeof state.profiles) {
  persistState(profiles, state.activeProfileId);
  return { profiles };
}

export const createCustomZoneActions: StateCreator<
  ProfileStore,
  [],
  [],
  CustomZoneActions
> = (set) => ({
  addCustomZone: (profileId, sport, zoneType, zone) => {
    set((state) => {
      const idx = state.profiles.findIndex((p) => p.id === profileId);
      if (idx === -1) return state;
      const updated = updateSportConfig(state.profiles[idx], sport, (cfg) => {
        const zc = cfg[zoneType];
        if (!zc || zc.zones.length >= 10) return cfg;
        return { ...cfg, [zoneType]: { ...zc, zones: [...zc.zones, zone] } };
      });
      const profiles = [...state.profiles];
      profiles[idx] = updated;
      return applyUpdate(state, profiles);
    });
  },

  removeCustomZone: (profileId, sport, zoneType, zoneIndex) => {
    set((state) => {
      const idx = state.profiles.findIndex((p) => p.id === profileId);
      if (idx === -1) return state;
      const updated = updateSportConfig(state.profiles[idx], sport, (cfg) => {
        const zc = cfg[zoneType];
        if (!zc || zc.zones.length <= 1) return cfg;
        const zones = zc.zones.filter((_, i) => i !== zoneIndex);
        return { ...cfg, [zoneType]: { ...zc, zones } };
      });
      const profiles = [...state.profiles];
      profiles[idx] = updated;
      return applyUpdate(state, profiles);
    });
  },
});
