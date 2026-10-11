import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PersistencePort } from "../ports/persistence-port";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import type { WorkoutState } from "../types/calendar-enums";
import type { KRD } from "../types/krd";
import { saveWorkoutEdits } from "./save-workout-edits";
import { makeWorkoutRecord } from "./test-helpers";

const T0 = "2026-10-01T08:00:00.000Z";
const T1 = new Date("2026-10-02T09:00:00.000Z");
const ID = "w-1";
const ORIGINAL = { version: "1.0", type: "structured_workout" } as KRD;
const EDITED = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: T0, sport: "running" },
} as KRD;

const seed = async (persistence: PersistencePort, state: WorkoutState) => {
  await persistence.workouts.put(
    makeWorkoutRecord({
      id: ID,
      state,
      date: "2026-10-05",
      krd: ORIGINAL,
      garminPushId: state === "pushed" ? "1700000" : null,
      updatedAt: T0,
      modifiedAt: null,
    })
  );
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T1);
});
afterEach(() => vi.useRealTimers());

describe("saveWorkoutEdits", () => {
  it("should move a pushed workout to modified with the edited KRD", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seed(persistence, "pushed");

    // Act
    const saved = await saveWorkoutEdits(persistence, ID, EDITED);

    // Assert
    expect(saved).toBe(true);
    expect(await persistence.workouts.getById(ID)).toMatchObject({
      state: "modified",
      krd: EDITED,
      modifiedAt: T1.toISOString(),
      updatedAt: T1.toISOString(),
    });
  });

  it("should keep a structured workout structured and store the edit", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seed(persistence, "structured");

    // Act
    await saveWorkoutEdits(persistence, ID, EDITED);

    // Assert
    expect(await persistence.workouts.getById(ID)).toMatchObject({
      state: "structured",
      krd: EDITED,
      modifiedAt: T1.toISOString(),
    });
  });

  it("should leave a workout deleted meanwhile deleted", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const saved = await saveWorkoutEdits(persistence, ID, EDITED);

    // Assert
    expect(saved).toBe(false);
    expect(await persistence.workouts.getById(ID)).toBeUndefined();
  });

  it("should keep a date another writer changed after the editor opened", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await seed(persistence, "ready");
    const opened = await persistence.workouts.getById(ID);
    await persistence.workouts.put({ ...opened!, date: "2026-10-09" });

    // Act
    await saveWorkoutEdits(persistence, ID, EDITED);

    // Assert
    expect(await persistence.workouts.getById(ID)).toMatchObject({
      date: "2026-10-09",
      krd: EDITED,
    });
  });
});
