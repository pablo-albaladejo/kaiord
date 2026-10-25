import { describe, expect, it } from "vitest";

import { isMovableSession } from "./session-movability";
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
