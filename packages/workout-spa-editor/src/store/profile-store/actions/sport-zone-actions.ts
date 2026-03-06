/**
 * Sport Zone Actions
 *
 * Actions for sport-specific zone management.
 */

import {
  recalculateZones,
  updateSportConfig,
} from "../helpers/sport-zone-updater";
import { persistState } from "../persistence";
import type { ProfileStore, ZoneType } from "../types";
import type { StateCreator } from "zustand";

type SportZoneActions = Pick<
  ProfileStore,
  "updateSportThresholds" | "updateSportZones" | "toggleZoneMode"
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

  toggleZoneMode: (profileId, sport, zoneType, mode) => {
    set((state) => {
      const idx = state.profiles.findIndex((p) => p.id === profileId);
      if (idx === -1) return state;
      const updated = updateSportConfig(state.profiles[idx], sport, (cfg) => {
        const existing = cfg[zoneType as ZoneType];
        const zc = existing ?? { mode: "manual", zones: [] };
        const newCfg = { ...cfg, [zoneType]: { ...zc, mode } };
        return mode === "auto"
          ? recalculateZones(newCfg, cfg.thresholds, sport)
          : newCfg;
      });
      const profiles = [...state.profiles];
      profiles[idx] = updated;
      return applyUpdate(state, profiles);
    });
  },
});
