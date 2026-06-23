import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { createQueryWorkoutsTool } from "./query-workouts-tool";

const TODAY = "2026-06-13";

const record = (id: string, profileId: string, sport: string): WorkoutRecord =>
  ({
    id,
    profileId,
    date: "2026-06-01",
    sport,
    state: "raw",
    krd: null,
  }) as unknown as WorkoutRecord;

const seed = async (
  persistence: ReturnType<typeof createInMemoryPersistence>
) => {
  await persistence.workouts.put(record("w1", "p1", "cycling"));
  await persistence.workouts.put(record("w2", "p1", "running"));
  await persistence.workouts.put(record("w3", "p2", "cycling"));
};

describe("createQueryWorkoutsTool", () => {
  it("should return only the active profile's workouts", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seed(persistence);
    const tool = createQueryWorkoutsTool({
      persistence,
      profileId: "p1",
      today: TODAY,
    });

    // Act
    const result = (await tool.execute({})) as { count: number };

    // Assert
    expect(result.count).toBe(2);
  });

  it("should filter to a single sport when requested", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seed(persistence);
    const tool = createQueryWorkoutsTool({
      persistence,
      profileId: "p1",
      today: TODAY,
    });

    // Act
    const result = (await tool.execute({ sport: "running" })) as {
      count: number;
    };

    // Assert
    expect(result.count).toBe(1);
  });

  it("should echo the clamped range used", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seed(persistence);
    const tool = createQueryWorkoutsTool({
      persistence,
      profileId: "p1",
      today: TODAY,
    });

    // Act
    const result = (await tool.execute({
      dateFrom: "2026-06-01",
      dateTo: TODAY,
    })) as {
      range_used: { from: string; to: string };
    };

    // Assert
    expect(result.range_used).toEqual({ from: "2026-06-01", to: TODAY });
  });

  it("should be a read tool that does not require confirmation", () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const tool = createQueryWorkoutsTool({
      persistence,
      profileId: "p1",
      today: TODAY,
    });

    // Assert
    expect(tool.requiresConfirmation).toBe(false);
  });
});
