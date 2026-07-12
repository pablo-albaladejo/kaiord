/**
 * Which WHOOP-derived data types are enabled for the current sync, gated by
 * the import policy resolver before any bridge read. Shared between
 * `persistWhoopCycleRecords` (skips un-enabled types) and `syncWhoopCycles`
 * (short-circuits the fetch when every flag is false).
 */
export type WhoopSyncFlags = {
  hrv: boolean;
  sleep: boolean;
  strain: boolean;
  vitals: boolean;
};
