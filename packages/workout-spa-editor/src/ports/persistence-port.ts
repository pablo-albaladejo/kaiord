/**
 * Persistence Port
 *
 * Hexagonal port defining repository contracts for all
 * persisted data domains in the workout SPA editor.
 */

import type { ConnectionRepository } from "../application/connections/connection-repository.port";
import type { IntegrationPolicyRepository } from "../application/integration-policy/integration-policy-repository.port";
import type { AiModelBindingRepository } from "./ai-model-binding-repository";
import type { AutoMatchDismissalRepository } from "./auto-match-dismissal-repository";
import type { ChatConversationRepository } from "./chat-conversation-repository";
import type { ChatMessageRepository } from "./chat-message-repository";
import type {
  CoachingDayNotesRepository,
  CoachingRepository,
  CoachingSyncStateRepository,
} from "./coaching-repositories";
import type { EnergyBalanceRepositories } from "./energy-balance-repositories";
import type { HealthCleanupRepository } from "./health-cleanup-repository";
import type { HealthRepositories } from "./health-repositories";
import type { MatchedSessionsReadModel } from "./matched-sessions-read-model";
import type { SessionMatchRepository } from "./session-match-repository";
import type {
  AiProviderRepository,
  ProfileRepository,
  SyncStateRepository,
  TemplateRepository,
  UsageRepository,
} from "./simple-repositories";
import type { TombstoneRepository } from "./tombstone-repository";
import type { UserPreferencesRepository } from "./user-preferences-repository";
import type { WorkoutRepository } from "./workout-repository";

export type { AiModelBindingRepository } from "./ai-model-binding-repository";
export type { AutoMatchDismissalRepository } from "./auto-match-dismissal-repository";
export type { ChatConversationRepository } from "./chat-conversation-repository";
export type { ChatMessageRepository } from "./chat-message-repository";
export type {
  CoachingRepository,
  CoachingSyncStateRepository,
} from "./coaching-repositories";
// EnergyBalanceRepositories + its granular types are re-exported from
// ./energy-balance-repositories; import them from there directly.
export type { HealthCleanupRepository } from "./health-cleanup-repository";
export type {
  HealthRecord,
  HealthRecordRepository,
} from "./health-record-repository";
export type {
  ActivityMatch,
  MatchedSessionJoinSources,
  MatchedSessionsReadModel,
} from "./matched-sessions-read-model";
export type { SessionMatchRepository } from "./session-match-repository";
export type {
  AiProviderRepository,
  ProfileRepository,
  SyncStateRepository,
  TemplateRepository,
  UsageRepository,
} from "./simple-repositories";
export type { TombstoneRepository } from "./tombstone-repository";
export type { UserPreferencesRepository } from "./user-preferences-repository";
export type { WorkoutRepository } from "./workout-repository";

export type PersistencePort = HealthRepositories &
  EnergyBalanceRepositories & {
    workouts: WorkoutRepository;
    templates: TemplateRepository;
    profiles: ProfileRepository;
    aiProviders: AiProviderRepository;
    syncState: SyncStateRepository;
    usage: UsageRepository;
    coaching: CoachingRepository;
    coachingSyncState: CoachingSyncStateRepository;
    // Day-scoped coaching comment threads (Train2Go coach/athlete notes).
    coachingDayNotes: CoachingDayNotesRepository;
    // Per-profile integration policies (training-zones import/export gating).
    integrationPolicy: IntegrationPolicyRepository;
    // Profile-scoped repos routed through PersistencePort so the cascade and
    // `transaction` bind to one db instance (no accidental split writes).
    sessionMatch: SessionMatchRepository;
    // Read-only (CQRS) query surface for the matched-sessions calendar
    // projections. Lets the reactive hooks read their join data through the
    // port instead of importing `db`, preserving useLiveQuery observability.
    matchedSessionsReadModel: MatchedSessionsReadModel;
    autoMatchDismissal: AutoMatchDismissalRepository;
    userPreferences: UserPreferencesRepository;
    // Cross-table cleanup for the six v16 health-domain stores —
    // single-shot deleteByProfile invoked by the profile-delete cascade.
    healthCleanup: HealthCleanupRepository;
    // (The six per-metric health repos + `importedRecords` are intersected
    // in via HealthRepositories.)
    // Per-profile AI chat transcript; append-only, cascade-deleted on profile
    // removal. Delete-conversation tombstones each message via its use case.
    chatMessages: ChatMessageRepository;
    // Per-profile conversation threads (parents of chatMessages). Mutable rows
    // (rename, model override, updatedAt) — cascade-deleted on profile removal
    // and merged last-write-wins on updatedAt in the cloud-sync snapshot.
    chatConversations: ChatConversationRepository;
    // Per-profile model bindings (which provider+model each AI purpose uses).
    // Cascade-deleted on profile removal; rides the cloud-sync snapshot.
    aiModelBindings: AiModelBindingRepository;
    // Per-profile provider account linkage (#714). Device-local (excluded from
    // the cloud snapshot); cascade-deleted on profile removal.
    connections: ConnectionRepository;
    // Delete markers for cross-device sync. Written by the `withTombstones`
    // decorator on every delete; read by the snapshot/merge use cases.
    tombstones: TombstoneRepository;
    // Atomic commit-or-rollback wrapper for multi-write or read-modify-write
    // use cases. Dexie adapter delegates to db.transaction("rw", db.tables, fn);
    // in-memory adapter implements snapshot/revert. Application code MUST NOT
    // import `db` to obtain a transaction — go through this method.
    transaction: <T>(fn: () => Promise<T>) => Promise<T>;
  };
