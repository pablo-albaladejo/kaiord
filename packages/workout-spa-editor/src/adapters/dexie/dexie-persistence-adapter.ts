/**
 * Dexie Persistence Adapter
 *
 * Factory assembling all Dexie repositories into a PersistencePort.
 */

import type { PersistencePort } from "../../ports/persistence-port";
import { createDexieAiProviderRepository } from "./dexie-ai-provider-repository";
import { createDexieCoachingRepository } from "./dexie-coaching-repository";
import { createDexieCoachingSyncStateRepository } from "./dexie-coaching-sync-state-repository";
import { db as defaultDb, type KaiordDatabase } from "./dexie-database";
import { createDexieProfileRepository } from "./dexie-profile-repository";
import { createDexieSyncStateRepository } from "./dexie-sync-state-repository";
import { createDexieTemplateRepository } from "./dexie-template-repository";
import { createDexieUsageRepository } from "./dexie-usage-repository";
import { createDexieWorkoutRepository } from "./dexie-workout-repository";

export function createDexiePersistence(
  database: KaiordDatabase = defaultDb
): PersistencePort {
  return {
    workouts: createDexieWorkoutRepository(database),
    templates: createDexieTemplateRepository(database),
    profiles: createDexieProfileRepository(database),
    aiProviders: createDexieAiProviderRepository(database),
    syncState: createDexieSyncStateRepository(database),
    usage: createDexieUsageRepository(database),
    coaching: createDexieCoachingRepository(database),
    coachingSyncState: createDexieCoachingSyncStateRepository(database),
  };
}
