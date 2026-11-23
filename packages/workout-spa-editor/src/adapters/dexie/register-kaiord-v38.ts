import type Dexie from "dexie";

/** Only the new store; Dexie keeps every other store as v37 declared it. */
export const V38_STORES = { traces: "id, startedAt" };

// v38 — the Traces, kept on this device only (DEVICE_LOCAL in the snapshot
// port, `exclude` in the backup policy). Additive and schema-only: the head.
export const registerV38 = (db: Pick<Dexie, "version">): void => {
  db.version(38).stores(V38_STORES);
};
