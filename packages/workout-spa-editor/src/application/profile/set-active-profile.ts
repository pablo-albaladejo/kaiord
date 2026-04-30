/**
 * setActiveProfile — application use case.
 *
 * Single-write update of `meta.activeProfileId`; no transaction
 * needed. Component callers `await` this and surface failures via
 * the toast context.
 */

import type { PersistencePort } from "../../ports/persistence-port";

export const setActiveProfile = async (
  persistence: PersistencePort,
  profileId: string | null
): Promise<void> => {
  await persistence.profiles.setActiveId(profileId);
};
