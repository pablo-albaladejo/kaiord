/**
 * HealthCleanupRepository
 *
 * Cross-table cleanup port for the six KRD v2.0 health-domain stores
 * introduced in Dexie v16 (`healthSleep`, `healthWeight`, `healthHrv`,
 * `healthDaily`, `healthBodyComposition`, `healthStress`).
 *
 * The per-metric CRUD repositories live in `health-repositories.ts`.
 * This port covers ONLY the delete-by-profile cascade the
 * `deleteProfile` orchestration runs when a profile is removed.
 */
export type HealthCleanupRepository = {
  /**
   * Deletes every row keyed by `profileId` across all six health
   * stores. Idempotent — calling twice with the same id is a no-op on
   * the second call.
   */
  deleteByProfile: (profileId: string) => Promise<void>;
};
