/**
 * In-Memory Persistence Snapshot
 *
 * Snapshot/revert helpers for the in-memory persistence adapter's
 * `transaction(fn)` implementation. Owns the `Stores` type that
 * collects every repo's underlying Map plus the profile active-id ref.
 */

import type { SyncState } from "../types/bridge-schemas";
import type { WorkoutRecord } from "../types/calendar-schemas";
import type { CoachingActivityRecord } from "../types/coaching-activity-record";
import type { CoachingSyncStateRecord } from "../types/coaching-sync-state";
import type {
  HealthBodyCompositionRecord,
  HealthDailyRecord,
  HealthHrvRecord,
  HealthSleepRecord,
  HealthStressRecord,
  HealthWeightRecord,
} from "../types/health/health-records";
import type { Profile } from "../types/profile";
import type { Tombstone } from "../types/snapshot";
import type { UsageRecord } from "../types/usage-schemas";
import type { WorkoutTemplate } from "../types/workout-library";
import type { LlmProviderConfig } from "../store/ai-store-types";
import type { AutoMatchDismissal } from "../types/auto-match-dismissal";
import type { IntegrationPolicy } from "../types/integration-policy";
import type { SessionMatch } from "../types/session-match";
import type { UserPreferences } from "../types/user-preferences";
import type { ActiveIdRef } from "./in-memory-profile-repository";

export type Stores = {
  workouts: Map<string, WorkoutRecord>;
  templates: Map<string, WorkoutTemplate>;
  profiles: Map<string, Profile>;
  aiProviders: Map<string, LlmProviderConfig>;
  syncState: Map<string, SyncState>;
  usage: Map<string, UsageRecord>;
  coaching: Map<string, CoachingActivityRecord>;
  coachingSyncState: Map<string, CoachingSyncStateRecord>;
  integrationPolicies: Map<string, IntegrationPolicy>;
  sessionMatch: Map<string, SessionMatch>;
  autoMatchDismissal: Map<string, AutoMatchDismissal>;
  userPreferences: Map<string, UserPreferences>;
  healthSleep: Map<string, HealthSleepRecord>;
  healthWeight: Map<string, HealthWeightRecord>;
  healthHrv: Map<string, HealthHrvRecord>;
  healthDaily: Map<string, HealthDailyRecord>;
  healthBodyComposition: Map<string, HealthBodyCompositionRecord>;
  healthStress: Map<string, HealthStressRecord>;
  tombstones: Map<string, Tombstone>;
};

export type Snapshot = {
  [K in keyof Stores]: Stores[K];
} & {
  profileActiveId: string | null;
  aiCustomPrompt: string | null;
};

import type { CustomPromptRef } from "./in-memory-ai-provider-repository";

export const captureSnapshot = (
  stores: Stores,
  activeIdRef: ActiveIdRef,
  customPromptRef: CustomPromptRef
): Snapshot => ({
  workouts: new Map(stores.workouts),
  templates: new Map(stores.templates),
  profiles: new Map(stores.profiles),
  aiProviders: new Map(stores.aiProviders),
  syncState: new Map(stores.syncState),
  usage: new Map(stores.usage),
  coaching: new Map(stores.coaching),
  coachingSyncState: new Map(stores.coachingSyncState),
  integrationPolicies: new Map(stores.integrationPolicies),
  sessionMatch: new Map(stores.sessionMatch),
  autoMatchDismissal: new Map(stores.autoMatchDismissal),
  userPreferences: new Map(stores.userPreferences),
  healthSleep: new Map(stores.healthSleep),
  healthWeight: new Map(stores.healthWeight),
  healthHrv: new Map(stores.healthHrv),
  healthDaily: new Map(stores.healthDaily),
  healthBodyComposition: new Map(stores.healthBodyComposition),
  healthStress: new Map(stores.healthStress),
  tombstones: new Map(stores.tombstones),
  profileActiveId: activeIdRef.current,
  aiCustomPrompt: customPromptRef.current,
});

export const restoreSnapshot = (
  stores: Stores,
  activeIdRef: ActiveIdRef,
  customPromptRef: CustomPromptRef,
  snapshot: Snapshot
): void => {
  for (const key of Object.keys(stores) as Array<keyof Stores>) {
    stores[key].clear();
    for (const [k, v] of snapshot[key]) {
      // Cast: Map<K, V> is invariant in V; the source map's entries
      // are already typed at the per-store value type via `Snapshot`.
      (stores[key] as Map<string, unknown>).set(k, v);
    }
  }
  activeIdRef.current = snapshot.profileActiveId;
  customPromptRef.current = snapshot.aiCustomPrompt;
};
