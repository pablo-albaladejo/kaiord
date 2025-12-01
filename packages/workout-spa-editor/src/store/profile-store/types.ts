/**
 * Profile Store Types
 */

import type { HeartRateZone, PowerZone, Profile } from "../../types/profile";

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
  getActiveProfile: () => Profile | null;
  getProfile: (profileId: string) => Profile | null;
};
