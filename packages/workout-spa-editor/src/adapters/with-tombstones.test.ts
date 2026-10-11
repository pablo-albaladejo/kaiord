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

  it("should record no tombstone for a no-op delete of a missing record", async () => {
    // Arrange
    const base = createInMemoryPersistence();
    const port = withTombstones(base);

    // Act
    await port.workouts.delete("never-existed");
    const tombstone = await port.tombstones.get("workouts", "never-existed");

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

  it.each([
    {
      table: "intakeEntries" as const,
      row: {
        id: "i-1",
        profileId: "p-1",
        date: "2026-10-10",
        loggedAt: "2026-10-10T08:00:00.000Z",
        updatedAt: "2026-10-10T08:00:00.000Z",
        kcal: 500,
        proteinG: 30,
        carbG: 60,
        fatG: 15,
      },
    },
    {
      table: "intakePresets" as const,
      row: {
        id: "i-1",
        profileId: "p-1",
        label: "Oats",
        kcal: 350,
        proteinG: 12,
        carbG: 55,
        fatG: 7,
        createdAt: "2026-10-01T08:00:00.000Z",
        updatedAt: "2026-10-01T08:00:00.000Z",
      },
    },
  ])(
    "should record a tombstone when an $table row is deleted",
    async ({ table, row }) => {
      // Arrange
      const port = withTombstones(createInMemoryPersistence());
      await port[table].put(row as never);

      // Act
      await port[table].delete("i-1");
      const tombstone = await port.tombstones.get(table, "i-1");

      // Assert
      expect(tombstone).toMatchObject({ table, id: "i-1" });
    }
  );
});
