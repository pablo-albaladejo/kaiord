/**
 * Persistence Port
 *
 * Hexagonal port defining repository contracts for all
 * persisted data domains in the workout SPA editor.
 */

import type { IntegrationPolicyRepository } from "../application/integration-policy/integration-policy-repository.port";
import type {
  HealthBodyCompositionRecord,
  HealthDailyRecord,
  HealthHrvRecord,
  HealthSleepRecord,
  HealthStressRecord,
  HealthWeightRecord,
} from "../types/health/health-records";
import type { AutoMatchDismissalRepository } from "./auto-match-dismissal-repository";
import type {
  CoachingDayNotesRepository,
  CoachingRepository,
  CoachingSyncStateRepository,
} from "./coaching-repositories";
import type { HealthCleanupRepository } from "./health-cleanup-repository";
import type { HealthRecordRepository } from "./health-record-repository";
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

export type { AutoMatchDismissalRepository } from "./auto-match-dismissal-repository";
export type {
  CoachingDayNotesRepository,
  CoachingRepository,
  CoachingSyncStateRepository,
} from "./coaching-repositories";
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

export type PersistencePort = {
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
  // Profile-scoped repos previously created on demand via direct `db`
  // imports. Routing them through PersistencePort keeps the cascade
  // (deleteProfileWithCascade) bound to the same database instance the
  // outer `transaction` opens, so a different PersistencePort backed by
  // a different db cannot accidentally split writes.
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
  // Typed per-metric CRUD repositories backed by the v16 health stores.
  // Read/write surface is identical (HealthRecordRepository<T>); only
  // the payload type differs per metric.
  healthSleep: HealthRecordRepository<HealthSleepRecord>;
  healthWeight: HealthRecordRepository<HealthWeightRecord>;
  healthHrv: HealthRecordRepository<HealthHrvRecord>;
  healthDaily: HealthRecordRepository<HealthDailyRecord>;
  healthBodyComposition: HealthRecordRepository<HealthBodyCompositionRecord>;
  healthStress: HealthRecordRepository<HealthStressRecord>;
  // Delete markers for cross-device sync. Written by the `withTombstones`
  // decorator on every delete; read by the snapshot/merge use cases.
  tombstones: TombstoneRepository;
  // Atomic commit-or-rollback wrapper for multi-write or read-modify-write
  // use cases. Dexie adapter delegates to db.transaction("rw", db.tables, fn);
  // in-memory adapter implements snapshot/revert. Application code MUST NOT
  // import `db` to obtain a transaction — go through this method.
  transaction: <T>(fn: () => Promise<T>) => Promise<T>;
};
