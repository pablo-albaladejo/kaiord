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

// Dexie's transaction overload resolution explodes against KaiordDatabase's
// table union (TS2589 — see existing comment in dexie-profile-repository.ts).
// Narrow to a single explicit signature here so the application-facing port
// stays strongly typed while the adapter sidesteps the inference depth.
type DexieTxScope = (
  mode: "rw",
  tables: ReadonlyArray<unknown>,
  scope: () => Promise<unknown>
) => Promise<unknown>;
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
    // Atomicity: on rejection the IDB transaction aborts and all writes
    // inside `fn` roll back. See PersistencePort.transaction for the rule.
    transaction: <T>(fn: () => Promise<T>): Promise<T> => {
      const dexie = database as unknown as {
        transaction: DexieTxScope;
        tables: ReadonlyArray<unknown>;
      };
      return dexie.transaction("rw", dexie.tables, fn) as unknown as Promise<T>;
    },
  };
}
