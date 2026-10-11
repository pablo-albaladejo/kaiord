/**
 * ensureDefaultProfile — creates the first-run default profile.
 *
 * When the database holds no profile at all, writes exactly one profile
 * marked `origin: "auto"` and selects it, so every profile-scoped surface
 * works from a clean browser. The count, the put, and the active-id write
 * share one transaction: two tabs booting at once serialize on it and the
 * loser sees `count > 0`. Fail-open: a persistence error leaves the app in
 * its no-profile state instead of breaking boot.
 */

import type { PersistencePort } from "../../ports/persistence-port";
import type { Profile } from "../../types/profile";
import { createNewProfile } from "./helpers/profile-factory";

export const ensureDefaultProfile = async (
  persistence: PersistencePort,
  name: string
): Promise<Profile | null> => {
  try {
    return await persistence.transaction(async () => {
      if ((await persistence.profiles.count()) > 0) return null;
      const profile: Profile = { ...createNewProfile(name), origin: "auto" };
      await persistence.profiles.put(profile);
      await persistence.profiles.setActiveId(profile.id);
      return profile;
    });
  } catch {
    return null;
  }
};
