/**
 * setZoneMethod — application use case.
 *
 * Sets the calculation method AND zones for a (sport, zoneType) pair.
 * Used when the user toggles between methods (e.g., Coggan-7 vs custom);
 * the caller pre-computes the zones for the new method. No-op when the
 * sport's `cfg[zoneType]` is missing — matches the legacy semantic of
 * `updateSportZones`/`addCustomZone` so swapping a method on a sport
 * that doesn't have that zoneType (e.g., paceZones on cycling) cannot
 * implicitly create a zone container. Wrapped in
 * `persistence.transaction` for read-modify-write atomicity. Throws
 * `ProfileNotFoundError` when the id is unknown.
 */

import type { PersistencePort } from "../../../ports/persistence-port";
import type { Profile, SportKey } from "../../../types/profile";
import { ProfileNotFoundError } from "../errors";
import { updateSportConfig } from "../helpers/sport-zone-updater";
import type { ZoneType } from "./zone-types";

export const setZoneMethod = async (
  persistence: PersistencePort,
  profileId: string,
  sport: SportKey,
  zoneType: ZoneType,
  method: string,
  zones: Array<unknown>
): Promise<Profile> =>
  persistence.transaction(async () => {
    const existing = await persistence.profiles.getById(profileId);
    if (!existing) throw new ProfileNotFoundError(profileId);

    const updated = updateSportConfig(existing, sport, (cfg) => {
      const previous = cfg[zoneType];
      if (!previous) return cfg;
      return { ...cfg, [zoneType]: { ...previous, method, zones } };
    });
    await persistence.profiles.put(updated);
    return updated;
  });
