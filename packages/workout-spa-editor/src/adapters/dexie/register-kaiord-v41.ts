import type Dexie from "dexie";

/** Only the new store; Dexie keeps every other store as v40 declared it. */
export const V41_STORES = { athleteNotes: "id, profileId" };

// v41 — Athlete notes, one row per Coaching Activity (`types/athlete-note`).
// Additive and schema-only; they ride the snapshot and the backup.
export const registerV41 = (db: Pick<Dexie, "version">): void => {
  db.version(41).stores(V41_STORES);
};
