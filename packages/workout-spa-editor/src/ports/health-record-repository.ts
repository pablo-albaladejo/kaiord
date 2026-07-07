/**
 * Health-Record Repository
 *
 * Shared CRUD contract for the six KRD v2.0 health-domain stores
 * (sleep, weight, hrv, daily, body composition, stress). Every health
 * record carries the same persistence shape: a nanoid `id`, a
 * `profileId` cascading reference, an ISO `date` (YYYY-MM-DD) for the
 * indexed date-range query, and the typed KRD payload `krd`.
 *
 * Per-metric repositories are thin type aliases over the generic shape
 * (see `health-repositories.ts` for the named aliases used in
 * `PersistencePort`). The Dexie + in-memory factories live in
 * `dexie-health-record-repository.ts` /
 * `in-memory-health-record-repository.ts`.
 */
export type HealthRecord<TPayload> = {
  id: string;
  profileId: string;
  date: string;
  krd: TPayload;
  /**
   * Provenance stamp (v17 schema columns) — set on every write via
   * `stampProvenance`, regardless of entry path (FIT import, manual
   * entry). Optional only because legacy pre-v17 rows may lack them
   * until backfilled.
   */
  sourceBridgeId?: string;
  externalId?: string;
  /** Precise measurement instant backing `externalId`'s content-hash; `date` is just the day-bucket for the range-query index. */
  measuredAt?: string;
};

export type HealthRecordRepository<T extends HealthRecord<unknown>> = {
  getById: (id: string) => Promise<T | undefined>;
  getByProfileAndDateRange: (
    profileId: string,
    startInclusive: string,
    endInclusive: string
  ) => Promise<T[]>;
  put: (record: T) => Promise<void>;
  upsertMany: (records: readonly T[]) => Promise<void>;
  delete: (id: string) => Promise<void>;
  deleteByProfile: (profileId: string) => Promise<void>;
};
