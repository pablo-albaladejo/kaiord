/**
 * useAiModelBindingsLive — reactive read hook for a profile's model bindings.
 *
 * Returns `undefined` while resolving on first mount; re-fires on every write
 * through `PersistencePort.aiModelBindings`. Yields an empty array when no
 * profile is active.
 */
import { useLiveQuery } from "dexie-react-hooks";

import { aiModelBindingRepository } from "../adapters/dexie";
import type { AiModelBinding } from "../types/ai-model-binding";

export const useAiModelBindingsLive = (
  profileId: string | null | undefined
): AiModelBinding[] | undefined =>
  useLiveQuery<AiModelBinding[]>(
    () =>
      profileId
        ? aiModelBindingRepository.getAll(profileId)
        : Promise.resolve([]),
    [profileId]
  );
