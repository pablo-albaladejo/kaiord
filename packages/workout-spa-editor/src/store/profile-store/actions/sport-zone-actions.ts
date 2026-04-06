/**
 * Sport Zone Actions
 *
 * Actions for sport-specific zone management.
 */

import type { StateCreator } from "zustand";

import {
  recalculateZones,
  updateSportConfig,
} from "../helpers/sport-zone-updater";
import { persistState } from "../persistence";
import type { ProfileStore } from "../types";

type SportZoneActions = Pick<
  ProfileStore,
  "updateSportThresholds" | "updateSportZones" | "setZoneMethod"
>;

function applyUpdate(state: ProfileStore, profiles: typeof state.profiles) {
  persistState(profiles, state.activeProfileId);
  return { profiles };
}

export const createSportZoneActions: StateCreator<
  ProfileStore,
  [],
  [],
  SportZoneActions
> = (set) => ({
  updateSportThresholds: (profileId, sport, thresholds) => {
    set((state) => {
      const idx = state.profiles.findIndex((p) => p.id === profileId);
      if (idx === -1) return state;
      const updated = updateSportConfig(state.profiles[idx], sport, (cfg) =>
        recalculateZones(cfg, thresholds, sport)
      );
      const profiles = [...state.profiles];
      profiles[idx] = updated;
      return applyUpdate(state, profiles);
    });
  },

  updateSportZones: (profileId, sport, zoneType, zones) => {
    set((state) => {
      const idx = state.profiles.findIndex((p) => p.id === profileId);
      if (idx === -1) return state;
      const updated = updateSportConfig(state.profiles[idx], sport, (cfg) => {
        const zc = cfg[zoneType];
        if (!zc) return cfg;
        return { ...cfg, [zoneType]: { ...zc, zones } };
      });
      const profiles = [...state.profiles];
      profiles[idx] = updated;
      return applyUpdate(state, profiles);
    });
  },

  setZoneMethod: (profileId, sport, zoneType, method, zones) => {
    set((state) => {
      const idx = state.profiles.findIndex((p) => p.id === profileId);
      if (idx === -1) return state;
      const updated = updateSportConfig(state.profiles[idx], sport, (cfg) => {
        const existing = cfg[zoneType];
        return { ...cfg, [zoneType]: { ...existing, method, zones } };
      });
      const profiles = [...state.profiles];
      profiles[idx] = updated;
      return applyUpdate(state, profiles);
    });
  },
});
