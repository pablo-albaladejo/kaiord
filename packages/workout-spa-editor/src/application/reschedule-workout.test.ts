import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import type { WorkoutRecord } from "../types/calendar-record";
import { rescheduleWorkout, WorkoutNotFoundError } from "./reschedule-workout";

const NOW = "2026-04-28T10:00:00.000Z";

const makeWorkout = (id: string, date: string): WorkoutRecord => ({
  id,
  profileId: "p1",
  date,
  sport: "cycling",
  source: "manual",
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
  createdAt: NOW,
  modifiedAt: null,
  updatedAt: NOW,
});

describe("rescheduleWorkout", () => {
  it("should update the workout's date to the target day", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const repo = persistence.workouts;
    await repo.put(makeWorkout("w1", "2026-04-13"));

    // Act
    await rescheduleWorkout(persistence, "w1", "2026-04-20");

    // Assert
    const updated = await repo.getById("w1");
    expect(updated?.date).toBe("2026-04-20");
  });

  it("should preserve every non-date field on the workout", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const repo = persistence.workouts;
    const original = makeWorkout("w1", "2026-04-13");
    await repo.put(original);

    // Act
    await rescheduleWorkout(persistence, "w1", "2026-04-20");

    // Assert
    const updated = await repo.getById("w1");
    expect(updated).toEqual({ ...original, date: "2026-04-20" });
  });

  it("should throw WorkoutNotFoundError when the workout does not exist", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act

    // Assert
    await expect(
      rescheduleWorkout(persistence, "missing", "2026-04-20")
    ).rejects.toBeInstanceOf(WorkoutNotFoundError);
  });
});
