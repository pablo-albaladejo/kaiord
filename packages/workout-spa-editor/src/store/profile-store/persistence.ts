/**
 * Profile Store Persistence
 */

import type { Profile } from "../../types/profile";
import { saveProfiles } from "../../utils/profile-storage";

export function persistState(
  profiles: Array<Profile>,
  activeProfileId: string | null
): void {
  const error = saveProfiles(profiles, activeProfileId);
  if (error) {
    console.error("Failed to save profiles:", error.message);
  }
}
