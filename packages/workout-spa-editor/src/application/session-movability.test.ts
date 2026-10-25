import { describe, expect, it } from "vitest";

import { isAthleteMoved, isMovableSession } from "./session-movability";
import { coachWorkout } from "./session-move.test-fixtures";

const session = (
  overrides: Partial<Parameters<typeof isMovableSession>[0]> = {}
) => ({
  workout: coachWorkout(),
  activity: { status: "pending" as const },
  executed: [],
  match: { executedWorkoutIds: [] },
  ...overrides,
});

describe("isMovableSession", () => {
  it("should allow a pending session with no executed slot", () => {
    // Arrange
    const input = session();

    // Act
    const verdict = isMovableSession(input);

    // Assert
    expect(verdict).toEqual({ movable: true });
  });

  it("should refuse a session with an executed recording", () => {
    // Arrange
    const input = session({ executed: [coachWorkout({ id: "rec" })] });

    // Act
    const verdict = isMovableSession(input);

    // Assert
    expect(verdict).toEqual({ movable: false, reason: "executed" });
  });

  it("should refuse a session whose match holds an executed id not hydrated", () => {
    // Arrange
    const input = session({ match: { executedWorkoutIds: ["rec"] } });

    // Act
    const verdict = isMovableSession(input);

    // Assert
    expect(verdict).toEqual({ movable: false, reason: "executed" });
  });

  it("should refuse a session whose activity is completed", () => {
    // Arrange
    const input = session({ activity: { status: "completed" } });

    // Act
    const verdict = isMovableSession(input);

    // Assert
    expect(verdict).toEqual({ movable: false, reason: "completed" });
  });

  it("should refuse a projected workout", () => {
    // Arrange
    const input = session({
      workout: { ...coachWorkout(), projectedFromActivity: true } as never,
    });

    // Act
    const verdict = isMovableSession(input);

    // Assert
    expect(verdict).toEqual({ movable: false, reason: "projected" });
  });
});

describe("isAthleteMoved", () => {
  it("should flag a workout off the coach's day", () => {
    // Arrange
    const workout = coachWorkout({
      date: "2026-10-08",
      coachDate: "2026-10-06",
    });

    // Act
    const moved = isAthleteMoved(workout);

    // Assert
    expect(moved).toBe(true);
  });

  it("should not flag a workout on the coach's day or one with no coach day", () => {
    // Arrange
    const onDay = coachWorkout({ date: "2026-10-06", coachDate: "2026-10-06" });
    const own = coachWorkout({ coachDate: undefined });

    // Act
    const verdicts = [isAthleteMoved(onDay), isAthleteMoved(own)];

    // Assert
    expect(verdicts).toEqual([false, false]);
  });
});
