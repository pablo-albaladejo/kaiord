/**
 * HealthCleanupRepository
 *
 * Cross-table cleanup port for the six KRD v2.0 health-domain stores
 * introduced in Dexie v16 (`healthSleep`, `healthWeight`, `healthHrv`,
 * `healthDaily`, `healthBodyComposition`, `healthStress`).
 *
 * The full per-metric repositories (one per store) ship in later
 * commits with the typed CRUD surface. This port covers ONLY the
 * delete-by-profile cascade so the `deleteProfile` orchestration can
 * already clean every health table when a profile is removed.
 */
export type HealthCleanupRepository = {
  /**
   * Deletes every row keyed by `profileId` across all six health
   * stores. Idempotent — calling twice with the same id is a no-op on
   * the second call.
   */
  deleteByProfile: (profileId: string) => Promise<void>;
};
