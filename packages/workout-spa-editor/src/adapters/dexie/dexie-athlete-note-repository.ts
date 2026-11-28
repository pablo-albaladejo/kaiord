import type { AthleteNoteRepository } from "../../ports/athlete-note-repository";
import type { AthleteNote } from "../../types/athlete-note";
import type { KaiordDatabase } from "./dexie-database";

/** The v41 `athleteNotes` store, one row per Coaching Activity. */
export const createDexieAthleteNoteRepository = (
  db: KaiordDatabase
): AthleteNoteRepository => {
  const table = () => db.table<AthleteNote>("athleteNotes");
  return {
    getById: (id) => table().get(id),
    put: async (note) => {
      await table().put(note);
    },
    deleteByProfile: async (profileId) => {
      await table().where("profileId").equals(profileId).delete();
    },
  };
};
