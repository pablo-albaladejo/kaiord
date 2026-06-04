import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { KRD } from "../../../types/krd";
import { persistScratchWorkout } from "./persist-scratch-workout";

const KRD_FIXTURE: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-05-30T00:00:00.000Z", sport: "cycling" },
  extensions: { structured_workout: { sport: "cycling", steps: [] } },
};

const input = {
  krd: KRD_FIXTURE,
  date: "2026-06-01",
  profileId: "p1",
  sport: "cycling",
};

describe("persistScratchWorkout", () => {
  it("should persist a scratch workout on the given date via the workouts port", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    await persistScratchWorkout(persistence, input);

    // Assert
    const found = await persistence.workouts.getByDateRange(
      "2026-06-01",
      "2026-06-01"
    );
    expect(found).toHaveLength(1);
    expect(found[0].date).toBe("2026-06-01");
  });

  it("should set source to scratch and state to structured", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const record = await persistScratchWorkout(persistence, input);

    // Assert
    expect(record.source).toBe("scratch");
    expect(record.state).toBe("structured");
  });

  it("should reject an impossible calendar date at the persist boundary", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const badInput = { ...input, date: "2026-13-45" };

    // Act
    const run = persistScratchWorkout(persistence, badInput);

    // Assert
    await expect(run).rejects.toThrow(/invalid calendar date/i);
  });

  it("should return a record with a crypto uuid id", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const record = await persistScratchWorkout(persistence, input);

    // Assert
    expect(record.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });
});
