/**
 * Dexie Template Repository
 *
 * IndexedDB-backed implementation of TemplateRepository.
 */

import type { TemplateRepository } from "../../ports/persistence-port";
import type { KaiordDatabase } from "./dexie-database";

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

    put: async (template) => {
      await table().put(template);
    },

    delete: async (id) => {
      await table().delete(id);
    },
  };
}
