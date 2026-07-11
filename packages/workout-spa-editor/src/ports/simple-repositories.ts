/**
 * Simple Repository Ports
 *
 * Repository contracts that fit in a few lines each. Grouped here so
 * `persistence-port.ts` stays under the SPA workspace's per-file cap
 * as the port surface keeps growing. The richer repositories
 * (workouts, coaching, session-match, user-preferences,
 * auto-match-dismissal, health-record, health-cleanup) each live in
 * their own file.
 */

import type { LlmProviderConfig } from "../store/ai-store-types";
import type { SyncState } from "../types/bridge-schemas";
import type { Profile } from "../types/profile";
import type { UsageEventRecord } from "../types/usage-event-schemas";
import type { WorkoutTemplate } from "../types/workout-library";

export type TemplateRepository = {
  getAll: () => Promise<WorkoutTemplate[]>;
  getById: (id: string) => Promise<WorkoutTemplate | undefined>;
  getBySport: (sport: string) => Promise<WorkoutTemplate[]>;
  put: (template: WorkoutTemplate) => Promise<void>;
  delete: (id: string) => Promise<void>;
};

export type ProfileRepository = {
  getAll: () => Promise<Profile[]>;
  getById: (id: string) => Promise<Profile | undefined>;
  getActiveId: () => Promise<string | null>;
  setActiveId: (id: string | null) => Promise<void>;
  put: (profile: Profile) => Promise<void>;
  delete: (id: string) => Promise<void>;
  // Lightweight existence check; uses the underlying store's count primitive.
  count: () => Promise<number>;
};

export type AiProviderRepository = {
  getAll: () => Promise<LlmProviderConfig[]>;
  getById: (id: string) => Promise<LlmProviderConfig | undefined>;
  put: (provider: LlmProviderConfig) => Promise<void>;
  delete: (id: string) => Promise<void>;
  // Custom prompt belongs to the AI domain. Routing it through this
  // repository keeps the meta-table read/write out of application
  // code so the no-direct-port-call rule holds across the domain.
  // `null` distinguishes "never set" from `""` (user cleared).
  getCustomPrompt: () => Promise<string | null>;
  setCustomPrompt: (prompt: string) => Promise<void>;
};

export type SyncStateRepository = {
  getBySource: (source: string) => Promise<SyncState | undefined>;
  getAll: () => Promise<SyncState[]>;
  put: (state: SyncState) => Promise<void>;
  delete: (source: string) => Promise<void>;
};

// Append-only, synced telemetry log of per-run token usage; folded into monthly
// totals by `foldUsageEvents`. `listByMonth`/`listByMonths` read via the
// `[yearMonth+purpose]` index (panel window); `listOlderThan` backs the
// retention prune. `getById`/`delete(id)` let the tombstone decorator propagate
// a pruned event's removal cross-device.
export type UsageEventRepository = {
  append: (record: UsageEventRecord) => Promise<void>;
  listByMonth: (yearMonth: string) => Promise<UsageEventRecord[]>;
  listByMonths: (yearMonths: string[]) => Promise<UsageEventRecord[]>;
  listOlderThan: (yearMonth: string) => Promise<UsageEventRecord[]>;
  getById: (id: string) => Promise<UsageEventRecord | undefined>;
  delete: (id: string) => Promise<void>;
};

// The usage event log is the single usage-accounting store after the cutover.
export type UsageEventRepositories = {
  usageEvents: UsageEventRepository;
};
