/**
 * Split stays split: the athlete's split is
 * recorded on the Workout, so nothing pairs it with its Coaching Activity
 * again: the Activity is "To prepare" and the Workout stands on its own.
 */
import { describe, expect, it } from "vitest";

import { CrossProfileMatchError } from "../../types/session-match-errors";
import {
  ACTIVITY_ID,
  PROFILE,
  seedSession,
} from "../session-move.test-fixtures";
import { splitCoachingWorkout } from "./split-coaching-workout";

const NOW = "2026-11-25T10:00:00.000Z";

const depsOf = (persistence: Awaited<ReturnType<typeof seedSession>>) => ({
  ...persistence,
  clock: () => NOW,
});

describe("splitCoachingWorkout", () => {
  it("should remove the Match and detach the Workout built from the Activity", async () => {
    // Arrange
    const persistence = await seedSession();

    // Act
    await splitCoachingWorkout(depsOf(persistence), {
      profileId: PROFILE,
      matchId: "m",
    });

    // Assert
    expect(
      await persistence.sessionMatch.getByActivityId(PROFILE, ACTIVITY_ID)
    ).toBeUndefined();
    const workout = await persistence.workouts.getById("w");
    expect(workout?.sourceId).toBeNull();
    expect(workout?.updatedAt).toBe(NOW);
    expect(
      await persistence.workouts.getBySourceId("train2go", `${PROFILE}:77`)
    ).toBeUndefined();
  });

  it("should keep the provenance of a Workout matched by hand", async () => {
    // Arrange
    const persistence = await seedSession({
      workout: { source: "garmin", sourceId: "g-99" },
    });

    // Act
    await splitCoachingWorkout(depsOf(persistence), {
      profileId: PROFILE,
      matchId: "m",
    });

    // Assert
    expect((await persistence.workouts.getById("w"))?.sourceId).toBe("g-99");
  });

  it("should refuse a Match of another athlete", async () => {
    // Arrange
    const persistence = await seedSession();

    // Act
    const run = splitCoachingWorkout(depsOf(persistence), {
      profileId: "someone-else",
      matchId: "m",
    });

    // Assert
    await expect(run).rejects.toBeInstanceOf(CrossProfileMatchError);
  });
});
