/**
 * addCustomZone — application use case.
 *
 * Appends a custom zone to the (sport, zoneType) zones array.
 * Bounded at 10 zones to match the legacy ceiling. No-op when the
 * zoneType is missing or the limit is reached (matches legacy
 * semantics — the UI disables "Add zone" before reaching this path).
 * Throws `ProfileNotFoundError` when the id is unknown.
 */

import type { PersistencePort } from "../../../ports/persistence-port";
import type { Profile, SportKey } from "../../../types/profile";
import { ProfileNotFoundError } from "../errors";
import { updateSportConfig } from "../helpers/sport-zone-updater";
import type { ZoneType } from "./zone-types";

const MAX_ZONES = 10;

export const addCustomZone = async (
  persistence: PersistencePort,
  profileId: string,
  sport: SportKey,
  zoneType: ZoneType,
  zone: unknown
): Promise<Profile> =>
  persistence.transaction(async () => {
    const existing = await persistence.profiles.getById(profileId);
    if (!existing) throw new ProfileNotFoundError(profileId);

    const updated = updateSportConfig(existing, sport, (cfg) => {
      const zc = cfg[zoneType];
      if (!zc || zc.zones.length >= MAX_ZONES) return cfg;
      return { ...cfg, [zoneType]: { ...zc, zones: [...zc.zones, zone] } };
    });
    await persistence.profiles.put(updated);
    return updated;
  });
