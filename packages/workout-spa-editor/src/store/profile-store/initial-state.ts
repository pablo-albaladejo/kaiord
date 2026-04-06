/**
 * Profile Store Initial State
 */

import type { Profile } from "../../types/profile";
import { loadProfiles } from "../../utils/profile-storage";

export function loadInitialState(): {
  profiles: Array<Profile>;
  activeProfileId: string | null;
} {
  const result = loadProfiles();
  if (result.success) {
    return {
      profiles: result.data.profiles,
      activeProfileId: result.data.activeProfileId,
    };
  }
  return {
    profiles: [],
    activeProfileId: null,
  };
}
