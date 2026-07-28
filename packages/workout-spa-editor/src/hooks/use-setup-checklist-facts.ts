/**
 * The setup checklist's single Dexie read.
 *
 * Every persisted signal the checklist needs — the profile's workout count,
 * its connected-provider count, the device's workout export ledger and the
 * dismissal preference — is folded into ONE `useLiveQuery` callback, per the
 * repo's one-query-per-page rule. Dexie tracks every table touched inside the
 * callback, so a write to any of them re-fires the whole aggregate.
 *
 * The unresolved value is `HIDDEN` (`dismissed: true`): the checklist must not
 * flash on mount and then vanish once a stored dismissal resolves. A null
 * profile resolves to the same shape, which is what gates the card off before
 * a profile exists.
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import { createDexieExportLedgerRepository } from "../adapters/dexie/dexie-export-ledger-repository";
import type { ConnectionRecord } from "../types/connection";
import type { UserPreferences } from "../types/user-preferences";

export type SetupChecklistFacts = {
  readonly workoutCount: number;
  readonly connectedCount: number;
  readonly pushCount: number;
  readonly dismissed: boolean;
};

const ledger = createDexieExportLedgerRepository(db);

const HIDDEN: SetupChecklistFacts = {
  workoutCount: 0,
  connectedCount: 0,
  pushCount: 0,
  dismissed: true,
};

const read = async (profileId: string): Promise<SetupChecklistFacts> => {
  const workoutCount = await db
    .table("workouts")
    .where("profileId")
    .equals(profileId)
    .count();
  const connectedCount = await db
    .table<ConnectionRecord>("connections")
    .where("profileId")
    .equals(profileId)
    .filter((record) => record.status === "connected")
    .count();
  const pushCount = await ledger.countByDataType("workout");
  const prefs = await db
    .table<UserPreferences>("userPreferences")
    .get(profileId);
  return {
    workoutCount,
    connectedCount,
    pushCount,
    dismissed: prefs?.setupChecklistDismissed ?? false,
  };
};

export const useSetupChecklistFacts = (
  profileId: string | null
): SetupChecklistFacts =>
  useLiveQuery(
    async () => (profileId ? read(profileId) : HIDDEN),
    [profileId],
    HIDDEN
  );
