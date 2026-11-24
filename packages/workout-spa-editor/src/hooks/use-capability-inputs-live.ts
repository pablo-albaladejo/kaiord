import { liveQuery } from "dexie";

import { db, type KaiordDatabase } from "../adapters/dexie/dexie-database";
import { CAPABILITY_CATALOGUE } from "../lib/capabilities/capability-catalogue";
import {
  type CapabilityInputs,
  decisionsFrom,
} from "../lib/capabilities/resolve-capabilities";
import type { CapabilityDecision } from "../types/capability-decision";

export type CapabilityInputsLive = {
  profileId: string | null;
  inputs: CapabilityInputs;
};

/** Whether the table holds a row for this athlete (any row when unscoped). */
const hasRows = async (
  database: KaiordDatabase,
  name: string,
  profileId: string
): Promise<boolean> => {
  const table = database.table(name);
  const scoped = table.schema.indexes.some((i) => i.name === "profileId");
  const rows = scoped ? table.where("profileId").equals(profileId) : table;
  return (await rows.limit(1).count()) > 0;
};

const readWithData = async (
  database: KaiordDatabase,
  profileId: string
): Promise<Set<string>> => {
  const adopting = CAPABILITY_CATALOGUE.filter(
    (c) => c.adoptsExistingData !== undefined
  );
  const flags = await Promise.all(
    adopting.map((c) => hasRows(database, c.adoptsExistingData, profileId))
  );
  return new Set(adopting.filter((_, i) => flags[i]).map((c) => c.id));
};

/**
 * What decides the active athlete's Capabilities: their recorded decisions
 * (the `capabilityDecisions` store) and which adopting tables already hold
 * their data.
 */
export const readCapabilityInputs = async (
  database: KaiordDatabase = db
): Promise<CapabilityInputsLive> => {
  const idRow = await database.table("meta").get("activeProfileId");
  const profileId = (idRow?.value ?? null) as string | null;
  if (profileId === null) {
    return { profileId, inputs: { decisions: {}, withData: new Set() } };
  }
  const rows = await database
    .table<CapabilityDecision>("capabilityDecisions")
    .where("profileId")
    .equals(profileId)
    .toArray();
  const withData = await readWithData(database, profileId);
  return { profileId, inputs: { decisions: decisionsFrom(rows), withData } };
};

/** The same read, live: one Dexie subscription re-run on every change. */
export const observeCapabilityInputs = (database: KaiordDatabase = db) =>
  liveQuery(() => readCapabilityInputs(database));
