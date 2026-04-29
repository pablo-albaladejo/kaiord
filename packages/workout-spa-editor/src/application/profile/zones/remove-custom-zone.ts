/**
 * removeCustomZone — application use case.
 *
 * Removes the zone at the given index from the (sport, zoneType)
 * zones array. No-op when the zoneType is missing or the array has
 * one or fewer entries (matches legacy semantics — the last zone is
 * not removable through this path). Throws `ProfileNotFoundError`
 * when the id is unknown.
 */

import type { PersistencePort } from "../../../ports/persistence-port";
import type { Profile, SportKey } from "../../../types/profile";
import { ProfileNotFoundError } from "../errors";
import { updateSportConfig } from "../helpers/sport-zone-updater";
import type { ZoneType } from "./zone-types";

export const removeCustomZone = async (
  persistence: PersistencePort,
  profileId: string,
  sport: SportKey,
  zoneType: ZoneType,
  zoneIndex: number
): Promise<Profile> => {
  const existing = await persistence.profiles.getById(profileId);
  if (!existing) throw new ProfileNotFoundError(profileId);

  const updated = updateSportConfig(existing, sport, (cfg) => {
    const zc = cfg[zoneType];
    if (!zc || zc.zones.length <= 1) return cfg;
    const zones = zc.zones.filter((_, i) => i !== zoneIndex);
    return { ...cfg, [zoneType]: { ...zc, zones } };
  });
  await persistence.profiles.put(updated);
  return updated;
};
