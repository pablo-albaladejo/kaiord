/**
 * updateSportThresholds — application use case.
 *
 * Updates the per-sport threshold values (LTHR, FTP, threshold pace,
 * pace unit) and recalculates derived zones for any zone-type whose
 * method is non-`custom` (`recalculateZones`). The read-modify-write
 * runs inside `persistence.transaction` so a concurrent writer cannot
 * clobber the merge result. Throws `ProfileNotFoundError` when the id
 * is unknown.
 */

import type { PersistencePort } from "../../../ports/persistence-port";
import type {
  Profile,
  SportKey,
  SportThresholds,
} from "../../../types/profile";
import { ProfileNotFoundError } from "../errors";
import {
  recalculateZones,
  updateSportConfig,
} from "../helpers/sport-zone-updater";

export const updateSportThresholds = async (
  persistence: PersistencePort,
  profileId: string,
  sport: SportKey,
  thresholds: SportThresholds
): Promise<Profile> =>
  persistence.transaction(async () => {
    const existing = await persistence.profiles.getById(profileId);
    if (!existing) throw new ProfileNotFoundError(profileId);

    const updated = updateSportConfig(existing, sport, (cfg) =>
      recalculateZones(cfg, thresholds, sport)
    );
    await persistence.profiles.put(updated);
    return updated;
  });
