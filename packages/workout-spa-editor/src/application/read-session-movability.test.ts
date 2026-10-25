import { describe, expect, it } from "vitest";

import { readSessionMovability } from "./read-session-movability";
import {
  coachWorkout,
  PROFILE,
  seedSession,
} from "./session-move.test-fixtures";

describe("readSessionMovability", () => {
  it("should find a pending matched session movable", async () => {
    // Arrange
    const persistence = await seedSession();

    // Act
    const verdict = await readSessionMovability(
      persistence,
      PROFILE,
      coachWorkout()
    );

    // Assert
    expect(verdict).toEqual({ movable: true });
  });

  it("should refuse a session the coach marked completed", async () => {
    // Arrange
    const persistence = await seedSession({
      activity: { status: "completed" },
    });

    // Act
    const verdict = await readSessionMovability(
      persistence,
      PROFILE,
      coachWorkout()
    );

    // Assert
    expect(verdict).toEqual({ movable: false, reason: "completed" });
  });

  it("should refuse a session whose match holds an executed recording", async () => {
    // Arrange
    const persistence = await seedSession({
      match: { executedWorkoutIds: ["rec"] },
    });

    // Act
    const verdict = await readSessionMovability(
      persistence,
      PROFILE,
      coachWorkout()
    );

    // Assert
    expect(verdict).toEqual({ movable: false, reason: "executed" });
  });

  it("should find an unmatched workout movable", async () => {
    // Arrange
    const persistence = await seedSession({ match: null });

    // Act
    const verdict = await readSessionMovability(
      persistence,
      PROFILE,
      coachWorkout()
    );

    // Assert
    expect(verdict).toEqual({ movable: true });
  });
});
