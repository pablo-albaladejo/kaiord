import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import { CAPABILITY_CATALOGUE } from "../lib/capabilities/capability-catalogue";
import type { CapabilityInputs } from "../lib/capabilities/resolve-capabilities";
import type { UserPreferences } from "../types/user-preferences";

export type CapabilityInputsLive = {
  profileId: string | null;
  inputs: CapabilityInputs;
};

/** Whether the table holds a row for this athlete (any row when unscoped). */
const hasRows = async (name: string, profileId: string): Promise<boolean> => {
  const table = db.table(name);
  const scoped = table.schema.indexes.some((i) => i.name === "profileId");
  const rows = scoped ? table.where("profileId").equals(profileId) : table;
  return (await rows.limit(1).count()) > 0;
};

const readWithData = async (profileId: string): Promise<Set<string>> => {
  const adopting = CAPABILITY_CATALOGUE.filter(
    (c) => c.adoptsExistingData !== undefined
  );
  const flags = await Promise.all(
    adopting.map((c) => hasRows(c.adoptsExistingData, profileId))
  );
  return new Set(adopting.filter((_, i) => flags[i]).map((c) => c.id));
};

/**
 * One live read of what decides the active athlete's Capabilities: their
 * recorded decisions and which adopting tables already hold their data.
 * `undefined` while loading, so a deep link is not redirected before the
 * answer is known.
 */
export const useCapabilityInputsLive = (): CapabilityInputsLive | undefined =>
  useLiveQuery<CapabilityInputsLive>(async () => {
    const idRow = await db.table("meta").get("activeProfileId");
    const profileId = (idRow?.value ?? null) as string | null;
    if (profileId === null) {
      return { profileId, inputs: { decisions: {}, withData: new Set() } };
    }
    const prefs = await db
      .table<UserPreferences>("userPreferences")
      .get(profileId);
    const withData = await readWithData(profileId);
    return {
      profileId,
      inputs: { decisions: prefs?.capabilities ?? {}, withData },
    };
  }, []);
