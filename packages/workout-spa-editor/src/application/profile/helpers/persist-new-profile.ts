/**
 * persistNewProfile — shared transactional write for use cases that add a
 * profile (create, import). The count check, the put and the conditional
 * `setActiveId` run in one transaction so a concurrent caller cannot read a
 * stale `count === 0` and overwrite the other call's active id (TOCTOU).
 */

import type { PersistencePort } from "../../../ports/persistence-port";
import type { Profile } from "../../../types/profile";

export const persistNewProfile = async (
  persistence: PersistencePort,
  profile: Profile
): Promise<void> => {
  await persistence.transaction(async () => {
    const isFirstProfile = (await persistence.profiles.count()) === 0;
    await persistence.profiles.put(profile);
    if (isFirstProfile) {
      await persistence.profiles.setActiveId(profile.id);
    }
  });
};
