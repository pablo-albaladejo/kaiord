/**
 * Dexie Health Cleanup Repository
 *
 * Walks every Dexie v16 health store and deletes rows keyed by the
 * given `profileId`. The list is intentionally local — single source
 * of truth for which tables are health-domain stores. Per-metric
 * typed repositories (with full CRUD) ship in follow-up commits.
 */

import type { HealthCleanupRepository } from "../../ports/health-cleanup-repository";
import type { KaiordDatabase } from "./dexie-database";

const HEALTH_TABLES = [
  "healthSleep",
  "healthWeight",
  "healthHrv",
  "healthDaily",
  "healthBodyComposition",
  "healthStress",
] as const;

export const createDexieHealthCleanupRepository = (
  db: KaiordDatabase
): HealthCleanupRepository => ({
  deleteByProfile: async (profileId: string): Promise<void> => {
    await Promise.all(
      HEALTH_TABLES.map((name) =>
        db.table(name).where("profileId").equals(profileId).delete()
      )
    );
  },
});
