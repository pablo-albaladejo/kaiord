/**
 * Profile Store Persistence
 *
 * Persists profiles to IndexedDB via Dexie.
 */

import { db } from "../../adapters/dexie/dexie-database";
import type { Profile } from "../../types/profile";

const ACTIVE_PROFILE_KEY = "activeProfileId";

const profileTable = () => db.table<Profile>("profiles");
const metaTable = () => db.table("meta");

export function persistState(
  profiles: Array<Profile>,
  activeProfileId: string | null
): void {
  Promise.all([
    profileTable()
      .toArray()
      .then((existing) => {
        const currentIds = new Set(profiles.map((p) => p.id));
        const toDelete = existing.filter((p) => !currentIds.has(p.id));
        return Promise.all([
          ...toDelete.map((p) => profileTable().delete(p.id)),
          profileTable().bulkPut(profiles),
        ]);
      }),
    metaTable().put({ key: ACTIVE_PROFILE_KEY, value: activeProfileId }),
  ]).catch((error: unknown) => {
    console.error(
      "Failed to save profiles:",
      error instanceof Error ? error.message : "Unknown error"
    );
  });
}
