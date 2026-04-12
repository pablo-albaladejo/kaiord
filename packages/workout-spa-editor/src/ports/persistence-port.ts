/**
 * Persistence Port
 *
 * Hexagonal port defining repository contracts for all
 * persisted data domains in the workout SPA editor.
 */

import type { LlmProviderConfig } from "../store/ai-store-types";
import type { SyncState } from "../types/bridge-schemas";
import type { WorkoutState } from "../types/calendar-enums";
import type { WorkoutRecord } from "../types/calendar-schemas";
import type { Profile } from "../types/profile";
import type { UsageRecord } from "../types/usage-schemas";
import type { WorkoutTemplate } from "../types/workout-library";

export type WorkoutRepository = {
  getById: (id: string) => Promise<WorkoutRecord | undefined>;
  getByDateRange: (
    start: string,
    end: string,
  ) => Promise<WorkoutRecord[]>;
  getByState: (state: WorkoutState) => Promise<WorkoutRecord[]>;
  getBySourceId: (
    source: string,
    sourceId: string,
  ) => Promise<WorkoutRecord | undefined>;
  put: (workout: WorkoutRecord) => Promise<void>;
  delete: (id: string) => Promise<void>;
};

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
};

export type AiProviderRepository = {
  getAll: () => Promise<LlmProviderConfig[]>;
  getById: (id: string) => Promise<LlmProviderConfig | undefined>;
  put: (provider: LlmProviderConfig) => Promise<void>;
  delete: (id: string) => Promise<void>;
};

export type SyncStateRepository = {
  getBySource: (source: string) => Promise<SyncState | undefined>;
  getAll: () => Promise<SyncState[]>;
  put: (state: SyncState) => Promise<void>;
  delete: (source: string) => Promise<void>;
};

export type UsageRepository = {
  getByMonth: (yearMonth: string) => Promise<UsageRecord | undefined>;
  put: (record: UsageRecord) => Promise<void>;
};

export type PersistencePort = {
  workouts: WorkoutRepository;
  templates: TemplateRepository;
  profiles: ProfileRepository;
  aiProviders: AiProviderRepository;
  syncState: SyncStateRepository;
  usage: UsageRepository;
};
