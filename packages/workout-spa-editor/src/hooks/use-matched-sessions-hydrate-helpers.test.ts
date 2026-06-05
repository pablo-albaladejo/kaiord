import { describe, expect, it } from "vitest";

import type { WorkoutRecord } from "../types/calendar-record";
import type { SessionMatch } from "../types/session-match";
import {
  collectWorkoutIds,
  resolveExecuted,
} from "./use-matched-sessions-hydrate-helpers";

const match = (overrides: Partial<SessionMatch> = {}): SessionMatch => ({
  id: "m-1",
  profileId: "p1",
  coachingActivityId: "p1:train2go:1",
  workoutId: "w-1",
  date: "2026-04-29",
  createdAt: "2026-04-28T10:00:00.000Z",
  source: "auto-coaching",
  executedWorkoutIds: [],
  ...overrides,
});

const workout = (id: string): WorkoutRecord =>
  ({
    id,
    date: "2026-04-29",
    sport: "cycling",
    source: "garmin",
    sourceId: id,
    state: "structured",
    raw: {},
  }) as WorkoutRecord;

describe("collectWorkoutIds", () => {
  it("should include the structured workout id and every executed id", () => {
    // Arrange
    const matches = [
      match({ workoutId: "w-1", executedWorkoutIds: ["w-2", "w-3"] }),
    ];

    // Act
    const ids = collectWorkoutIds(matches).sort();

    // Assert
    expect(ids).toEqual(["w-1", "w-2", "w-3"]);
  });

  it("should tolerate a raw row whose executedWorkoutIds is absent", () => {
    // Arrange
    // Dexie returns un-parsed rows; a pre-v12 row may lack the field.
    const matches = [
      match({
        workoutId: "w-1",
        executedWorkoutIds: undefined as unknown as string[],
      }),
    ];

    // Act
    const ids = collectWorkoutIds(matches);

    // Assert
    expect(ids).toEqual(["w-1"]);
  });
});

describe("resolveExecuted", () => {
  it("should resolve executed ids to records, dropping unknown ids", () => {
    // Arrange
    const w2 = workout("w-2");
    const wById = new Map([["w-2", w2]]);
    const m = match({ executedWorkoutIds: ["w-2", "w-missing"] });

    // Act
    const resolved = resolveExecuted(m, wById);

    // Assert
    expect(resolved).toEqual([w2]);
  });

  it("should return an empty list when executedWorkoutIds is absent", () => {
    // Arrange
    const m = match({ executedWorkoutIds: undefined as unknown as string[] });

    // Act
    const resolved = resolveExecuted(m, new Map());

    // Assert
    expect(resolved).toEqual([]);
  });
});
