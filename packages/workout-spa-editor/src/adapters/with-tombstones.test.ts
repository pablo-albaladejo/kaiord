import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import { withTombstones } from "./with-tombstones";

const makeWorkout = (id: string) => ({
  id,
  profileId: "p-1",
  date: "2026-05-20",
  state: "planned" as const,
  workout: { name: "w", steps: [] },
  updatedAt: "2026-05-20T00:00:00Z",
});

describe("withTombstones", () => {
  it("should record a tombstone when a workout is deleted", async () => {
    // Arrange
    const base = createInMemoryPersistence();
    const port = withTombstones(base);
    await port.workouts.put(makeWorkout("w-1") as never);

    // Act
    await port.workouts.delete("w-1");
    const tombstone = await port.tombstones.get("workouts", "w-1");

    // Assert
    expect(tombstone).toMatchObject({ table: "workouts", id: "w-1" });
    expect(typeof tombstone?.deletedAt).toBe("string");
  });

  it("should record no tombstone when the delete rolls back", async () => {
    // Arrange
    const base = createInMemoryPersistence();
    const port = withTombstones(base);
    await port.workouts.put(makeWorkout("w-1") as never);

    // Act
    await expect(
      port.transaction(async () => {
        await port.workouts.delete("w-1");
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");
    const tombstone = await port.tombstones.get("workouts", "w-1");

    // Assert
    expect(tombstone).toBeUndefined();
  });

  it("should record a tombstone for a deleted template via the same call site", async () => {
    // Arrange
    const base = createInMemoryPersistence();
    const port = withTombstones(base);
    await port.templates.put({ id: "t-1", sport: "cycling" } as never);

    // Act
    await port.templates.delete("t-1");
    const tombstone = await port.tombstones.get("templates", "t-1");

    // Assert
    expect(tombstone).toMatchObject({ table: "templates", id: "t-1" });
  });
});
