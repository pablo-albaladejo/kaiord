/**
 * v39 — the usage log stays on this device (DEVICE_LOCAL in the snapshot
 * port, `exclude` in the backup policy) and names no Trace: the `traceId`
 * each row carried is stripped. A row with an unknown price loses the
 * `cost: 0` it was written with: it had no cost. Data-only: no store or index changes, so
 * the delta is empty and Dexie keeps every store as v38 declared it.
 */
import type Dexie from "dexie";
import type { Transaction } from "dexie";

type Row = Record<string, unknown>;

export const V39_STORES = {};

export const applyV39Upgrade = async (tx: Transaction): Promise<void> => {
  await tx
    .table("usageEvents")
    .toCollection()
    .modify((row: Row) => {
      delete row.traceId;
      if (row.costBasis === "unknown") delete row.cost;
    });
};

export const registerV39 = (db: Pick<Dexie, "version">): void => {
  db.version(39).stores(V39_STORES).upgrade(applyV39Upgrade);
};
