/**
 * useIntakeForDate — reactive read of the logged intake entries for a
 * (profileId, date), re-running when the intakeEntries store changes. The
 * read runs inside one `useLiveQuery` callback (one query per concern).
 * Returns `undefined` while loading and when `profileId` is null.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { listIntakeForDate } from "../../../application/nutrition/list-intake-for-date.use-case";
import { usePersistence } from "../../../contexts/persistence-context";
import type { IntakeEntryRecord } from "../../../types/intake-entry-record";

export const useIntakeForDate = (
  profileId: string | null,
  date: string
): IntakeEntryRecord[] | undefined => {
  const persistence = usePersistence();
  return useLiveQuery<IntakeEntryRecord[] | undefined>(() => {
    if (!profileId) return Promise.resolve(undefined);
    return listIntakeForDate({ persistence, profileId }, date);
  }, [persistence, profileId, date]);
};
