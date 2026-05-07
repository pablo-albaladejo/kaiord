import type { Analytics } from "@kaiord/core";
import { vi } from "vitest";

import type {
  CoachingRepository,
  WorkoutRepository,
} from "../../ports/persistence-port";
import type { AiMeta } from "../../types/calendar-fragments";
import type { WorkoutRecord } from "../../types/calendar-record";
import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
} from "../../types/coaching-activity-record";
import type { KRD } from "../../types/schemas";
import { buildCoachingTemplateKrd } from "./coaching-template";

export const stubActivity = (
  overrides: Partial<CoachingActivityRecord> = {}
): CoachingActivityRecord => {
  const profileId = overrides.profileId ?? "p1";
  const source = overrides.source ?? "train2go";
  const sourceId = overrides.sourceId ?? "12345";
  return {
    id: buildCoachingActivityId(profileId, source, sourceId),
    profileId,
    source,
    sourceId,
    date: "2026-04-29",
    sport: "cycling",
    title: "FTP test",
    description: "Calentamiento Z1 + 5x(15s Z5)",
    status: "pending",
    fetchedAt: "2026-04-28T10:00:00.000Z",
    ...overrides,
  };
};

export const buildStubCoachingRepo = (
  rows: CoachingActivityRecord[]
): CoachingRepository => {
  const map = new Map(rows.map((r) => [r.id, r]));
  return {
    getById: async (id) => map.get(id),
    getByProfileAndDateRange: async () => [...map.values()],
    getByProfileAndSourceId: async () => undefined,
    upsertMany: async () => undefined,
    put: async () => undefined,
    delete: async () => undefined,
    deleteByProfile: async () => undefined,
  };
};

export type StubWorkoutRepo = WorkoutRepository & {
  setSourceLookup: (w: WorkoutRecord | undefined) => void;
};

export const buildStubWorkoutRepo = (
  rows: WorkoutRecord[] = []
): StubWorkoutRepo => {
  const store = new Map(rows.map((r) => [r.id, r]));
  let next: WorkoutRecord | undefined;
  return {
    getById: async (id) => store.get(id),
    getByDateRange: async () => [...store.values()],
    getByState: async () => [],
    getBySourceId: async () => next,
    put: async (w) => void store.set(w.id, w),
    delete: async (id) => void store.delete(id),
    setSourceLookup: (w) => {
      next = w;
    },
  };
};

export const buildStubAnalytics = (): Analytics => ({
  pageView: vi.fn(),
  event: vi.fn(),
});
export const fakeKrd = (): KRD => buildCoachingTemplateKrd("cycling");
export const fakeAiMeta = (): AiMeta => ({
  promptVersion: "test",
  model: "test-model",
  provider: "test-provider",
  processedAt: "2026-05-04T10:00:00.000Z",
});
