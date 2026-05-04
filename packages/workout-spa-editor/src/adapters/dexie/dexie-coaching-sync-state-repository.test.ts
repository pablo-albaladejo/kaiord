import "fake-indexeddb/auto";

import { beforeEach, describe, expect, it } from "vitest";

import { createDexieCoachingSyncStateRepository } from "./dexie-coaching-sync-state-repository";
import { KaiordDatabase } from "./dexie-database";

describe("DexieCoachingSyncStateRepository", () => {
  let db: KaiordDatabase;
  beforeEach(() => {
    db = new KaiordDatabase(
      `kaiord-coaching-sync-test-${Date.now()}-${Math.random()}`
    );
  });

  it("should return undefined from get for missing compound key", async () => {
    // Arrange
    const repo = createDexieCoachingSyncStateRepository(db);

    // Act
    const result = await repo.getBySourceAndProfile("train2go", "p1");

    // Assert
    expect(result).toBeUndefined();
  });

  it("should round-trip via put by [source+profileId] compound key", async () => {
    // Arrange
    const repo = createDexieCoachingSyncStateRepository(db);
    const record = {
      source: "train2go",
      profileId: "p1",
      lastSyncedAt: "2026-04-28T10:00:00.000Z",
    };
    await repo.put(record);

    // Act
    const result = await repo.getBySourceAndProfile("train2go", "p1");

    // Assert
    expect(result).toEqual(record);
  });

  it("should overwrite existing entry via put by compound key", async () => {
    // Arrange
    const repo = createDexieCoachingSyncStateRepository(db);
    await repo.put({
      source: "train2go",
      profileId: "p1",
      lastSyncedAt: "2026-04-28T10:00:00.000Z",
    });
    await repo.put({
      source: "train2go",
      profileId: "p1",
      lastSyncedAt: "2026-04-28T11:00:00.000Z",
    });

    // Act
    const result = await repo.getBySourceAndProfile("train2go", "p1");

    // Assert
    expect(result?.lastSyncedAt).toBe("2026-04-28T11:00:00.000Z");
  });

  it("should isolate entries by profile", async () => {
    // Arrange
    const repo = createDexieCoachingSyncStateRepository(db);
    await repo.put({
      source: "train2go",
      profileId: "p1",
      lastSyncedAt: "2026-04-28T10:00:00.000Z",
    });
    await repo.put({
      source: "train2go",
      profileId: "p2",
      lastSyncedAt: "2026-04-28T11:00:00.000Z",
    });
    const p1 = await repo.getBySourceAndProfile("train2go", "p1");

    // Act
    const p2 = await repo.getBySourceAndProfile("train2go", "p2");

    // Assert
    expect(p1?.lastSyncedAt).toBe("2026-04-28T10:00:00.000Z");
    expect(p2?.lastSyncedAt).toBe("2026-04-28T11:00:00.000Z");
  });

  it("deleteByProfile removes only the targeted profile's rows", async () => {
    // Arrange
    const repo = createDexieCoachingSyncStateRepository(db);
    await repo.put({
      source: "train2go",
      profileId: "p1",
      lastSyncedAt: "2026-04-28T10:00:00.000Z",
    });
    await repo.put({
      source: "trainingpeaks",
      profileId: "p1",
      lastSyncedAt: "2026-04-28T11:00:00.000Z",
    });
    await repo.put({
      source: "train2go",
      profileId: "p2",
      lastSyncedAt: "2026-04-28T12:00:00.000Z",
    });

    // Act
    await repo.deleteByProfile("p1");

    // Assert
    expect(await repo.getBySourceAndProfile("train2go", "p1")).toBeUndefined();
    expect(
      await repo.getBySourceAndProfile("trainingpeaks", "p1")
    ).toBeUndefined();
    expect(
      (await repo.getBySourceAndProfile("train2go", "p2"))?.lastSyncedAt
    ).toBe("2026-04-28T12:00:00.000Z");
  });
});
