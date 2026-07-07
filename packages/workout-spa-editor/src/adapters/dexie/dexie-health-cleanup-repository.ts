/**
 * Dexie profile-store cleanup repository.
 *
 * Deletes profile-scoped rows from the stores that have no dedicated
 * per-record repository yet: the six KRD v2.0 health stores, the v17
 * `integrationPolicies` store, and the v27 Data Hub stores
 * (`plannedSessions`, `activities`). Health + policy stores expose a bare
 * `profileId` index and are cleared by an equality scan; the Data Hub
 * stores index by `[profileId+date]`, so they are cleared by a
 * profile-scoped range scan (the coaching-repository strategy). The list
 * is the single source of truth for which tables cascade with a profile.
 */

import type { HealthCleanupRepository } from "../../ports/health-cleanup-repository";
import type { KaiordDatabase } from "./dexie-database";

const PROFILE_ID_TABLES = [
  "healthSleep",
  "healthWeight",
  "healthHrv",
  "healthDaily",
  "healthBodyComposition",
  "healthStress",
  // v17 — integrationPolicies is profile-scoped and cascades with cleanup.
  "integrationPolicies",
] as const;

// v27 Data Hub stores index by [profileId+date] (no bare profileId index).
const PROFILE_DATE_TABLES = ["plannedSessions", "activities"] as const;

export const createDexieHealthCleanupRepository = (
  db: KaiordDatabase
): HealthCleanupRepository => ({
  deleteByProfile: async (profileId: string): Promise<void> => {
    await Promise.all([
      ...PROFILE_ID_TABLES.map((name) =>
        db.table(name).where("profileId").equals(profileId).delete()
      ),
      ...PROFILE_DATE_TABLES.map((name) =>
        db
          .table(name)
          .where("[profileId+date]")
          .between(
            [profileId, "0000-00-00"],
            [profileId, "9999-99-99"],
            true,
            true
          )
          .delete()
      ),
    ]);
  },
});
