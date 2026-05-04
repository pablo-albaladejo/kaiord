import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { SyncState } from "../../types/bridge-schemas";
import type { WorkoutRecord } from "../../types/calendar-schemas";
import type { Profile } from "../../types/profile";
import type { KRD } from "../../types/schemas";
import type { UsageRecord } from "../../types/usage-schemas";
import type { WorkoutTemplate } from "../../types/workout-library";
import { KaiordDatabase } from "./dexie-database";
import { createDexiePersistence } from "./dexie-persistence-adapter";
import { probeStorage } from "./storage-probe";

// --- Test database (fresh per suite, cleared per test) ---

const testDb = new KaiordDatabase("kaiord-test");

// --- Fixture factories ---

const TEMPLATE_UUID_1 = "00000000-0000-4000-8000-000000000001";
const TEMPLATE_UUID_2 = "00000000-0000-4000-8000-000000000002";
const PROFILE_UUID_1 = "00000000-0000-4000-8000-000000000003";
const PROFILE_UUID_2 = "00000000-0000-4000-8000-000000000004";

function makeKrd(): KRD {
  return {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2026-04-07T08:00:00Z", sport: "cycling" },
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
    createdAt: 0,
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

// --- Clear all tables before each test ---

beforeEach(async () => {
  await Promise.all([
    testDb.table("workouts").clear(),
    testDb.table("templates").clear(),
    testDb.table("profiles").clear(),
    testDb.table("aiProviders").clear(),
    testDb.table("syncState").clear(),
    testDb.table("usage").clear(),
    testDb.table("meta").clear(),
  ]);
});

// --- WorkoutRepository ---

describe("DexieWorkoutRepository", () => {
  it("should put and getById", async () => {
    // Arrange
    const { workouts } = createDexiePersistence(testDb);
    const workout = makeWorkout();
    await workouts.put(workout);

    // Act
    const result = await workouts.getById("w-1");

    // Assert
    expect(result).toEqual(workout);
  });

  it("should return undefined for non-existent id", async () => {
    // Arrange
    const { workouts } = createDexiePersistence(testDb);

    // Act
    const result = await workouts.getById("missing");

    // Assert
    expect(result).toBeUndefined();
  });

  it("should delete a workout", async () => {
    // Arrange
    const { workouts } = createDexiePersistence(testDb);
    await workouts.put(makeWorkout());
    await workouts.delete("w-1");

    // Act
    const result = await workouts.getById("w-1");

    // Assert
    expect(result).toBeUndefined();
  });

  it("should filter by date range (inclusive)", async () => {
    // Arrange
    const { workouts } = createDexiePersistence(testDb);
    await workouts.put(makeWorkout({ id: "w-1", date: "2026-04-06" }));
    await workouts.put(makeWorkout({ id: "w-2", date: "2026-04-07" }));
    await workouts.put(makeWorkout({ id: "w-3", date: "2026-04-08" }));
    await workouts.put(makeWorkout({ id: "w-4", date: "2026-04-09" }));
    const result = await workouts.getByDateRange("2026-04-07", "2026-04-08");

    // Act
    const ids = result.map((w) => w.id).sort();

    // Assert
    expect(ids).toEqual(["w-2", "w-3"]);
  });

  it("should return empty array for no matches", async () => {
    // Arrange
    const { workouts } = createDexiePersistence(testDb);

    // Act
    const result = await workouts.getByDateRange("2026-01-01", "2026-01-07");

    // Assert
    expect(result).toEqual([]);
  });

  it("should filter by state", async () => {
    // Arrange
    const { workouts } = createDexiePersistence(testDb);
    await workouts.put(makeWorkout({ id: "w-1", state: "raw" }));
    await workouts.put(makeWorkout({ id: "w-2", state: "pushed" }));
    await workouts.put(makeWorkout({ id: "w-3", state: "raw" }));
    const result = await workouts.getByState("raw");

    // Act
    const ids = result.map((w) => w.id).sort();

    // Assert
    expect(ids).toEqual(["w-1", "w-3"]);
  });

  it("should find by source and sourceId", async () => {
    // Arrange
    const { workouts } = createDexiePersistence(testDb);
    await workouts.put(
      makeWorkout({
        id: "w-1",
        source: "train2go",
        sourceId: "ext-42",
      })
    );

    // Act
    const result = await workouts.getBySourceId("train2go", "ext-42");

    // Assert
    expect(result?.id).toBe("w-1");
  });

  it("should return undefined when sourceId not found", async () => {
    // Arrange
    const { workouts } = createDexiePersistence(testDb);

    // Act
    const result = await workouts.getBySourceId("train2go", "missing");

    // Assert
    expect(result).toBeUndefined();
  });

  it("should overwrite on put with same id", async () => {
    // Arrange
    const { workouts } = createDexiePersistence(testDb);
    await workouts.put(makeWorkout({ id: "w-1", state: "raw" }));
    await workouts.put(makeWorkout({ id: "w-1", state: "pushed" }));

    // Act
    const result = await workouts.getById("w-1");

    // Assert
    expect(result?.state).toBe("pushed");
  });
});

// --- TemplateRepository ---

describe("DexieTemplateRepository", () => {
  it("should put and getById", async () => {
    // Arrange
    const { templates } = createDexiePersistence(testDb);
    const template = makeTemplate();
    await templates.put(template);

    // Act
    const result = await templates.getById(TEMPLATE_UUID_1);

    // Assert
    expect(result).toEqual(template);
  });

  it("should return undefined for non-existent id", async () => {
    // Arrange
    const { templates } = createDexiePersistence(testDb);

    // Act
    const result = await templates.getById("missing");

    // Assert
    expect(result).toBeUndefined();
  });

  it("should getAll", async () => {
    // Arrange
    const { templates } = createDexiePersistence(testDb);
    await templates.put(makeTemplate({ id: TEMPLATE_UUID_1 }));
    await templates.put(makeTemplate({ id: TEMPLATE_UUID_2 }));

    // Act
    const result = await templates.getAll();

    // Assert
    expect(result).toHaveLength(2);
  });

  it("should filter getBySport", async () => {
    // Arrange
    const { templates } = createDexiePersistence(testDb);
    await templates.put(
      makeTemplate({ id: TEMPLATE_UUID_1, sport: "cycling" })
    );
    await templates.put(
      makeTemplate({ id: TEMPLATE_UUID_2, sport: "running" })
    );

    // Act
    const result = await templates.getBySport("cycling");

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(TEMPLATE_UUID_1);
  });

  it("should delete a template", async () => {
    // Arrange
    const { templates } = createDexiePersistence(testDb);
    await templates.put(makeTemplate());

    // Act
    await templates.delete(TEMPLATE_UUID_1);

    // Assert
    expect(await templates.getById(TEMPLATE_UUID_1)).toBeUndefined();
    expect(await templates.getAll()).toHaveLength(0);
  });
});

// --- ProfileRepository ---

describe("DexieProfileRepository", () => {
  it("should put and getById", async () => {
    // Arrange
    const { profiles } = createDexiePersistence(testDb);
    const profile = makeProfile();
    await profiles.put(profile);

    // Act
    const result = await profiles.getById(PROFILE_UUID_1);

    // Assert
    expect(result).toEqual(profile);
  });

  it("should track active profile id", async () => {
    // Arrange
    const { profiles } = createDexiePersistence(testDb);
    expect(await profiles.getActiveId()).toBeNull();

    // Act
    await profiles.setActiveId(PROFILE_UUID_1);

    // Assert
    expect(await profiles.getActiveId()).toBe(PROFILE_UUID_1);
  });

  it("should clear active id on null", async () => {
    // Arrange
    const { profiles } = createDexiePersistence(testDb);
    await profiles.setActiveId(PROFILE_UUID_1);

    // Act
    await profiles.setActiveId(null);

    // Assert
    expect(await profiles.getActiveId()).toBeNull();
  });

  it("should clear active id when deleting active profile", async () => {
    // Arrange
    const { profiles } = createDexiePersistence(testDb);
    await profiles.put(makeProfile({ id: PROFILE_UUID_1 }));
    await profiles.setActiveId(PROFILE_UUID_1);

    // Act
    await profiles.delete(PROFILE_UUID_1);

    // Assert
    expect(await profiles.getActiveId()).toBeNull();
    expect(await profiles.getById(PROFILE_UUID_1)).toBeUndefined();
  });

  it("should getAll profiles", async () => {
    // Arrange
    const { profiles } = createDexiePersistence(testDb);
    await profiles.put(makeProfile({ id: PROFILE_UUID_1 }));
    await profiles.put(makeProfile({ id: PROFILE_UUID_2 }));

    // Act
    const result = await profiles.getAll();

    // Assert
    expect(result).toHaveLength(2);
  });
});

// --- AiProviderRepository (with encryption) ---

describe("DexieAiProviderRepository", () => {
  it("should put and getById with encryption round-trip", async () => {
    // Arrange
    const { aiProviders } = createDexiePersistence(testDb);
    const provider = makeProvider();
    await aiProviders.put(provider);

    // Act
    const result = await aiProviders.getById("ai-1");

    // Assert
    expect(result).toEqual(provider);
    expect(result?.apiKey).toBe("test-key-not-real");
  });

  it("should store encrypted apiKey in database", async () => {
    // Arrange
    const { aiProviders } = createDexiePersistence(testDb);
    await aiProviders.put(makeProvider());

    // Act
    const raw = await testDb.table("aiProviders").get("ai-1");

    // Assert
    expect(raw.apiKey).not.toBe("test-key-not-real");
    expect(typeof raw.apiKey).toBe("string");
    expect(raw.apiKey.length).toBeGreaterThan(0);
  });

  it("should return undefined for non-existent id", async () => {
    // Arrange

    // Act
    const { aiProviders } = createDexiePersistence(testDb);

    // Assert
    expect(await aiProviders.getById("missing")).toBeUndefined();
  });

  it("should getAll providers with decryption", async () => {
    // Arrange
    const { aiProviders } = createDexiePersistence(testDb);
    await aiProviders.put(makeProvider({ id: "ai-1" }));
    await aiProviders.put(makeProvider({ id: "ai-2", apiKey: "another-key" }));
    const result = await aiProviders.getAll();
    expect(result).toHaveLength(2);

    // Act
    const keys = result.map((p) => p.apiKey).sort();

    // Assert
    expect(keys).toEqual(["another-key", "test-key-not-real"]);
  });

  it("should delete a provider", async () => {
    // Arrange
    const { aiProviders } = createDexiePersistence(testDb);
    await aiProviders.put(makeProvider());

    // Act
    await aiProviders.delete("ai-1");

    // Assert
    expect(await aiProviders.getById("ai-1")).toBeUndefined();
  });

  it("should return providers in createdAt order regardless of UUID-pk order", async () => {
    // Arrange
    const { aiProviders } = createDexiePersistence(testDb);
    await aiProviders.put(
      makeProvider({ id: "zzz-second", label: "Second", createdAt: 200 })
    );
    await aiProviders.put(
      makeProvider({ id: "aaa-first", label: "First", createdAt: 100 })
    );

    // Act
    const result = await aiProviders.getAll();

    // Assert
    expect(result.map((p) => p.label)).toEqual(["First", "Second"]);
  });
});

// --- SyncStateRepository ---

describe("DexieSyncStateRepository", () => {
  it("should put and getBySource", async () => {
    // Arrange
    const { syncState } = createDexiePersistence(testDb);
    const state = makeSyncState();
    await syncState.put(state);

    // Act
    const result = await syncState.getBySource("garmin");

    // Assert
    expect(result).toEqual(state);
  });

  it("should return undefined for non-existent source", async () => {
    // Arrange

    // Act
    const { syncState } = createDexiePersistence(testDb);

    // Assert
    expect(await syncState.getBySource("missing")).toBeUndefined();
  });

  it("should getAll sync states", async () => {
    // Arrange
    const { syncState } = createDexiePersistence(testDb);
    await syncState.put(makeSyncState({ source: "garmin" }));
    await syncState.put(makeSyncState({ source: "train2go" }));

    // Act
    const result = await syncState.getAll();

    // Assert
    expect(result).toHaveLength(2);
  });

  it("should delete by source", async () => {
    // Arrange
    const { syncState } = createDexiePersistence(testDb);
    await syncState.put(makeSyncState());

    // Act
    await syncState.delete("garmin");

    // Assert
    expect(await syncState.getBySource("garmin")).toBeUndefined();
  });

  it("should overwrite on put with same source", async () => {
    // Arrange
    const { syncState } = createDexiePersistence(testDb);
    await syncState.put(makeSyncState({ protocolVersion: 1 }));
    await syncState.put(makeSyncState({ protocolVersion: 2 }));

    // Act
    const result = await syncState.getBySource("garmin");

    // Assert
    expect(result?.protocolVersion).toBe(2);
  });
});

// --- UsageRepository ---

describe("DexieUsageRepository", () => {
  it("should put and getByMonth", async () => {
    // Arrange
    const { usage } = createDexiePersistence(testDb);
    const record: UsageRecord = {
      yearMonth: "2026-04",
      inputTokens: 1200,
      outputTokens: 300,
      totalTokens: 1500,
      totalCost: 0.03,
      entries: [
        {
          date: "2026-04-07",
          inputTokens: 1200,
          outputTokens: 300,
          tokens: 1500,
          cost: 0.03,
        },
      ],
    };
    await usage.put(record);

    // Act
    const result = await usage.getByMonth("2026-04");

    // Assert
    expect(result).toEqual(record);
  });

  it("should return undefined for non-existent month", async () => {
    // Arrange

    // Act
    const { usage } = createDexiePersistence(testDb);

    // Assert
    expect(await usage.getByMonth("2025-01")).toBeUndefined();
  });

  it("should overwrite on put with same yearMonth", async () => {
    // Arrange
    const { usage } = createDexiePersistence(testDb);
    await usage.put({
      yearMonth: "2026-04",
      inputTokens: 80,
      outputTokens: 20,
      totalTokens: 100,
      totalCost: 0.01,
      entries: [],
    });
    await usage.put({
      yearMonth: "2026-04",
      inputTokens: 160,
      outputTokens: 40,
      totalTokens: 200,
      totalCost: 0.02,
      entries: [
        {
          date: "2026-04-11",
          inputTokens: 160,
          outputTokens: 40,
          tokens: 200,
          cost: 0.02,
        },
      ],
    });

    // Act
    const result = await usage.getByMonth("2026-04");

    // Assert
    expect(result?.totalTokens).toBe(200);
    expect(result?.entries).toHaveLength(1);
  });
});

// --- Transaction (multi-write atomicity) ---

describe("DexiePersistence.transaction", () => {
  it("should commit both writes on success", async () => {
    // Arrange
    const persistence = createDexiePersistence(testDb);
    const profile = makeProfile({ id: PROFILE_UUID_1 });

    // Act
    await persistence.transaction(async () => {
      await persistence.profiles.put(profile);
      await persistence.profiles.setActiveId(profile.id);
    });

    // Assert
    expect(await persistence.profiles.getById(PROFILE_UUID_1)).toEqual(profile);
    expect(await persistence.profiles.getActiveId()).toBe(PROFILE_UUID_1);
  });

  it("should roll back both writes when the callback rejects", async () => {
    // Arrange
    const persistence = createDexiePersistence(testDb);

    // Act
    const profile = makeProfile({ id: PROFILE_UUID_1 });

    // Assert
    await expect(
      persistence.transaction(async () => {
        await persistence.profiles.put(profile);
        await persistence.profiles.setActiveId(profile.id);
        throw new Error("simulated mid-transaction failure");
      })
    ).rejects.toThrow("simulated mid-transaction failure");
    expect(await persistence.profiles.getById(PROFILE_UUID_1)).toBeUndefined();
    expect(await persistence.profiles.getActiveId()).toBeNull();
  });

  it("should roll back a write even when no second write follows (fake-indexeddb sanity)", async () => {
    // Arrange
    const persistence = createDexiePersistence(testDb);

    // Act
    const profile = makeProfile({ id: PROFILE_UUID_1 });

    // Assert
    await expect(
      persistence.transaction(async () => {
        await persistence.profiles.put(profile);
        throw new Error("abort before second write");
      })
    ).rejects.toThrow("abort before second write");
    expect(await persistence.profiles.getAll()).toEqual([]);
  });

  it("returns the callback's resolved value on success", async () => {
    // Arrange
    const persistence = createDexiePersistence(testDb);

    // Act
    const result = await persistence.transaction(async () => {
      await persistence.profiles.put(makeProfile({ id: PROFILE_UUID_1 }));
      return "committed";
    });

    // Assert
    expect(result).toBe("committed");
  });
});

// --- Storage Probe ---

describe("probeStorage", () => {
  it("should return complete when IndexedDB is available", async () => {
    // Arrange

    // Act
    const status = await probeStorage();

    // Assert
    expect(status).toBe("complete");
  });
});
