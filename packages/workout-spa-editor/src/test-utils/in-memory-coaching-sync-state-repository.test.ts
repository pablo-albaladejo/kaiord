/**
 * In-Memory Coaching Sync State Repository — behavior tests
 */

import { beforeEach, describe, expect, it } from "vitest";

import type { CoachingSyncStateRepository } from "../ports/persistence-port";
import { createInMemoryCoachingSyncStateRepository } from "./in-memory-coaching-sync-state-repository";

describe("InMemoryCoachingSyncStateRepository", () => {
  let repo: CoachingSyncStateRepository;
  beforeEach(() => {
    repo = createInMemoryCoachingSyncStateRepository();
  });

  it("get returns undefined for missing keys", async () => {
    const result = await repo.getBySourceAndProfile("train2go", "p1");
    expect(result).toBeUndefined();
  });

  it("put round-trips by compound (source, profileId)", async () => {
    await repo.put({
      source: "train2go",
      profileId: "p1",
      lastSyncedAt: "2026-04-28T10:00:00.000Z",
    });

    const result = await repo.getBySourceAndProfile("train2go", "p1");
    expect(result?.lastSyncedAt).toBe("2026-04-28T10:00:00.000Z");
  });

  it("put overwrites existing entry by compound key", async () => {
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

    const result = await repo.getBySourceAndProfile("train2go", "p1");
    expect(result?.lastSyncedAt).toBe("2026-04-28T11:00:00.000Z");
  });

  it("isolates by profile", async () => {
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

    expect(
      (await repo.getBySourceAndProfile("train2go", "p1"))?.lastSyncedAt
    ).toBe("2026-04-28T10:00:00.000Z");
    expect(
      (await repo.getBySourceAndProfile("train2go", "p2"))?.lastSyncedAt
    ).toBe("2026-04-28T11:00:00.000Z");
  });

  it("isolates by source on the same profile", async () => {
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

    expect(
      (await repo.getBySourceAndProfile("train2go", "p1"))?.lastSyncedAt
    ).toBe("2026-04-28T10:00:00.000Z");
    expect(
      (await repo.getBySourceAndProfile("trainingpeaks", "p1"))?.lastSyncedAt
    ).toBe("2026-04-28T11:00:00.000Z");
  });

  it("deleteByProfile removes all entries for a profile across sources", async () => {
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

    await repo.deleteByProfile("p1");

    expect(await repo.getBySourceAndProfile("train2go", "p1")).toBeUndefined();
    expect(
      await repo.getBySourceAndProfile("trainingpeaks", "p1")
    ).toBeUndefined();
    expect(
      (await repo.getBySourceAndProfile("train2go", "p2"))?.lastSyncedAt
    ).toBe("2026-04-28T12:00:00.000Z");
  });
});
