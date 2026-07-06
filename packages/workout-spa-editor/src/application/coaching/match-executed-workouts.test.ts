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
    source: "garmin",
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
    sourceBridgeId: "fit-import",
    externalId: "hash-x",
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
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should append a same-day same-sport executed workout to a match", () => {
    // Arrange
    const structured = workout({ id: "w-structured-1", source: "train2go" });
    const executed = workout({ id: "w-exec-1", source: "garmin" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured, executed],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([{ matchId: "m-1", toAppend: ["w-exec-1"] }]);
  });

  it("should skip a workout already listed in executedWorkoutIds (dedup)", () => {
    // Arrange
    const structured = workout({ id: "w-structured-1", source: "train2go" });
    const executed = workout({ id: "w-exec-1", source: "garmin" });
    const match = baseMatch({ executedWorkoutIds: ["w-exec-1"] });
    const input = {
      sessionMatches: [match],
      workouts: [structured, executed],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should never append the structured workoutId itself", () => {
    // Arrange
    // The structured side is the matched workout — exclude it even
    // when its source is non-train2go (defensive).
    const structured = workout({ id: "w-structured-1", source: "garmin" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should append multiple executeds on the same day for the same match (1-N)", () => {
    // Arrange
    const structured = workout({ id: "w-structured-1", source: "train2go" });
    const executed1 = workout({ id: "w-exec-1", source: "garmin" });
    const executed2 = workout({ id: "w-exec-2", source: "fit" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured, executed1, executed2],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([
      { matchId: "m-1", toAppend: ["w-exec-1", "w-exec-2"] },
    ]);
  });

  it("should reject an executed whose canonical sport differs from the match", () => {
    // Arrange
    const structured = workout({
      id: "w-structured-1",
      sport: "cycling",
      source: "train2go",
    });
    const wrongSport = workout({
      id: "w-exec-run",
      sport: "running",
      source: "garmin",
    });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured, wrongSport],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should reject an executed whose canonical sport is null (unknown)", () => {
    // Arrange
    const structured = workout({ id: "w-structured-1", source: "train2go" });
    const unknown = workout({ id: "w-exec-?", sport: "kayak" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured, unknown],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should skip the match when the structured workout's sport is unknown", () => {
    // Arrange
    const structured = workout({
      id: "w-structured-1",
      sport: "kayak",
      source: "train2go",
    });
    const executed = workout({ id: "w-exec-1", source: "garmin" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured, executed],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should skip the match when its structured workout is missing", () => {
    // Arrange
    const executed = workout({ id: "w-exec-1", source: "garmin" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [executed],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should reject an executed on a different date", () => {
    // Arrange
    const structured = workout({ id: "w-structured-1", source: "train2go" });
    const otherDay = workout({
      id: "w-exec-1",
      date: "2026-04-30",
      source: "garmin",
    });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured, otherDay],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([]);
  });

  it("should dedup an activity against its co-written executed workout", () => {
    // Arrange
    // New drop: the FIT file produced BOTH an activity and a WorkoutRecord
    // for the same event — match once, not twice (test d).
    const structured = workout({ id: "w-structured-1", source: "train2go" });
    const executed = workout({ id: "w-exec-1", source: "garmin" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured, executed],
      activities: [activity({ externalId: "hash-1" })],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([{ matchId: "m-1", toAppend: ["w-exec-1"] }]);
  });

  it("should append an activity's own id when no executed workout represents it", () => {
    // Arrange
    // Forward-ready (F5): a garmin-only activity with no co-written workout.
    const structured = workout({ id: "w-structured-1", source: "train2go" });
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

  it("should match a legacy executed workout when no activity exists", () => {
    // Arrange
    const structured = workout({ id: "w-structured-1", source: "train2go" });
    const executed = workout({ id: "w-exec-1", source: "garmin" });
    const input = {
      sessionMatches: [baseMatch()],
      workouts: [structured, executed],
      activities: [],
      canonicalSport: canonical,
    };

    // Act
    const result = matchExecutedWorkouts(input);

    // Assert
    expect(result).toEqual([{ matchId: "m-1", toAppend: ["w-exec-1"] }]);
  });
});
