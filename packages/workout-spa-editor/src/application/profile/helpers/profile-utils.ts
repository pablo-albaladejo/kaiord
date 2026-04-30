/**
 * Profile Utils
 *
 * Utility functions for profile operations.
 */

import type { Profile } from "../../../types/profile";

export function getNewActiveProfileId(
  profiles: Profile[],
  deletedProfileId: string,
  currentActiveId: string | null
): string | null {
  if (currentActiveId !== deletedProfileId) {
    return currentActiveId;
  }
  return profiles[0]?.id ?? null;
}
