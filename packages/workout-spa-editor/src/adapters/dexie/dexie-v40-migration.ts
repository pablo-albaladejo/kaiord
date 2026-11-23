/**
 * v40 — Capability decisions get a store of their own. They lived as a
 * `capabilities` map on the `userPreferences` row, which every older build
 * rewrites from a fixed list of fields: a later write there from an older
 * device dropped the map and the decision with it. The upgrade moves each
 * map into one row per (profile, Capability), stamped with the row's
 * `updatedAt`, and removes the map from the preferences row.
 */
import type Dexie from "dexie";
import type { Transaction } from "dexie";

type Row = Record<string, unknown>;

export const V40_STORES = {
  capabilityDecisions: "[profileId+capabilityId], profileId",
};

const decisionsOf = (row: Row): Row[] => {
  const map = row.capabilities;
  if (typeof map !== "object" || map === null) return [];
  return Object.entries(map as Record<string, unknown>)
    .filter(([, on]) => typeof on === "boolean")
    .map(([capabilityId, on]) => ({
      profileId: row.profileId,
      capabilityId,
      on,
      updatedAt: row.updatedAt,
    }));
};

export const applyV40Upgrade = async (tx: Transaction): Promise<void> => {
  const prefs = await tx.table("userPreferences").toArray();
  const decisions = prefs.flatMap((row: Row) => decisionsOf(row));
  if (decisions.length > 0) {
    await tx.table("capabilityDecisions").bulkPut(decisions);
  }
  await tx
    .table("userPreferences")
    .toCollection()
    .modify((row: Row) => {
      delete row.capabilities;
    });
};

export const registerV40 = (db: Pick<Dexie, "version">): void => {
  db.version(40).stores(V40_STORES).upgrade(applyV40Upgrade);
};
