/**
 * updateSportZones — application use case.
 *
 * Replaces the zones array for a (sport, zoneType) pair, leaving the
 * method untouched. No-op if the sport config has no entry for that
 * zoneType (matches legacy semantics). Throws `ProfileNotFoundError`
 * when the id is unknown.
 */

import type { PersistencePort } from "../../../ports/persistence-port";
import type { Profile, SportKey } from "../../../types/profile";
import { ProfileNotFoundError } from "../errors";
import { updateSportConfig } from "../helpers/sport-zone-updater";
import type { ZoneType } from "./zone-types";

export const updateSportZones = async (
  persistence: PersistencePort,
  profileId: string,
  sport: SportKey,
  zoneType: ZoneType,
  zones: Array<unknown>
): Promise<Profile> =>
  persistence.transaction(async () => {
    const existing = await persistence.profiles.getById(profileId);
    if (!existing) throw new ProfileNotFoundError(profileId);

    const updated = updateSportConfig(existing, sport, (cfg) => {
      const zc = cfg[zoneType];
      if (!zc) return cfg;
      return { ...cfg, [zoneType]: { ...zc, zones } };
    });
    await persistence.profiles.put(updated);
    return updated;
  });
