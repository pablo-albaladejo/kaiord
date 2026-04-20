/**
 * Dexie Template Repository
 *
 * IndexedDB-backed implementation of TemplateRepository.
 */

import type { TemplateRepository } from "../../ports/persistence-port";
import { stripIds } from "../../store/strip-ids";
import type { WorkoutTemplate } from "../../types/workout-library";
import type { KaiordDatabase } from "./dexie-database";

const stripTemplateIds = (template: WorkoutTemplate): WorkoutTemplate => ({
  ...template,
  krd: stripIds(template.krd),
});

export function createDexieTemplateRepository(
  db: KaiordDatabase
): TemplateRepository {
  const table = () => db.table("templates");

  return {
    getAll: async () => table().toArray(),

    getById: async (id) => {
      const result = await table().get(id);
      return result ?? undefined;
    },

    getBySport: async (sport) => table().where("sport").equals(sport).toArray(),

    // stripIds chokepoint: UIWorkout ids never leak into persisted templates.
    put: async (template) => {
      await table().put(stripTemplateIds(template));
    },

    delete: async (id) => {
      await table().delete(id);
    },
  };
}
