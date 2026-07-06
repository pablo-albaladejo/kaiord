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
import { createInMemoryActivityRepository } from "./in-memory-activity-repository";
import { createInMemoryAiModelBindingRepository } from "./in-memory-ai-model-binding-repository";
import {
  createInMemoryAiProviderRepository,
  type CustomPromptRef,
} from "./in-memory-ai-provider-repository";
import { createInMemoryAutoMatchDismissalRepository } from "./in-memory-auto-match-dismissal-repository";
import { createInMemoryChatConversationRepository } from "./in-memory-chat-conversation-repository";
import { createInMemoryChatMessageRepository } from "./in-memory-chat-message-repository";
import { createInMemoryCoachingDayNotesRepository } from "./in-memory-coaching-day-notes-repository";
import { createInMemoryCoachingRepository } from "./in-memory-coaching-repository";
import { createInMemoryCoachingSyncStateRepository } from "./in-memory-coaching-sync-state-repository";
import { createInMemoryConnectionRepository } from "./in-memory-connection-repository";
import { createInMemoryEnergyBalanceRepositories } from "./in-memory-energy-balance-repositories";
import { createInMemoryHealthRecordRepository } from "./in-memory-health-record-repository";
import { createInMemoryImportedRecordRepository } from "./in-memory-imported-record-repository";
import { createInMemoryIntegrationPolicyRepository } from "./in-memory-integration-policy-repository";
import { createInMemoryMatchedSessionsReadModel } from "./in-memory-matched-sessions-read-model";
import {
  captureSnapshot,
  restoreSnapshot,
  type Stores,
} from "./in-memory-persistence-snapshot";
import {
  createInMemoryProfileRepository,
  type ActiveIdRef,
} from "./in-memory-profile-repository";
import { createInMemorySessionMatchRepository } from "./in-memory-session-match-repository";
import { createInMemorySyncStateRepository } from "./in-memory-sync-state-repository";
import { createInMemoryTombstoneRepository } from "./in-memory-tombstone-repository";
import { createInMemoryTemplateRepository } from "./in-memory-template-repository";
import { createInMemoryUsageRepository } from "./in-memory-usage-repository";
import { createInMemoryUserPreferencesRepository } from "./in-memory-user-preferences-repository";
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
    coachingDayNotes: new Map(),
    integrationPolicies: new Map(),
    sessionMatch: new Map(),
    autoMatchDismissal: new Map(),
    userPreferences: new Map(),
    healthSleep: new Map(),
    healthWeight: new Map(),
    healthHrv: new Map(),
    healthDaily: new Map(),
    healthBodyComposition: new Map(),
    healthStress: new Map(),
    chatMessages: new Map(),
    chatConversations: new Map(),
    aiModelBindings: new Map(),
    tombstones: new Map(),
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
    coachingDayNotes: createInMemoryCoachingDayNotesRepository(
      stores.coachingDayNotes
    ),
    connections: createInMemoryConnectionRepository(),
    integrationPolicy: createInMemoryIntegrationPolicyRepository(
      stores.integrationPolicies
    ),
    sessionMatch: createInMemorySessionMatchRepository(stores.sessionMatch),
    matchedSessionsReadModel: createInMemoryMatchedSessionsReadModel(
      stores.coaching,
      stores.workouts,
      stores.sessionMatch
    ),
    autoMatchDismissal: createInMemoryAutoMatchDismissalRepository(
      stores.autoMatchDismissal
    ),
    userPreferences: createInMemoryUserPreferencesRepository(
      stores.userPreferences
    ),
    healthCleanup: {
      deleteByProfile: async (profileId: string) => {
        const healthMaps = [
          stores.healthSleep,
          stores.healthWeight,
          stores.healthHrv,
          stores.healthDaily,
          stores.healthBodyComposition,
          stores.healthStress,
        ] as ReadonlyArray<Map<string, { profileId: string }>>;
        for (const map of healthMaps) {
          for (const [id, row] of map) {
            if (row.profileId === profileId) map.delete(id);
          }
        }
      },
    },
    healthSleep: createInMemoryHealthRecordRepository(stores.healthSleep),
    healthWeight: createInMemoryHealthRecordRepository(stores.healthWeight),
    healthHrv: createInMemoryHealthRecordRepository(stores.healthHrv),
    healthDaily: createInMemoryHealthRecordRepository(stores.healthDaily),
    healthBodyComposition: createInMemoryHealthRecordRepository(
      stores.healthBodyComposition
    ),
    healthStress: createInMemoryHealthRecordRepository(stores.healthStress),
    importedRecords: createInMemoryImportedRecordRepository({
      weight: stores.healthWeight,
      sleep: stores.healthSleep,
      hrv: stores.healthHrv,
      "daily-wellness": stores.healthDaily,
      "body-composition": stores.healthBodyComposition,
      stress: stores.healthStress,
    }),
    activities: createInMemoryActivityRepository(),
    chatMessages: createInMemoryChatMessageRepository(stores.chatMessages),
    chatConversations: createInMemoryChatConversationRepository(
      stores.chatConversations
    ),
    aiModelBindings: createInMemoryAiModelBindingRepository(
      stores.aiModelBindings
    ),
    ...createInMemoryEnergyBalanceRepositories(),
    tombstones: createInMemoryTombstoneRepository(stores.tombstones),
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
