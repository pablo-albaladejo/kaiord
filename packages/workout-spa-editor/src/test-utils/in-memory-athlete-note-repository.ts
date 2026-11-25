import type { AthleteNoteRepository } from "../ports/athlete-note-repository";
import type { AthleteNote } from "../types/athlete-note";

export const createInMemoryAthleteNoteRepository =
  (): AthleteNoteRepository => {
    const rows = new Map<string, AthleteNote>();
    return {
      getById: async (id) => rows.get(id),
      put: async (note) => {
        rows.set(note.id, note);
      },
      deleteByProfile: async (profileId) => {
        for (const [id, note] of rows)
          if (note.profileId === profileId) rows.delete(id);
      },
    };
  };
