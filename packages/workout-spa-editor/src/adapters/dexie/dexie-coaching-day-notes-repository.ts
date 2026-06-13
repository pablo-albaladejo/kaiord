/**
 * Dexie Coaching Day-Notes Repository
 *
 * IndexedDB-backed implementation of CoachingDayNotesRepository. The day's
 * thread is keyed by the composite `id` (`${profileId}:${source}:${date}`),
 * so `getByDate` resolves through the primary key. `deleteByProfile` scans
 * the `[profileId+date]` index range — same shape the profile-delete
 * cascade uses for `coachingActivities`.
 */

import type { CoachingDayNotesRepository } from "../../ports/persistence-port";
import {
  buildCoachingDayNotesId,
  type CoachingDayNotesRecord,
} from "../../types/coaching-day-notes-record";
import type { KaiordDatabase } from "./dexie-database";

export function createDexieCoachingDayNotesRepository(
  db: KaiordDatabase
): CoachingDayNotesRepository {
  const table = () => db.table<CoachingDayNotesRecord>("coachingDayNotes");

  return {
    getByDate: async (profileId, source, date) => {
      const result = await table().get(
        buildCoachingDayNotesId(profileId, source, date)
      );
      return result ?? undefined;
    },

    upsert: async (record) => {
      await table().put(record);
    },

    deleteByProfile: async (profileId) => {
      await table()
        .where("[profileId+date]")
        .between(
          [profileId, "0000-00-00"],
          [profileId, "9999-99-99"],
          true,
          true
        )
        .delete();
    },
  };
}
