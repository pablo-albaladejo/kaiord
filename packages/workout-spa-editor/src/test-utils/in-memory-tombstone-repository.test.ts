import { describe, expect, it } from "vitest";

import { createInMemoryTombstoneRepository } from "./in-memory-tombstone-repository";

const tombstone = (id: string, deletedAt: string) => ({
  table: "workouts",
  id,
  deletedAt,
});

describe("createInMemoryTombstoneRepository", () => {
  it("should store and read a tombstone by [table+id]", async () => {
    // Arrange
    const repo = createInMemoryTombstoneRepository();

    // Act
    await repo.put(tombstone("w-1", "2026-05-20T00:00:00Z"));
    const found = await repo.get("workouts", "w-1");

    // Assert
    expect(found).toMatchObject({ table: "workouts", id: "w-1" });
  });

  it("should return undefined for an unknown key", async () => {
    // Arrange
    const repo = createInMemoryTombstoneRepository();

    // Act
    const found = await repo.get("workouts", "missing");

    // Assert
    expect(found).toBeUndefined();
  });

  it("should list every stored tombstone", async () => {
    // Arrange
    const repo = createInMemoryTombstoneRepository();
    await repo.put(tombstone("w-1", "2026-05-20T00:00:00Z"));
    await repo.put(tombstone("w-2", "2026-05-21T00:00:00Z"));

    // Act
    const all = await repo.list();

    // Assert
    expect(all).toHaveLength(2);
  });

  it("should prune tombstones older than the cutoff", async () => {
    // Arrange
    const repo = createInMemoryTombstoneRepository();
    await repo.put(tombstone("old", "2026-01-01T00:00:00Z"));
    await repo.put(tombstone("new", "2026-05-21T00:00:00Z"));

    // Act
    await repo.prune("2026-03-01T00:00:00Z");
    const all = await repo.list();

    // Assert
    expect(all.map((t) => t.id)).toEqual(["new"]);
  });
});
