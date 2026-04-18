import { describe, it, expect, beforeEach, vi } from "vitest";

import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { WorkoutRecord } from "../../types/calendar-record";
import { prepareBatch } from "./batch-prepare";

let mockProviders: LlmProviderConfig[] = [];
let mockWorkouts: WorkoutRecord[] = [];

vi.mock("../../adapters/dexie/dexie-ai-provider-repository", () => ({
  createDexieAiProviderRepository: () => ({
    getAll: async () => mockProviders,
  }),
}));

vi.mock("../../adapters/dexie/dexie-database", () => ({
  db: {
    table: () => ({
      where: () => ({
        between: () => ({
          filter: () => ({
            toArray: async () => mockWorkouts,
          }),
        }),
      }),
    }),
  },
}));

const defaultProvider: LlmProviderConfig = {
  id: "p1",
  type: "anthropic",
  apiKey: "k",
  model: "claude",
  label: "Default",
  isDefault: true,
};

const secondaryProvider: LlmProviderConfig = {
  id: "p2",
  type: "openai",
  apiKey: "k2",
  model: "gpt",
  label: "Secondary",
  isDefault: false,
};

const rawWorkout = {
  id: "w1",
  date: "2026-04-18",
  state: "raw",
  raw: { description: "3k z1", comments: [] },
} as unknown as WorkoutRecord;

describe("prepareBatch", () => {
  beforeEach(() => {
    mockProviders = [];
    mockWorkouts = [];
  });

  it("returns the default provider when one is flagged isDefault", async () => {
    mockProviders = [secondaryProvider, defaultProvider];
    mockWorkouts = [rawWorkout];

    const result = await prepareBatch("2026-04-13", "2026-04-19");

    expect(result).toEqual({
      ok: true,
      provider: defaultProvider,
      workouts: [rawWorkout],
    });
  });

  it("falls back to the first provider when none are flagged isDefault", async () => {
    const noDefault = { ...defaultProvider, isDefault: false };
    mockProviders = [noDefault, secondaryProvider];
    mockWorkouts = [rawWorkout];

    const result = await prepareBatch("2026-04-13", "2026-04-19");

    expect(result).toMatchObject({ ok: true, provider: noDefault });
  });

  it("returns a user-friendly error when no providers are configured", async () => {
    mockProviders = [];
    mockWorkouts = [rawWorkout];

    const result = await prepareBatch("2026-04-13", "2026-04-19");

    expect(result).toEqual({
      ok: false,
      message: "Configure an AI provider in Settings.",
    });
  });

  it("returns a user-friendly error when the week has no raw workouts", async () => {
    mockProviders = [defaultProvider];
    mockWorkouts = [];

    const result = await prepareBatch("2026-04-13", "2026-04-19");

    expect(result).toEqual({
      ok: false,
      message: "No raw workouts to process this week.",
    });
  });
});
