/**
 * deleteProfileWithCascade — application use case
 *
 * Cleans up profile-scoped persistence rows BEFORE the profile row itself
 * is removed by `deleteProfile`. The id passed MUST be the function
 * argument's `deletedProfileId` — NEVER `getActiveId()` (would race when
 * deleting a non-active profile or right after a switch).
 *
 * The cascade covers every per-profile repository: workouts, coaching
 * activities, coaching day notes, coaching sync state, session matches,
 * auto-match dismissals, and user preferences. Each repository's deletion method
 * is called once with the deleted profile id. As of Dexie v13 workouts
 * are profile-scoped 1–1 (see `dexie-v13-migration.ts`), so they are
 * included in the cascade — `isPerProfileTable` also auto-discovers
 * them at delete time.
 *
 * Profile-agnostic data (templates, AI providers, usage, sync state,
 * meta) is NOT cascaded — those rows are user-owned across profile
 * boundaries by design ("AI providers are profile-agnostic", etc.).
 *
 * Atomicity: this use case does NOT open its own transaction. The caller
 * MUST wrap both this call and the subsequent `deleteProfile` invocation
 * in a single `persistence.transaction(...)` so a mid-cascade crash leaves
 * the database in the pre-delete state. See `useProfileDelete` for the
 * canonical orchestration.
 */

import type { AiModelBindingRepository } from "../../ports/ai-model-binding-repository";
import type { AutoMatchDismissalRepository } from "../../ports/auto-match-dismissal-repository";
import type { ChatConversationRepository } from "../../ports/chat-conversation-repository";
import type { ChatMessageRepository } from "../../ports/chat-message-repository";
import type { CoachingDayNotesRepository } from "../../ports/coaching-repositories";
import type {
  EnergyTargetRepository,
  IntakeEntryRepository,
  IntakePresetRepository,
} from "../../ports/energy-balance-repositories";
import type { HealthCleanupRepository } from "../../ports/health-cleanup-repository";
import type {
  CoachingRepository,
  CoachingSyncStateRepository,
  WorkoutRepository,
} from "../../ports/persistence-port";
import type { SessionMatchRepository } from "../../ports/session-match-repository";
import type { UserPreferencesRepository } from "../../ports/user-preferences-repository";
import type { ConnectionRepository } from "../connections/connection-repository.port";

export type DeleteProfileWithCascadeDeps = {
  workouts: WorkoutRepository;
  coaching: CoachingRepository;
  coachingDayNotes: CoachingDayNotesRepository;
  coachingSyncState: CoachingSyncStateRepository;
  sessionMatch: SessionMatchRepository;
  autoMatchDismissal: AutoMatchDismissalRepository;
  userPreferences: UserPreferencesRepository;
  // Cross-table cleanup for the six v16 health-domain stores.
  // Per-metric typed repositories ship in follow-up commits.
  healthCleanup: HealthCleanupRepository;
  // Per-profile AI chat transcript. Plain bulk delete (no tombstones —
  // propagates via the profile tombstone like the other per-profile stores).
  chatMessages: ChatMessageRepository;
  // Per-profile conversation threads; plain bulk delete like the other stores.
  chatConversations: ChatConversationRepository;
  // Per-profile model bindings; plain bulk delete like the other stores.
  aiModelBindings: AiModelBindingRepository;
  // Per-profile provider connections (#714); device-local, bulk delete.
  connections: ConnectionRepository;
  // Per-profile energy-balance stores (energy-balance-tracking); device-local,
  // bulk delete on profile removal.
  intakeEntries: IntakeEntryRepository;
  intakePresets: IntakePresetRepository;
  energyTargets: EnergyTargetRepository;
};

export const deleteProfileWithCascade = async (
  deps: DeleteProfileWithCascadeDeps,
  deletedProfileId: string
): Promise<void> => {
  await Promise.all([
    deps.workouts.deleteByProfile(deletedProfileId),
    deps.coaching.deleteByProfile(deletedProfileId),
    deps.coachingDayNotes.deleteByProfile(deletedProfileId),
    deps.coachingSyncState.deleteByProfile(deletedProfileId),
    deps.sessionMatch.deleteByProfile(deletedProfileId),
    deps.autoMatchDismissal.deleteByProfile(deletedProfileId),
    deps.userPreferences.delete(deletedProfileId),
    deps.healthCleanup.deleteByProfile(deletedProfileId),
    deps.chatMessages.deleteByProfile(deletedProfileId),
    deps.chatConversations.deleteByProfile(deletedProfileId),
    deps.aiModelBindings.deleteByProfile(deletedProfileId),
    deps.connections.deleteByProfile(deletedProfileId),
    deps.intakeEntries.deleteByProfile(deletedProfileId),
    deps.intakePresets.deleteByProfile(deletedProfileId),
    deps.energyTargets.deleteByProfile(deletedProfileId),
  ]);
};
