import { describe, expect, it } from "vitest";

import type { LlmProviderConfig } from "../store/ai-store-types";
import type { SyncState } from "../types/bridge-schemas";
import type { WorkoutRecord } from "../types/calendar-schemas";
import type { Profile } from "../types/profile";
import type { UsageRecord } from "../types/usage-schemas";
import type { KRD } from "../types/schemas";
import type { WorkoutTemplate } from "../types/workout-library";
import { createInMemoryPersistence } from "./in-memory-persistence";

// --- Fixture factories ---

const TEMPLATE_UUID_1 = "00000000-0000-4000-8000-000000000001";
const TEMPLATE_UUID_2 = "00000000-0000-4000-8000-000000000002";
const PROFILE_UUID_1 = "00000000-0000-4000-8000-000000000003";
const PROFILE_UUID_2 = "00000000-0000-4000-8000-000000000004";

function makeKrd(): KRD {
  return {
    version: "1.0",
    type: "structured_workout",
    metadata: {
      created: "2026-04-07T08:00:00Z",
      sport: "cycling",
    },
  };
}

function makeWorkout(overrides: Partial<WorkoutRecord> = {}): WorkoutRecord {
  return {
    id: "w-1",
    date: "2026-04-07",
    sport: "cycling",
    source: "kaiord",
    sourceId: null,
    planId: null,
    state: "raw",
    raw: null,
    krd: null,
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: "2026-04-07T08:00:00Z",
    modifiedAt: null,
    updatedAt: "2026-04-07T08:00:00Z",
    ...overrides,
  };
}

function makeTemplate(
  overrides: Partial<Pick<WorkoutTemplate, "id" | "name" | "sport">> = {}
): WorkoutTemplate {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? TEMPLATE_UUID_1,
    name: overrides.name ?? "Tempo Ride",
    sport: overrides.sport ?? "cycling",
    krd: makeKrd(),
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
}

function makeProfile(
  overrides: Partial<Pick<Profile, "id" | "name">> = {}
): Profile {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? PROFILE_UUID_1,
    name: overrides.name ?? "Default",
    sportZones: {},
    createdAt: now,
    updatedAt: now,
  };
}

function makeProvider(
  overrides: Partial<LlmProviderConfig> = {}
): LlmProviderConfig {
  return {
    id: "ai-1",
    type: "anthropic",
    apiKey: "test-key-not-real",
    model: "claude-sonnet-4-20250514",
    label: "Claude",
    isDefault: true,
    ...overrides,
  };
}

function makeSyncState(overrides: Partial<SyncState> = {}): SyncState {
  return {
    source: "garmin",
    extensionId: "ext-123",
    lastSeen: "2026-04-07T08:00:00Z",
    capabilities: ["write:workouts"],
    protocolVersion: 1,
    ...overrides,
  };
}

// --- WorkoutRepository ---

describe("WorkoutRepository", () => {
  it("should put and getById", async () => {
    const { workouts } = createInMemoryPersistence();
    const workout = makeWorkout();

    await workouts.put(workout);
    const result = await workouts.getById("w-1");

    expect(result).toEqual(workout);
  });

  it("should return undefined for non-existent id", async () => {
    const { workouts } = createInMemoryPersistence();

    const result = await workouts.getById("missing");

    expect(result).toBeUndefined();
  });

  it("should delete a workout", async () => {
    const { workouts } = createInMemoryPersistence();
    await workouts.put(makeWorkout());

    await workouts.delete("w-1");
    const result = await workouts.getById("w-1");

    expect(result).toBeUndefined();
  });

  it("should be a no-op when deleting non-existent", async () => {
    const { workouts } = createInMemoryPersistence();

    await expect(workouts.delete("missing")).resolves.toBeUndefined();
  });

  it("should filter by date range (inclusive)", async () => {
    const { workouts } = createInMemoryPersistence();
    await workouts.put(makeWorkout({ id: "w-1", date: "2026-04-06" }));
    await workouts.put(makeWorkout({ id: "w-2", date: "2026-04-07" }));
    await workouts.put(makeWorkout({ id: "w-3", date: "2026-04-08" }));
    await workouts.put(makeWorkout({ id: "w-4", date: "2026-04-09" }));

    const result = await workouts.getByDateRange("2026-04-07", "2026-04-08");

    expect(result.map((w) => w.id)).toEqual(["w-2", "w-3"]);
  });

  it("should return empty array for date range with no matches", async () => {
    const { workouts } = createInMemoryPersistence();

    const result = await workouts.getByDateRange("2026-01-01", "2026-01-07");

    expect(result).toEqual([]);
  });

  it("should filter by state", async () => {
    const { workouts } = createInMemoryPersistence();
    await workouts.put(makeWorkout({ id: "w-1", state: "raw" }));
    await workouts.put(makeWorkout({ id: "w-2", state: "pushed" }));
    await workouts.put(makeWorkout({ id: "w-3", state: "raw" }));

    const result = await workouts.getByState("raw");

    expect(result.map((w) => w.id)).toEqual(["w-1", "w-3"]);
  });

  it("should find by source and sourceId", async () => {
    const { workouts } = createInMemoryPersistence();
    await workouts.put(
      makeWorkout({ id: "w-1", source: "train2go", sourceId: "ext-42" })
    );
    await workouts.put(
      makeWorkout({ id: "w-2", source: "kaiord", sourceId: null })
    );

    const result = await workouts.getBySourceId("train2go", "ext-42");

    expect(result?.id).toBe("w-1");
  });

  it("should return undefined when sourceId not found", async () => {
    const { workouts } = createInMemoryPersistence();

    const result = await workouts.getBySourceId("train2go", "missing");

    expect(result).toBeUndefined();
  });

  it("should overwrite on put with same id", async () => {
    const { workouts } = createInMemoryPersistence();
    await workouts.put(makeWorkout({ id: "w-1", state: "raw" }));

    await workouts.put(makeWorkout({ id: "w-1", state: "pushed" }));
    const result = await workouts.getById("w-1");

    expect(result?.state).toBe("pushed");
  });
});

// --- TemplateRepository ---

describe("TemplateRepository", () => {
  it("should put and getById", async () => {
    const { templates } = createInMemoryPersistence();
    const template = makeTemplate();

    await templates.put(template);
    const result = await templates.getById(TEMPLATE_UUID_1);

    expect(result).toEqual(template);
  });

  it("should return undefined for non-existent id", async () => {
    const { templates } = createInMemoryPersistence();

    const result = await templates.getById("missing");

    expect(result).toBeUndefined();
  });

  it("should getAll", async () => {
    const { templates } = createInMemoryPersistence();
    await templates.put(makeTemplate({ id: TEMPLATE_UUID_1 }));
    await templates.put(makeTemplate({ id: TEMPLATE_UUID_2 }));

    const result = await templates.getAll();

    expect(result).toHaveLength(2);
  });

  it("should filter getBySport", async () => {
    const { templates } = createInMemoryPersistence();
    await templates.put(
      makeTemplate({ id: TEMPLATE_UUID_1, sport: "cycling" })
    );
    await templates.put(
      makeTemplate({ id: TEMPLATE_UUID_2, sport: "running" })
    );

    const result = await templates.getBySport("cycling");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(TEMPLATE_UUID_1);
  });

  it("should delete a template", async () => {
    const { templates } = createInMemoryPersistence();
    await templates.put(makeTemplate());

    await templates.delete(TEMPLATE_UUID_1);

    expect(await templates.getById(TEMPLATE_UUID_1)).toBeUndefined();
    expect(await templates.getAll()).toHaveLength(0);
  });
});

// --- ProfileRepository ---

describe("ProfileRepository", () => {
  it("should put and getById", async () => {
    const { profiles } = createInMemoryPersistence();
    const profile = makeProfile();

    await profiles.put(profile);
    const result = await profiles.getById(PROFILE_UUID_1);

    expect(result).toEqual(profile);
  });

  it("should track active profile id", async () => {
    const { profiles } = createInMemoryPersistence();

    expect(await profiles.getActiveId()).toBeNull();

    await profiles.setActiveId(PROFILE_UUID_1);

    expect(await profiles.getActiveId()).toBe(PROFILE_UUID_1);
  });

  it("should clear active id on null", async () => {
    const { profiles } = createInMemoryPersistence();
    await profiles.setActiveId(PROFILE_UUID_1);

    await profiles.setActiveId(null);

    expect(await profiles.getActiveId()).toBeNull();
  });

  it("should clear active id when deleting active profile", async () => {
    const { profiles } = createInMemoryPersistence();
    await profiles.put(makeProfile({ id: PROFILE_UUID_1 }));
    await profiles.setActiveId(PROFILE_UUID_1);

    await profiles.delete(PROFILE_UUID_1);

    expect(await profiles.getActiveId()).toBeNull();
    expect(await profiles.getById(PROFILE_UUID_1)).toBeUndefined();
  });

  it("should getAll profiles", async () => {
    const { profiles } = createInMemoryPersistence();
    await profiles.put(makeProfile({ id: PROFILE_UUID_1 }));
    await profiles.put(makeProfile({ id: PROFILE_UUID_2 }));

    const result = await profiles.getAll();

    expect(result).toHaveLength(2);
  });
});

// --- AiProviderRepository ---

describe("AiProviderRepository", () => {
  it("should put and getById", async () => {
    const { aiProviders } = createInMemoryPersistence();
    const provider = makeProvider();

    await aiProviders.put(provider);
    const result = await aiProviders.getById("ai-1");

    expect(result).toEqual(provider);
  });

  it("should return undefined for non-existent id", async () => {
    const { aiProviders } = createInMemoryPersistence();

    expect(await aiProviders.getById("missing")).toBeUndefined();
  });

  it("should getAll providers", async () => {
    const { aiProviders } = createInMemoryPersistence();
    await aiProviders.put(makeProvider({ id: "ai-1" }));
    await aiProviders.put(makeProvider({ id: "ai-2" }));

    const result = await aiProviders.getAll();

    expect(result).toHaveLength(2);
  });

  it("should delete a provider", async () => {
    const { aiProviders } = createInMemoryPersistence();
    await aiProviders.put(makeProvider());

    await aiProviders.delete("ai-1");

    expect(await aiProviders.getById("ai-1")).toBeUndefined();
  });
});

// --- SyncStateRepository ---

describe("SyncStateRepository", () => {
  it("should put and getBySource", async () => {
    const { syncState } = createInMemoryPersistence();
    const state = makeSyncState();

    await syncState.put(state);
    const result = await syncState.getBySource("garmin");

    expect(result).toEqual(state);
  });

  it("should return undefined for non-existent source", async () => {
    const { syncState } = createInMemoryPersistence();

    expect(await syncState.getBySource("missing")).toBeUndefined();
  });

  it("should getAll sync states", async () => {
    const { syncState } = createInMemoryPersistence();
    await syncState.put(makeSyncState({ source: "garmin" }));
    await syncState.put(makeSyncState({ source: "train2go" }));

    const result = await syncState.getAll();

    expect(result).toHaveLength(2);
  });

  it("should delete by source", async () => {
    const { syncState } = createInMemoryPersistence();
    await syncState.put(makeSyncState());

    await syncState.delete("garmin");

    expect(await syncState.getBySource("garmin")).toBeUndefined();
  });

  it("should overwrite on put with same source", async () => {
    const { syncState } = createInMemoryPersistence();
    await syncState.put(makeSyncState({ protocolVersion: 1 }));

    await syncState.put(makeSyncState({ protocolVersion: 2 }));
    const result = await syncState.getBySource("garmin");

    expect(result?.protocolVersion).toBe(2);
  });
});

// --- UsageRepository ---

describe("UsageRepository", () => {
  it("should put and getByMonth", async () => {
    const { usage } = createInMemoryPersistence();
    const record: UsageRecord = {
      yearMonth: "2026-04",
      totalTokens: 1500,
      totalCost: 0.03,
      entries: [{ date: "2026-04-07", tokens: 1500, cost: 0.03 }],
    };

    await usage.put(record);
    const result = await usage.getByMonth("2026-04");

    expect(result).toEqual(record);
  });

  it("should return undefined for non-existent month", async () => {
    const { usage } = createInMemoryPersistence();

    expect(await usage.getByMonth("2025-01")).toBeUndefined();
  });

  it("should overwrite on put with same yearMonth", async () => {
    const { usage } = createInMemoryPersistence();
    await usage.put({
      yearMonth: "2026-04",
      totalTokens: 100,
      totalCost: 0.01,
      entries: [],
    });

    await usage.put({
      yearMonth: "2026-04",
      totalTokens: 200,
      totalCost: 0.02,
      entries: [{ date: "2026-04-11", tokens: 200, cost: 0.02 }],
    });
    const result = await usage.getByMonth("2026-04");

    expect(result?.totalTokens).toBe(200);
    expect(result?.entries).toHaveLength(1);
  });
});
