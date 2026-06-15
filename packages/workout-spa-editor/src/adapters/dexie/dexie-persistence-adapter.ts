/**
 * Dexie Persistence Adapter
 *
 * Factory assembling all Dexie repositories into a PersistencePort.
 */

import type { PersistencePort } from "../../ports/persistence-port";
import type {
  HealthBodyCompositionRecord,
  HealthDailyRecord,
  HealthHrvRecord,
  HealthSleepRecord,
  HealthStressRecord,
  HealthWeightRecord,
} from "../../types/health/health-records";
import { createDexieAiModelBindingRepository } from "./dexie-ai-model-binding-repository";
import { createDexieAiProviderRepository } from "./dexie-ai-provider-repository";
import { createDexieAutoMatchDismissalRepository } from "./dexie-auto-match-dismissal-repository";
import { createDexieChatMessageRepository } from "./dexie-chat-message-repository";
import { createDexieCoachingDayNotesRepository } from "./dexie-coaching-day-notes-repository";
import { createDexieCoachingRepository } from "./dexie-coaching-repository";
import { createDexieCoachingSyncStateRepository } from "./dexie-coaching-sync-state-repository";
import { db as defaultDb, type KaiordDatabase } from "./dexie-database";
import { createDexieHealthCleanupRepository } from "./dexie-health-cleanup-repository";
import { createDexieHealthRecordRepository } from "./dexie-health-record-repository";
import { createDexieIntegrationPolicyRepository } from "./dexie-integration-policy-repository";
import { createDexieMatchedSessionsReadModel } from "./dexie-matched-sessions-read-model";
import { createDexieProfileRepository } from "./dexie-profile-repository";
import { createDexieSessionMatchRepository } from "./dexie-session-match-repository";
import { createDexieSyncStateRepository } from "./dexie-sync-state-repository";
import { createDexieTemplateRepository } from "./dexie-template-repository";
import { createDexieTombstoneRepository } from "./dexie-tombstone-repository";
import { createTransactionRunner } from "./dexie-transaction-runner";
import { createDexieUsageRepository } from "./dexie-usage-repository";
import { createDexieUserPreferencesRepository } from "./dexie-user-preferences-repository";
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
    coachingDayNotes: createDexieCoachingDayNotesRepository(database),
    integrationPolicy: createDexieIntegrationPolicyRepository(database),
    sessionMatch: createDexieSessionMatchRepository(database),
    matchedSessionsReadModel: createDexieMatchedSessionsReadModel(database),
    autoMatchDismissal: createDexieAutoMatchDismissalRepository(database),
    userPreferences: createDexieUserPreferencesRepository(database),
    healthCleanup: createDexieHealthCleanupRepository(database),
    healthSleep: createDexieHealthRecordRepository<HealthSleepRecord>(
      database,
      "healthSleep"
    ),
    healthWeight: createDexieHealthRecordRepository<HealthWeightRecord>(
      database,
      "healthWeight"
    ),
    healthHrv: createDexieHealthRecordRepository<HealthHrvRecord>(
      database,
      "healthHrv"
    ),
    healthDaily: createDexieHealthRecordRepository<HealthDailyRecord>(
      database,
      "healthDaily"
    ),
    healthBodyComposition:
      createDexieHealthRecordRepository<HealthBodyCompositionRecord>(
        database,
        "healthBodyComposition"
      ),
    healthStress: createDexieHealthRecordRepository<HealthStressRecord>(
      database,
      "healthStress"
    ),
    chatMessages: createDexieChatMessageRepository(database),
    aiModelBindings: createDexieAiModelBindingRepository(database),
    tombstones: createDexieTombstoneRepository(database),
    transaction: createTransactionRunner(database),
  };
}
