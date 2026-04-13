/**
 * In-Memory Persistence Adapter
 *
 * Assembles all in-memory repositories into a PersistencePort
 * for use in tests. No async latency, no IndexedDB.
 */

import type { PersistencePort } from "../ports/persistence-port";
import { createInMemoryAiProviderRepository } from "./in-memory-ai-provider-repository";
import { createInMemoryProfileRepository } from "./in-memory-profile-repository";
import { createInMemorySyncStateRepository } from "./in-memory-sync-state-repository";
import { createInMemoryTemplateRepository } from "./in-memory-template-repository";
import { createInMemoryUsageRepository } from "./in-memory-usage-repository";
import { createInMemoryWorkoutRepository } from "./in-memory-workout-repository";

export function createInMemoryPersistence(): PersistencePort {
  return {
    workouts: createInMemoryWorkoutRepository(),
    templates: createInMemoryTemplateRepository(),
    profiles: createInMemoryProfileRepository(),
    aiProviders: createInMemoryAiProviderRepository(),
    syncState: createInMemorySyncStateRepository(),
    usage: createInMemoryUsageRepository(),
  };
}
