/**
 * The setup checklist's single Dexie read.
 *
 * Every persisted signal the checklist needs — the profile's workout count,
 * its hand-loggable wellness records, the device's library templates and the
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
import type { UserPreferences } from "../types/user-preferences";

export type SetupChecklistFacts = {
  readonly workoutCount: number;
  readonly wellnessCount: number;
  readonly templateCount: number;
  readonly dismissed: boolean;
};

/** The stores the wellness entry dialog writes (`repoForMetric`). */
const WELLNESS_TABLES = [
  "healthWeight",
  "healthSleep",
  "healthHrv",
  "healthDaily",
] as const;

const HIDDEN: SetupChecklistFacts = {
  workoutCount: 0,
  wellnessCount: 0,
  templateCount: 0,
  dismissed: true,
};

const read = async (profileId: string): Promise<SetupChecklistFacts> => {
  const workoutCount = await db
    .table("workouts")
    .where("profileId")
    .equals(profileId)
    .count();
  let wellnessCount = 0;
  for (const name of WELLNESS_TABLES)
    wellnessCount += await db
      .table(name)
      .where("profileId")
      .equals(profileId)
      .count();
  const templateCount = await db.table("templates").count();
  const prefs = await db
    .table<UserPreferences>("userPreferences")
    .get(profileId);
  return {
    workoutCount,
    wellnessCount,
    templateCount,
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
