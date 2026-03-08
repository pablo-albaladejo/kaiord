/**
 * Profile Store Initial State
 */

import { loadProfiles } from "../../utils/profile-storage";
import type { Profile } from "../../types/profile";

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
