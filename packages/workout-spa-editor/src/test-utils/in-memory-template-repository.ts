/**
 * In-Memory Template Repository
 *
 * Test implementation using a plain Map.
 */

import type { WorkoutTemplate } from "../types/workout-library";
import type { TemplateRepository } from "../ports/persistence-port";

export function createInMemoryTemplateRepository(): TemplateRepository {
  const store = new Map<string, WorkoutTemplate>();

  return {
    getAll: async () => [...store.values()],

    getById: async (id) => store.get(id),

    getBySport: async (sport) =>
      [...store.values()].filter((t) => t.sport === sport),

    put: async (template) => {
      store.set(template.id, template);
    },

    delete: async (id) => {
      store.delete(id);
    },
  };
}
