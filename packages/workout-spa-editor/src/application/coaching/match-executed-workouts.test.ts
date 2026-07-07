import { describe, expect, it } from "vitest";

import type { ActivityRecord } from "../../types/activity-record";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { SessionMatch } from "../../types/session-match";
import { matchExecutedWorkouts } from "./match-executed-workouts";

const DAY = "2026-04-29";

const baseMatch = (overrides: Partial<SessionMatch> = {}): SessionMatch => ({
  id: "m-1",
  profileId: "p1",
  coachingActivityId: "p1:train2go:1",
  workoutId: "w-structured-1",
  date: DAY,
  createdAt: "2026-04-28T10:00:00.000Z",
  source: "auto-coaching",
  executedWorkoutIds: [],
  ...overrides,
});

const workout = (overrides: Partial<WorkoutRecord> = {}): WorkoutRecord =>
  ({
    id: "w-x",
    date: DAY,
    sport: "cycling",
    source: "train2go",
    state: "ready",
    raw: { title: "Ride", duration: { value: 3600, unit: "s" } },
    ...overrides,
  }) as WorkoutRecord;

const activity = (overrides: Partial<ActivityRecord> = {}): ActivityRecord =>
  ({
    id: "a-x",
    profileId: "p1",
    date: DAY,
    sport: "cycling",
    sourceBridgeId: "garmin-bridge",
    externalId: "hash-x",
    linkedWorkoutId: null,
    krd: null,
    createdAt: "2026-04-28T10:00:00.000Z",
    ...overrides,
  }) as ActivityRecord;

const canonical = (raw: string): string | null => {
  if (!raw) return null;
  const key = raw.toLowerCase();
  if (["bike", "cycling"].includes(key)) return "cycling";
  if (["run", "running"].includes(key)) return "running";
  return null;
};

describe("matchExecutedWorkouts", () => {
  it("should return empty when no sessionMatches exist", () => {
    // Arrange
    const input = {
      sessionMatches: [] as SessionMatch[],
      workouts: [workout({ id: "w-1" })],
      activities: [activity()],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should append a same-day same-sport executed activity to a match", () => {
    // Arrange
    const structured = workout({ id: "w-structured-1" });
    const executed = activity({ id: "a-exec-1" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured],
      activities: [executed],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([{ matchId: "m-1", toAppend: ["a-exec-1"] }]);
  });

  it("should skip an activity already listed in executedWorkoutIds (dedup)", () => {
    // Arrange
    const structured = workout({ id: "w-structured-1" });
    const executed = activity({ id: "a-exec-1" });
    const match = baseMatch({ executedWorkoutIds: ["a-exec-1"] });
    const input = {
      sessionMatches: [match],
      workouts: [structured],
      activities: [executed],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should never append the match's own structured workoutId", () => {
    // Arrange
    // An activity whose renderable id collides with the structured slot
    // must be skipped by the `taken` guard.
    const structured = workout({ id: "w-structured-1" });
    const collide = activity({ id: "w-structured-1" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured],
      activities: [collide],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should append multiple executed activities on the same day for one match (1-N)", () => {
    // Arrange
    const structured = workout({ id: "w-structured-1" });
    const e1 = activity({ id: "a-exec-1" });
    const e2 = activity({ id: "a-exec-2" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured],
      activities: [e1, e2],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([
      { matchId: "m-1", toAppend: ["a-exec-1", "a-exec-2"] },
    ]);
  });

  it("should reject an executed activity whose canonical sport differs", () => {
    // Arrange
    const structured = workout({ id: "w-structured-1", sport: "cycling" });
    const wrongSport = activity({ id: "a-run", sport: "running" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured],
      activities: [wrongSport],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should reject an executed activity whose canonical sport is null", () => {
    // Arrange
    const structured = workout({ id: "w-structured-1" });
    const unknown = activity({ id: "a-?", sport: "kayak" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured],
      activities: [unknown],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should skip the match when the structured workout's sport is unknown", () => {
    // Arrange
    const structured = workout({ id: "w-structured-1", sport: "kayak" });
    const executed = activity({ id: "a-exec-1" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured],
      activities: [executed],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should skip the match when its structured workout is missing", () => {
    // Arrange
    const executed = activity({ id: "a-exec-1" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [],
      activities: [executed],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should reject an executed activity on a different date", () => {
    // Arrange
    const structured = workout({ id: "w-structured-1" });
    const otherDay = activity({ id: "a-exec-1", date: "2026-04-30" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured],
      activities: [otherDay],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should append a twin activity's linked WorkoutRecord id, not its own id", () => {
    // Arrange
    // Historical dual-write: the activity carries the twin WorkoutRecord id,
    // so the renderable executed slot is the twin (matched exactly once).
    const structured = workout({ id: "w-structured-1" });
    const twin = workout({ id: "w-exec-1", source: "kaiord" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured, twin],
      activities: [activity({ linkedWorkoutId: "w-exec-1" })],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([{ matchId: "m-1", toAppend: ["w-exec-1"] }]);
  });

  it("should append a source-only activity's own id when it has no twin", () => {
    // Arrange
    const structured = workout({ id: "w-structured-1" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured],
      activities: [activity({ id: "a-garmin", sport: "cycling" })],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([{ matchId: "m-1", toAppend: ["a-garmin"] }]);
  });

  it("should NOT match a bare executed workout with no activity (heuristic retired)", () => {
    // Arrange
    const structured = workout({ id: "w-structured-1" });
    const bareExecuted = workout({ id: "w-exec-1", source: "garmin" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured, bareExecuted],
      activities: [],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([]);
  });
});
