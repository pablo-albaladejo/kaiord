/**
 * In-Memory Persistence Adapter
 *
 * Assembles all in-memory repositories into a PersistencePort
 * for use in tests. No async latency, no IndexedDB.
 *
 * Owns each repo's underlying Map directly so `transaction(fn)` can
 * snapshot all stores before running `fn` and revert them on rejection.
 */

import type { PersistencePort } from "../ports/persistence-port";
import {
  createInMemoryAiProviderRepository,
  type CustomPromptRef,
} from "./in-memory-ai-provider-repository";
import { createInMemoryCoachingRepository } from "./in-memory-coaching-repository";
import { createInMemoryCoachingSyncStateRepository } from "./in-memory-coaching-sync-state-repository";
import {
  captureSnapshot,
  restoreSnapshot,
  type Stores,
} from "./in-memory-persistence-snapshot";
import {
  createInMemoryProfileRepository,
  type ActiveIdRef,
} from "./in-memory-profile-repository";
import { createInMemorySyncStateRepository } from "./in-memory-sync-state-repository";
import { createInMemoryTemplateRepository } from "./in-memory-template-repository";
import { createInMemoryUsageRepository } from "./in-memory-usage-repository";
import { createInMemoryWorkoutRepository } from "./in-memory-workout-repository";

export function createInMemoryPersistence(): PersistencePort {
  const stores: Stores = {
    workouts: new Map(),
    templates: new Map(),
    profiles: new Map(),
    aiProviders: new Map(),
    syncState: new Map(),
    usage: new Map(),
    coaching: new Map(),
    coachingSyncState: new Map(),
  };
  const profileActiveIdRef: ActiveIdRef = { current: null };
  const aiCustomPromptRef: CustomPromptRef = { current: null };

  return {
    workouts: createInMemoryWorkoutRepository(stores.workouts),
    templates: createInMemoryTemplateRepository(stores.templates),
    profiles: createInMemoryProfileRepository(
      stores.profiles,
      profileActiveIdRef
    ),
    aiProviders: createInMemoryAiProviderRepository(
      stores.aiProviders,
      aiCustomPromptRef
    ),
    syncState: createInMemorySyncStateRepository(stores.syncState),
    usage: createInMemoryUsageRepository(stores.usage),
    coaching: createInMemoryCoachingRepository(stores.coaching),
    coachingSyncState: createInMemoryCoachingSyncStateRepository(
      stores.coachingSyncState
    ),
    transaction: async <T>(fn: () => Promise<T>): Promise<T> => {
      const snapshot = captureSnapshot(
        stores,
        profileActiveIdRef,
        aiCustomPromptRef
      );
      try {
        return await fn();
      } catch (err) {
        restoreSnapshot(
          stores,
          profileActiveIdRef,
          aiCustomPromptRef,
          snapshot
        );
        throw err;
      }
    },
  };
}
