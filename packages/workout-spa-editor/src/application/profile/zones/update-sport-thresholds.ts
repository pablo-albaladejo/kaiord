/**
 * updateSportThresholds — application use case.
 *
 * Updates the per-sport threshold values (LTHR, FTP, threshold pace,
 * pace unit) and recalculates derived zones for any zone-type whose
 * method is non-`custom` (`recalculateZones`). The read-modify-write
 * runs inside `persistence.transaction` so a concurrent writer cannot
 * clobber the merge result. `thresholds` may be a function of the stored
 * ones, so a single-field edit merges into what is stored at write time
 * rather than into what the caller last read. A sport the profile never configured gets
 * its default config first, so the write is never dropped. Throws
 * `ProfileNotFoundError` when the id is unknown.
 */

import type { PersistencePort } from "../../../ports/persistence-port";
import type {
  Profile,
  SportKey,
  SportThresholds,
} from "../../../types/profile";
import { ProfileNotFoundError } from "../errors";
import { defaultSportZoneConfig } from "../helpers/profile-factory";
import {
  recalculateZones,
  updateSportConfig,
} from "../helpers/sport-zone-updater";

export const updateSportThresholds = async (
  persistence: PersistencePort,
  profileId: string,
  sport: SportKey,
  thresholds: SportThresholds | ((current: SportThresholds) => SportThresholds)
): Promise<Profile> =>
  persistence.transaction(async () => {
    const existing = await persistence.profiles.getById(profileId);
    if (!existing) throw new ProfileNotFoundError(profileId);

    const seeded: Profile = existing.sportZones[sport]
      ? existing
      : {
          ...existing,
          sportZones: {
            ...existing.sportZones,
            [sport]: defaultSportZoneConfig(sport),
          },
        };
    const updated = updateSportConfig(seeded, sport, (cfg) =>
      recalculateZones(
        cfg,
        typeof thresholds === "function"
          ? thresholds(cfg.thresholds)
          : thresholds,
        sport
      )
    );
    await persistence.profiles.put(updated);
    return updated;
  });
