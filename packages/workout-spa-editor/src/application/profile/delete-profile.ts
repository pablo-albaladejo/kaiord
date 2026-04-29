/**
 * deleteProfile — application use case.
 *
 * Removes a profile and clears `meta.activeProfileId` when it
 * matched the deleted id. Both writes happen inside
 * `persistence.transaction` so a partial failure cannot leave an
 * active id pointing at a deleted row.
 *
 * Note: cascading cleanup of profile-scoped coaching data lives in
 * `delete-profile-with-cascade.ts` and runs BEFORE this use case
 * (the deletion order is owned by the calling site to keep the
 * cascade observable to use cases that need to read the to-be-
 * deleted profile by id during the cascade).
 */

import type { PersistencePort } from "../../ports/persistence-port";

export const deleteProfile = async (
  persistence: PersistencePort,
  profileId: string
): Promise<void> => {
  await persistence.transaction(async () => {
    const activeId = await persistence.profiles.getActiveId();
    await persistence.profiles.delete(profileId);
    if (activeId === profileId) {
      await persistence.profiles.setActiveId(null);
    }
  });
};
