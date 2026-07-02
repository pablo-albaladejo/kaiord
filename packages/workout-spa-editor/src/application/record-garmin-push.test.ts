import { describe, expect, it } from "vitest";

import type { WorkoutRecord } from "../types/calendar-record";
import { recordGarminPush } from "./record-garmin-push";

const makeWorkout = (overrides: Partial<WorkoutRecord> = {}): WorkoutRecord =>
  ({
    id: "workout-1",
    profileId: "profile-1",
    date: "2026-05-14",
    sport: "cycling",
    source: "manual",
    sourceId: null,
    planId: null,
    state: "ready",
    raw: null,
    krd: { name: "stub" },
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: "2026-05-14T08:00:00.000Z",
    modifiedAt: null,
    updatedAt: "2026-05-14T08:00:00.000Z",
    ...overrides,
  }) as unknown as WorkoutRecord;

describe("recordGarminPush", () => {
  it("should transition a ready workout to pushed with the push id", () => {
    // Arrange
    const workout = makeWorkout({ state: "ready" });

    // Act
    const result = recordGarminPush(workout, "gw-42");

    // Assert
    expect(result.state).toBe("pushed");
    expect(result.garminPushId).toBe("gw-42");
  });

  it("should transition a modified workout to pushed with the push id", () => {
    // Arrange
    const workout = makeWorkout({ state: "modified" });

    // Act
    const result = recordGarminPush(workout, "gw-43");

    // Assert
    expect(result.state).toBe("pushed");
    expect(result.garminPushId).toBe("gw-43");
  });

  it("should record the push id without changing state when the transition is not legal", () => {
    // Arrange
    const workout = makeWorkout({ state: "structured" });

    // Act
    const result = recordGarminPush(workout, "gw-44");

    // Assert
    expect(result.state).toBe("structured");
    expect(result.garminPushId).toBe("gw-44");
  });

  it("should advance updatedAt but not modifiedAt when recording outside the state machine", () => {
    // Arrange
    const workout = makeWorkout({ state: "structured" });

    // Act
    const result = recordGarminPush(workout, "gw-45");

    // Assert
    expect(result.updatedAt).not.toBe(workout.updatedAt);
    expect(result.modifiedAt).toBe(workout.modifiedAt);
  });
});
