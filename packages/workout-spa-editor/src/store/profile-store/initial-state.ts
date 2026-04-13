/**
 * Profile Store Initial State
 *
 * Starts with empty profiles (Dexie hydrates async).
 */

import type { Profile } from "../../types/profile";

export function loadInitialState(): {
  profiles: Array<Profile>;
  activeProfileId: string | null;
} {
  return {
    profiles: [],
    activeProfileId: null,
  };
}
