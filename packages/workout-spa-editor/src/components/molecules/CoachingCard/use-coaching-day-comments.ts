/**
 * useCoachingDayComments — live-queries the day-scoped comment thread for
 * a (profile, source, date) triple. Reactive: when `expandDay` upserts a
 * fresh thread (e.g. after a background re-fetch), the underlying Dexie
 * row update flows through `useLiveQuery` and the panel re-renders.
 *
 * Returns `[]` when no thread is stored (or no active profile) — the
 * panel hides itself on an empty array.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../../adapters/dexie/dexie-database";
import {
  buildCoachingDayNotesId,
  type CoachingDayComment,
  type CoachingDayNotesRecord,
} from "../../../types/coaching-day-notes-record";

export const useCoachingDayComments = (
  profileId: string | null,
  source: string,
  date: string
): CoachingDayComment[] => {
  const comments = useLiveQuery<CoachingDayComment[]>(async () => {
    if (!profileId) return [];
    const record = await db
      .table<CoachingDayNotesRecord>("coachingDayNotes")
      .get(buildCoachingDayNotesId(profileId, source, date));
    return record?.comments ?? [];
  }, [profileId, source, date]);
  return comments ?? [];
};
