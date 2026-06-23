/**
 * Dexie AiModelBindingRepository.
 *
 * Backed by the v22 `aiModelBindings` store. Composite primary key
 * `[profileId+purpose]` keeps one row per purpose per profile; the
 * `profileId` index serves `getAll` and the cascade bulk delete.
 */
import type { AiModelBindingRepository } from "../../ports/ai-model-binding-repository";
import type { AiModelBinding } from "../../types/ai-model-binding";
import type { KaiordDatabase } from "./dexie-database";

export function createDexieAiModelBindingRepository(
  db: KaiordDatabase
): AiModelBindingRepository {
  const table = () => db.table<AiModelBinding>("aiModelBindings");
  return {
    getAll: (profileId) =>
      table().where("profileId").equals(profileId).toArray(),
    get: (profileId, purpose) => table().get([profileId, purpose]),
    put: async (binding) => {
      await table().put(binding);
    },
    delete: async (profileId, purpose) => {
      await table().delete([profileId, purpose]);
    },
    deleteByProfile: async (profileId) => {
      await table().where("profileId").equals(profileId).delete();
    },
  };
}
