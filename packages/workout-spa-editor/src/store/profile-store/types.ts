/**
 * Profile Store Types
 */

import type { HeartRateZone, PowerZone, Profile } from "../../types/profile";
import type { SportKey, SportThresholds } from "../../types/sport-zones";

export type ZoneType = "heartRateZones" | "powerZones" | "paceZones";

export type ProfileStore = {
  profiles: Array<Profile>;
  activeProfileId: string | null;
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
  updateSportThresholds: (
    profileId: string,
    sport: SportKey,
    thresholds: SportThresholds
  ) => void;
  updateSportZones: (
    profileId: string,
    sport: SportKey,
    zoneType: ZoneType,
    zones: Array<unknown>
  ) => void;
  setZoneMethod: (
    profileId: string,
    sport: SportKey,
    zoneType: ZoneType,
    method: string,
    zones: Array<unknown>
  ) => void;
  addCustomZone: (
    profileId: string,
    sport: SportKey,
    zoneType: ZoneType,
    zone: unknown
  ) => void;
  removeCustomZone: (
    profileId: string,
    sport: SportKey,
    zoneType: ZoneType,
    zoneIndex: number
  ) => void;
  getActiveProfile: () => Profile | null;
  getProfile: (profileId: string) => Profile | null;
};
