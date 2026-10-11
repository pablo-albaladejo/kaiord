/**
 * claimAutoProfiles — turns every unclaimed default profile into a real one.
 *
 * Called before anything leaves the device outside the sync pipeline (the
 * backup export), so an `origin: "auto"` profile is never serialized. The
 * cloud sync claims through `reconcileAutoProfile` instead.
 */

import type { PersistencePort } from "../../ports/persistence-port";
import { claimProfile, isAutoProfile } from "./helpers/claim-profile";

export const claimAutoProfiles = async (
  persistence: PersistencePort,
  now: () => Date = () => new Date()
): Promise<number> =>
  persistence.transaction(async () => {
    const autos = (await persistence.profiles.getAll()).filter(isAutoProfile);
    for (const profile of autos) {
      const updatedAt = now().toISOString();
      await persistence.profiles.put({ ...claimProfile(profile), updatedAt });
    }
    return autos.length;
  });
